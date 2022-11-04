using MessianicChords.Models;
using MessianicChords.Services;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Raven.Client.Documents;
using Raven.Client.Documents.Session;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace MessianicChords.Api.Services
{
    /// <summary>
    /// Timed background service that periodically generates screenshots for chord charts.
    /// </summary>
    public class ScreenshotGenerator : TimedBackgroundServiceBase
    {
        private readonly IDocumentStore docStore;
        private readonly GoogleDriveChordsFetcher chordsFetcher;
        private readonly PdfToPng pdfToPng;
        private readonly BunnyCdnManagerService bunnyCdn;

        public ScreenshotGenerator(
            IDocumentStore docStore,
            GoogleDriveChordsFetcher gDocFetcher,
            PdfToPng pdfToPng,
            BunnyCdnManagerService bunnyCdn,
            ILogger<ScreenshotGenerator> logger)
            : base(TimeSpan.FromMinutes(5), TimeSpan.FromHours(1), logger)
        {
            this.docStore = docStore;
            this.chordsFetcher = gDocFetcher;
            this.pdfToPng = pdfToPng;
            this.bunnyCdn = bunnyCdn;
        }

        /// <summary>
        /// Runs the screenshot generator. Looks for chord sheets that need screenshots generated and runs them.
        /// </summary>
        /// <param name="cancelToken"></param>
        /// <returns></returns>
        public override async Task DoWorkAsync(CancellationToken cancelToken)
        {
            try
            {
                using var session = this.docStore.OpenAsyncSession();
                var docs = await this.GetDocsNeedingScreenshotsAsync(session, 3);
                foreach (var doc in docs)
                {
                    await TryCreateScreenshots(doc);
                    doc.HasFetchedScreenshots = true;
                }

                await session.SaveChangesAsync();
            }
            catch (Exception error)
            {
                logger.LogError(error, "Unable to generate screenshots due to an error");
            }
        }

        private async Task<List<ChordSheet>> GetDocsNeedingScreenshotsAsync(IAsyncDocumentSession dbSession, int take)
        {
            var chords = await dbSession.Query<ChordSheet>()
                .OrderByDescending(c => c.LastUpdated)
                .Where(c => c.HasFetchedScreenshots == false && c.Extension == "pdf")
                .Take(take)
                .ToListAsync();
            return chords;
        }

        private async Task TryCreateScreenshots(ChordSheet chordSheet)
        {
            // We only support PDFs currently.
            if (chordSheet.Extension != "pdf")
            {
                return;
            }

            // Try to create the screenshots from the PDF.
            List<Stream> pngStreams;
            try
            {
                using var pdfStream = await this.chordsFetcher.GetChordSheetStream(chordSheet.GoogleDocId, chordSheet.GoogleDocResourceKey);
                if (pdfStream == null)
                {
                    return;
                }

                pngStreams = await this.pdfToPng.Convert(pdfStream, $"{chordSheet.Artist} - {chordSheet.Song}.pdf");
                if (pngStreams.Count == 0)
                {
                    return;
                }
            }
            catch (Exception generateScreenshotsException)
            {
                logger.LogError(generateScreenshotsException, "Unable to generate screenshots for {id} due to exception.", chordSheet.Id);
                return;
            }

            // Try to upload these to our CDN.
            try
            {
                var pngUrls = new List<Uri>(pngStreams.Count);
                for (int i = 0; i < pngStreams.Count; i++)
                {
                    var idPrefix = "chordsheets/";
                    var idWithoutPrefix = chordSheet.Id![idPrefix.Length..]; // chordsheets/72-A -> 72-A
                    var fileName = $"{idWithoutPrefix}-{i + 1}.png";
                    var pngUrl = await bunnyCdn.UploadScreenshot(pngStreams[i], fileName);
                    pngUrls.Add(pngUrl);

                    // We're done with this PNG stream.
                    await pngStreams[i].DisposeAsync();
                }

                chordSheet.Screenshots = pngUrls;
            }
            catch (Exception uploadScreenshotsError)
            {
                logger.LogError(uploadScreenshotsError, "Unable to upload screenshots for {id} due to error", chordSheet.Id);
            }
            finally
            {
                foreach (var png in pngStreams)
                {
                    await png.DisposeAsync();
                }
            }
        }
    }
}
