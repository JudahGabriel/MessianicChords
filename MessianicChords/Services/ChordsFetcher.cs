using Google.Apis.Auth.OAuth2;
using Google.Apis.Auth.OAuth2.Mvc;
using Google.Apis.Drive.v2;
using Google.Apis.Drive.v2.Data;
using Google.Apis.Services;
using Google.Apis.Util.Store;
using MessianicChords.Common;
using MessianicChords.Models;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;

namespace MessianicChords.Services
{
    /// <summary>
    /// Connects to Google Drive and fetches the IDs of the chord sheet documents.
    /// </summary>
    public class ChordsFetcher
    {
        private readonly GoogleDriveApi driveApi;
        private static readonly string chordsFolderId = ConfigurationManager.AppSettings["messianicChordsFolderId"];

        public ChordsFetcher(GoogleDriveApi driveApi)
        {
            this.driveApi = driveApi;
        }

        /// <summary>
        /// Fetches the chord sheets from Google Drive.
        /// </summary>
        /// <param name="search"></param>
        /// <returns></returns>
        public async Task<List<ChordSheetMetadata>> GetChords()
        {
            var searchResults = await this.driveApi.GetFolderContents(chordsFolderId);
            return searchResults
                .Select(i => new ChordSheetMetadata
                {
                    ETag = i.ETag,
                    GoogleDocId = i.Id
                })
                .ToList();
        }

        public Task<List<Change>> Changes(long? startChangeId)
        {
            return driveApi.GetChangesInFolder(chordsFolderId, startChangeId);
        }

        public async Task<ChordSheet> CreateChordSheet(string googleDocId)
        {
            var googleDoc = await driveApi.GetFile(googleDocId);
            
            var artistTitleKey = System.IO.Path.GetFileNameWithoutExtension(googleDoc.Title.Replace('/', ','))
                .Split(new[] { " - " }, StringSplitOptions.RemoveEmptyEntries);

            var chordSheet = new ChordSheet
            {
                Artist = artist,
                Song = song,
                Key = key,
                Address = googleDoc.AlternateLink,
                Created = googleDoc.CreatedDate ?? DateTime.UtcNow,
                ThumbnailUrl = googleDoc.ThumbnailLink,
                GoogleDocId = googleDoc.Id,
                LastUpdated = googleDoc.ModifiedDate ?? DateTime.UtcNow,
                ETag = googleDoc.ETag,
                Extension = !string.IsNullOrEmpty(googleDoc.FileExtension) ? googleDoc.FileExtension : googleDoc.FullFileExtension,
                PlainTextContents = "",
                HasFetchedPlainTextContents = false,
                DownloadUrl = $"https://docs.google.com/uc?id={googleDocId}&export=download"
            };

            if (string.IsNullOrWhiteSpace(chordSheet.Song))
            {
                chordSheet.Song = chordSheet.Artist;
                chordSheet.Artist = "Unknown Artist";
            }

            return chordSheet;
        }
    }
}