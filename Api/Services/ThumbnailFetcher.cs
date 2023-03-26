using MessianicChords.Api.Services;
using MessianicChords.Models;
using MessianicChords.Services;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Raven.Client.Documents;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;

namespace MessianicChords.Services
{
    /// <summary>
    /// Runs periodically looking for <see cref="ChordSheet"/>s that need thumbnails fetched.
    /// </summary>
    public class ThumbnailFetcher : TimedBackgroundServiceBase
    {
        private readonly IDocumentStore docStore;
        private readonly HttpClient http;
        private readonly GoogleDriveChordsFetcher gDocFetcher;

        public const string ThumbnailName = "thumbnail.jpg";

        public ThumbnailFetcher(
            IDocumentStore docStore, 
            IHttpClientFactory httpFactory,
            GoogleDriveChordsFetcher gDocFetcher,
            ILogger<ThumbnailFetcher> logger)
            : base(TimeSpan.FromMinutes(5), TimeSpan.FromHours(1), logger)
        {
            this.docStore = docStore;
            this.http = httpFactory.CreateClient();
            this.gDocFetcher = gDocFetcher;
        }

        public override async Task DoWorkAsync(CancellationToken cancelToken)
        {
            try
            {
                var chords = await FetchDocsNeedingThumbs();
                await UpdateThumbnailsForDocs(chords);
            }
            catch (Exception error)
            {
                logger.LogError(error, "Thumbnail fetcher failed to run due to an error");
            }
        }

        private async Task UpdateThumbnailsForDocs(List<ChordSheet> chords)
        {
            foreach (var chart in chords)
            {
                if (cancelToken.IsCancellationRequested)
                {
                    break;
                }

                try
                {
                    await UpdateThumbnailForDoc(chart);
                }
                catch (Exception error)
                {
                    logger.LogWarning(error, "Unable to update thumbnail for doc {id}", chart.Id);
                }
            }
        }

        private async Task UpdateThumbnailForDoc(ChordSheet chart)
        {
            if (chart.GoogleDocId != null)
            {
                var temporalThumb = await TryGetThumbnail(chart.GoogleDocId, chart.GoogleDocResourceKey);
                await TrySaveThumbnailAsAttachment(chart, temporalThumb);
            }
        }

        private async Task TrySaveThumbnailAsAttachment(ChordSheet chart, Uri? temporalThumbUri)
        {
            using var session = this.docStore.OpenAsyncSession();
            try
            {
                // First, mark it as thumbnail fetched. This way, even if we can't fetch the thumbnail, it won't block future runs.
                session.Advanced.Patch<ChordSheet, bool>(chart.Id, c => c.HasFetchedThumbnail, true);
                await session.SaveChangesAsync();

                if (temporalThumbUri != null)
                {
                    using var temporalThumbStream = await this.http.GetStreamAsync(temporalThumbUri);
                    using var seekableStream = new MemoryStream(20000);
                    await temporalThumbStream.CopyToAsync(seekableStream);
                    seekableStream.Position = 0;

                    // Do we already have a thumbnail? Delete it.
                    var alreadyHasThumb = await session.Advanced.Attachments.ExistsAsync(chart.Id, ThumbnailName, this.cancelToken);
                    if (alreadyHasThumb)
                    {
                        session.Advanced.Attachments.Delete(chart.Id, ThumbnailName);
                    }

                    // Must save changes now, otherwise we get an error saying there's a deferred command to delete an attachment of the same name.
                    await session.SaveChangesAsync();

                    // Add the thumbnail stream as an attachment.
                    session.Advanced.Attachments.Store(chart.Id, ThumbnailName, seekableStream, "image/jpeg");
                    await session.SaveChangesAsync();
                }
            }
            catch (Exception error)
            {
                logger.LogWarning(error, "Unable to save thumbnail for chord chart {id} with temporal thumb {url}", chart.Id, temporalThumbUri);
            }         
        }

        private async Task<List<ChordSheet>> FetchDocsNeedingThumbs()
        {
            using var session = this.docStore.OpenAsyncSession();
            return await session.Query<ChordSheet>()
                .Where(c => !c.HasFetchedThumbnail)
                .OrderByDescending(c => c.LastUpdated)
                .Take(10)
                .ToListAsync();
        }

        private async Task<Uri?> TryGetThumbnail(string googleDocId, string? resourceKey)
        {
            try
            {
                var doc = await this.gDocFetcher.GetDocument(googleDocId, resourceKey);
                if (Uri.TryCreate(doc?.ThumbnailLink, UriKind.Absolute, out var uri))
                {
                    return uri;
                }

                return null;
            }
            catch (Exception gDocError)
            {
                logger.LogWarning(gDocError, "Tried to fetch thumbnail for Google Doc {id}, but an error occurred.", googleDocId);
                return null;
            }
        }
    }
}
