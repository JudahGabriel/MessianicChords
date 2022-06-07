using Google.Apis.Drive.v3;
using Google.Apis.Drive.v3.Data;
using Google.Apis.Services;
using MessianicChords.Api.Models;
using MessianicChords.Common;
using MessianicChords.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;

namespace MessianicChords.Services
{
    /// <summary>
    /// Connects to Google Drive and fetches the IDs of the chord sheet documents.
    /// </summary>
    public class GoogleDriveChordsFetcher
    {
        private readonly DriveService driveApi;
        private readonly AppSettings settings;
        private readonly HttpClient http;
        private readonly ILogger<GoogleDriveChordsFetcher> logger;

        public GoogleDriveChordsFetcher(
            IHttpClientFactory httpClientFactory, 
            IOptions<AppSettings> settings,
            ILogger<GoogleDriveChordsFetcher> logger)
        {
            this.http = httpClientFactory.CreateClient();
            var initializer = new BaseClientService.Initializer
            {
                ApplicationName = "Messianic Chords",
                ApiKey = settings.Value.GDriveApiKey
            };
            
            this.driveApi = new DriveService(initializer);
            this.settings = settings.Value;
            this.logger = logger;
        }

        /// <summary>
        /// Fetches the chord sheets from Google Drive that have been created or modified since the specified date.
        /// </summary>
        /// <param name="date">The date from which to return chords sheets.</param>
        /// <returns>Chord sheets modified after the specified date.</returns>
        public async Task<List<ChordSheetMetadata>> GetUpdatedDocsSince(DateTime date)
        {
            var listReq = this.driveApi.Files.List();
            listReq.OrderBy = "modifiedTime desc";
            listReq.Q = $"'{this.settings.GDriveFolderId}' in parents and modifiedTime > '{date:O}' and (trashed = true or trashed = false)"; // Inside our Messianic chords folder, modified since the specified date, and isn't a folder itself
            listReq.PageSize = 100;
            listReq.IncludeItemsFromAllDrives = true;
            listReq.SupportsAllDrives = true;
            listReq.Fields = "files/id, files/modifiedTime, files/createdTime, files/resourceKey";
            listReq.AddExecuteInterceptor(new ResourceKeyInterceptor(this.settings.GDriveFolderId, this.settings.GDriveFolderResourceKey));

            var chordSheets = new List<ChordSheetMetadata>(50);
            var hasMoreResults = true;
            while(hasMoreResults)
            {
                var searchResults = await listReq.ExecuteAsync();
                var files = searchResults.Files
                    .Select(i => new ChordSheetMetadata
                    {
                        GoogleDocId = i.Id,
                        LastModified = i.ModifiedTime ?? i.CreatedTime ?? DateTime.UtcNow,
                        ResourceKey = i.ResourceKey
                    })
                    .ToArray();
                chordSheets.AddRange(files);
                listReq.PageToken = searchResults.NextPageToken;
                hasMoreResults = !string.IsNullOrEmpty(searchResults.NextPageToken);
            }

            return chordSheets;
        }

        /// <summary>
        /// Fetches all chord sheets from the chords folder in Google Drive.
        /// </summary>
        public async Task<HashSet<string>> GetAllDocsIds()
        {
            var listReq = this.driveApi.Files.List();
            listReq.OrderBy = "modifiedTime";
            listReq.Q = $"'{this.settings.GDriveFolderId}' in parents";
            listReq.IncludeItemsFromAllDrives = true;
            listReq.SupportsAllDrives = true;
            listReq.AddExecuteInterceptor(new ResourceKeyInterceptor(this.settings.GDriveFolderId, this.settings.GDriveFolderResourceKey));

            var allDocIds = new HashSet<string>(2000);
            var hasMoreResults = true;
            while (hasMoreResults)
            {
                var searchResults = await listReq.ExecuteAsync();
                var docIds = searchResults.Files
                    .Select(d => d.Id);
                foreach (var id in docIds)
                {
                    allDocIds.Add(id);
                }
                listReq.PageToken = searchResults.NextPageToken;
                hasMoreResults = !string.IsNullOrEmpty(searchResults.NextPageToken);
            }

            return allDocIds;
        }

        /// <summary>
        /// Fetches all chord sheets from the chords folder in Google Drive.
        /// </summary>
        public async Task<List<Google.Apis.Drive.v3.Data.File>> GetAllDocs()
        {
            var listReq = this.driveApi.Files.List();
            listReq.OrderBy = "modifiedTime";
            listReq.Q = $"'{this.settings.GDriveFolderId}' in parents";
            listReq.IncludeItemsFromAllDrives = true;
            listReq.SupportsAllDrives = true;
            listReq.AddExecuteInterceptor(new ResourceKeyInterceptor(this.settings.GDriveFolderId, this.settings.GDriveFolderResourceKey));

            var allDocs = new List<Google.Apis.Drive.v3.Data.File>(2000);
            var hasMoreResults = true;
            while (hasMoreResults)
            {
                var searchResults = await listReq.ExecuteAsync();
                allDocs.AddRange(searchResults.Files);
                listReq.PageToken = searchResults.NextPageToken;
                hasMoreResults = !string.IsNullOrEmpty(searchResults.NextPageToken);
            }

            return allDocs;
        }

        /// <summary>
        /// Gets the contents of the specified file.
        /// </summary>
        /// <param name="googleDocId">The ID of the Google Doc.</param>
        /// <param name="resourceKey">The resource key for the doc.</param>
        /// <returns>A stream of the file contents.</returns>
        public async Task<Stream> GetChordSheetStream(string googleDocId, string resourceKey)
        {
            var query = driveApi.Files.Get(googleDocId);
            query.Fields = "webContentLink";
            if (!string.IsNullOrEmpty(resourceKey))
            {
                query.AddExecuteInterceptor(new ResourceKeyInterceptor(googleDocId, resourceKey));
            }
            var gDoc = await query.ExecuteAsync();

            var bytes = await this.http.GetByteArrayAsync(gDoc.WebContentLink);
            var memStream = new MemoryStream(bytes)
            {
                Position = 0
            };
            return memStream;
        }

        public async Task<ChordSheet> CreateChordSheet(string googleDocId, string? resourceKey)
        {
            var query = driveApi.Files.Get(googleDocId);
            if (!string.IsNullOrEmpty(resourceKey))
            {
                query.AddExecuteInterceptor(new ResourceKeyInterceptor(googleDocId, resourceKey));
            }
            query.Fields = "*";
            
            var googleDoc = await query.ExecuteAsync();

            var artistTitleKey = System.IO.Path.GetFileNameWithoutExtension(googleDoc.Name.Replace('/', ','))
                .Split(new[] { " - " }, StringSplitOptions.RemoveEmptyEntries);
            var artist = artistTitleKey.ElementAtOrDefault(0) ?? "Unknown Artist";
            var songName = artistTitleKey.ElementAtOrDefault(1) ?? string.Empty; // handled below
            var key = artistTitleKey.ElementAtOrDefault(2);

            if (string.IsNullOrWhiteSpace(songName))
            {
                songName = artist;
                artist = "Unknown Artist";
            }

            (var englishName, var hebrewName) = songName.GetEnglishAndHebrew();
            var chavahSong = await TryGetChavahSong(englishName, artist);
            var downloadUrl = googleDoc.WebContentLink switch
            {
                var val when string.IsNullOrEmpty(val) => $"https://docs.google.com/uc?id={googleDocId}&export=download&resourcekey={googleDoc.ResourceKey}",
                _ => googleDoc.WebContentLink
            };

            var chordSheet = new ChordSheet
            {
                Artist = artist,
                Song = englishName,
                HebrewSongName = hebrewName,
                Key = key,
                Address = googleDoc.WebViewLink,
                Created = googleDoc.CreatedTime ?? DateTime.UtcNow,
                ThumbnailUrl = googleDoc.ThumbnailLink,
                GoogleDocId = googleDoc.Id,
                LastUpdated = googleDoc.ModifiedTime ?? DateTime.UtcNow,
                ETag = googleDoc.ETag,
                Extension = !string.IsNullOrEmpty(googleDoc.FileExtension) ? googleDoc.FileExtension : !string.IsNullOrEmpty(googleDoc.FullFileExtension) ? googleDoc.FullFileExtension : ".gdoc",
                PlainTextContents = "",
                HasFetchedPlainTextContents = false,
                DownloadUrl = downloadUrl,
                ChavahSongId = chavahSong?.Id,
                PagesCount = 1,
                PublishUri = null
            };
            
            return chordSheet;
        }

        private async Task<ChavahSong?> TryGetChavahSong(string songName, string artist)
        {
            try
            {
                var uri = new Uri($"https://messianicradio.com/api/songs/getsongbynameandartist?name={Uri.EscapeDataString(songName)}&artist={Uri.EscapeDataString(artist)}");
                var songJson = await http.GetStringAsync(uri);
                if (songJson == null)
                {
                    return null;
                }

                return JsonSerializer.Deserialize<ChavahSong>(songJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            }
            catch (Exception fetchOrDeserializeError)
            {
                logger.LogWarning(fetchOrDeserializeError, "Attempted to fetch Chavah song for {songName} by {artist}, but encountered an error.", songName, artist);
                return null;
            }
        }

        /// <summary>
        /// Marks a Google Doc file as published to the web. Returns the URL of the published doc.
        /// </summary>
        /// <param name="gDocId">The ID of the document.</param>
        /// <returns></returns>
        public async Task<Uri> PublishForWeb(string gDocId)
        {
            var revision = new Revision
            {
                Published = true,
                PublishAuto = true
            };
            var updateResult = driveApi.Revisions.Update(revision, gDocId, "head");
            var updatedRevision = await updateResult.ExecuteAsync();
            return new Uri(updatedRevision.PublishedLink);
        }

        /// <summary>
        /// Google Docs request interceptor that adds one or more resource keys to the request.
        /// </summary>
        private class ResourceKeyInterceptor : Google.Apis.Http.IHttpExecuteInterceptor
        {
            private readonly List<(string docId, string resourceKey)> docResourceIds;

            public ResourceKeyInterceptor(string docId, string resourceKey)
            {
                this.docResourceIds = new List<(string docId, string resourceKey)> { (docId, resourceKey) };
            }

            public ResourceKeyInterceptor(List<(string docId, string resourceKey)> docResourceIds)
            {
                this.docResourceIds = docResourceIds;
            }

            public Task InterceptAsync(HttpRequestMessage request, System.Threading.CancellationToken cancellationToken)
            {
                var headerValues = docResourceIds
                    .Select(kv => $"{kv.docId}/{kv.resourceKey}");
                request.Headers.Add("X-Goog-Drive-Resource-Keys", string.Join(',', headerValues));
                return Task.CompletedTask;
            }
        }
    }
}
