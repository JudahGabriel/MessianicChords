using Google.Apis.Drive.v3;
using Google.Apis.Drive.v3.Data;
using Google.Apis.Services;
using MessianicChords.Models;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
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

        public GoogleDriveChordsFetcher(
            IHttpClientFactory httpClientFactory, 
            IOptions<AppSettings> settings)
        {
            this.http = httpClientFactory.CreateClient();
            var initializer = new BaseClientService.Initializer
            {
                ApplicationName = "Messianic Chords",
                ApiKey = settings.Value.GDriveApiKey
            };
            
            this.driveApi = new DriveService(initializer);
            this.settings = settings.Value;
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
            listReq.Fields = "files/id, files/modifiedTime, files/createdTime";

            var chordSheets = new List<ChordSheetMetadata>(50);
            var hasMoreResults = true;
            while(hasMoreResults)
            {
                var searchResults = await listReq.ExecuteAsync();
                var files = searchResults.Files
                    .Select(i => new ChordSheetMetadata
                    {
                        GoogleDocId = i.Id,
                        LastModified = i.ModifiedTime ?? i.CreatedTime ?? DateTime.UtcNow
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
        /// Gets the contents of the specified file.
        /// </summary>
        /// <param name="googleDocId">The ID of the Google Doc.</param>
        /// <returns>A stream of the file contents.</returns>
        public async Task<Stream> GetChordSheetStream(string googleDocId)
        {
            var query = driveApi.Files.Get(googleDocId);
            query.Fields = "webContentLink";
            var gDoc = await query.ExecuteAsync();

            var bytes = await this.http.GetByteArrayAsync(gDoc.WebContentLink);
            var memStream = new MemoryStream(bytes);
            memStream.Position = 0;
            return memStream;
        }

        public async Task<ChordSheet> CreateChordSheet(string googleDocId)
        {
            var query = driveApi.Files.Get(googleDocId);
            query.Fields = "*";
            
            var googleDoc = await query.ExecuteAsync();

            var artistTitleKey = System.IO.Path.GetFileNameWithoutExtension(googleDoc.Name.Replace('/', ','))
                .Split(new[] { " - " }, StringSplitOptions.RemoveEmptyEntries);
            var artist = artistTitleKey.ElementAtOrDefault(0) ?? "Unknown Artist";
            var song = artistTitleKey.ElementAtOrDefault(1) ?? string.Empty; // handled below
            var key = artistTitleKey.ElementAtOrDefault(2);

            var chordSheet = new ChordSheet
            {
                Artist = artist,
                Song = song,
                Key = key,
                Address = googleDoc.WebViewLink,
                Created = googleDoc.CreatedTime ?? DateTime.UtcNow,
                ThumbnailUrl = googleDoc.ThumbnailLink,
                GoogleDocId = googleDoc.Id,
                LastUpdated = googleDoc.ModifiedTime ?? DateTime.UtcNow,
                ETag = googleDoc.ETag,
                Extension = !string.IsNullOrEmpty(googleDoc.FileExtension) ? googleDoc.FileExtension : googleDoc.FullFileExtension,
                PlainTextContents = "",
                HasFetchedPlainTextContents = false,
                DownloadUrl = $"https://docs.google.com/uc?id={googleDocId}&export=download",
                ChavahSongUri = null,
                PagesCount = 1,
                PublishUri = null
            };

            if (string.IsNullOrWhiteSpace(chordSheet.Song))
            {
                chordSheet.Song = chordSheet.Artist;
                chordSheet.Artist = "Unknown Artist";
            }

            return chordSheet;
        }

        /// <summary>
        /// Marks a Google Doc file as published to the web. Returns the URL of the publish
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
    }
}
