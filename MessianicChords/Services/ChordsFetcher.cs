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
        private readonly BaseClientService.Initializer googleCredentials;

        public ChordsFetcher(BaseClientService.Initializer googleCredentials)
        {
            this.googleCredentials = googleCredentials;
        }

        public static async Task<ChordFetcherAuthResult> Authorize(Controller controller)
        {
            var googleAuth = await new AuthorizationCodeMvcApp(controller, new OAuthFlow())
                .AuthorizeAsync(CancellationToken.None);
            if (googleAuth.Credential != null)
            {
                var initializer = new BaseClientService.Initializer
                {
                    HttpClientInitializer = googleAuth.Credential,
                    ApplicationName = "Messianic Chords",
                };

                return new ChordFetcherAuthResult { ChordsFetcher = new ChordsFetcher(initializer) };
            }

            return new ChordFetcherAuthResult { RedirectUrl = googleAuth.RedirectUri };
        }

        /// <summary>
        /// Fetches the chord sheets from Google Drive.
        /// </summary>
        /// <param name="search"></param>
        /// <returns></returns>
        public async Task<IList<ChordSheetMetadata>> GetChords(string search = null)
        {
            var driveService = new DriveService(this.googleCredentials);
            var chordsFolderId = Constants.MessianicChordsFolderId;
            var pageToken = default(string);
            var hasMore = true;
            var initialCapacity = string.IsNullOrEmpty(search) ? 1500 : 50;
            var ids = new List<ChordSheetMetadata>(initialCapacity);
            do
            {
                var chordsFolderContentsQuery = driveService.Children
                    .List(chordsFolderId);

                chordsFolderContentsQuery.PageToken = pageToken;
                if (string.IsNullOrEmpty(search))
                {
                    chordsFolderContentsQuery.Q = "trashed=false";
                }
                else
                {
                    chordsFolderContentsQuery.Q = string.Format("trashed=false and fullText contains '{0}'", search.Replace("'", "\\'"));
                }

                var chordsFolderContents = await chordsFolderContentsQuery.ExecuteAsync();
                var chordSheets = chordsFolderContents.Items.Select(i => new ChordSheetMetadata
                {
                    ETag = i.ETag,
                    GoogleDocId = i.Id
                });
                ids.AddRange(chordSheets);

                pageToken = chordsFolderContents.NextPageToken;
                hasMore = !string.IsNullOrEmpty(pageToken);
            } while (hasMore);

            return ids;
        }

        public async Task<List<Change>> Changes(long? startChangeId)
        {
            var driveService = new DriveService(this.googleCredentials);
            var chordsFolderId = Constants.MessianicChordsFolderId;
            var changesList = driveService.Changes.List();
            var pageToken = default(string);
            changesList.IncludeDeleted = false;
            changesList.IncludeSubscribed = true;
            changesList.StartChangeId = startChangeId;
            var results = new List<Change>();
            do
            {
                changesList.PageToken = pageToken;
                var changes = await changesList.ExecuteAsync();
                var changesInMessianicChords = changes.Items
                    .Where(c => c.File != null && c.File.Parents != null && c.File.Parents.Any(p => p.Id == chordsFolderId));
                results.AddRange(changesInMessianicChords);

                pageToken = changes.NextPageToken;
            } while (pageToken != null);            
            
            return results;
        }

        public async Task<ChordSheet> CreateChordSheet(string googleDocId)
        {
            var driveService = new DriveService(this.googleCredentials);
            var googleDoc = await driveService.Files.Get(googleDocId).ExecuteAsync();

            var artistTitleKey = System.IO.Path.GetFileNameWithoutExtension(googleDoc.Title.Replace('/', ','))
                .Split(new[] { " - " }, StringSplitOptions.RemoveEmptyEntries);
            return new ChordSheet
            {
                Artist = artistTitleKey.ElementAtOrDefault(0),
                Song = artistTitleKey.ElementAtOrDefault(1),
                Key = artistTitleKey.ElementAtOrDefault(2),
                Address = googleDoc.AlternateLink,
                ThumbnailUrl = googleDoc.ThumbnailLink,
                GoogleDocId = googleDoc.Id,
                LastUpdated = DateTime.UtcNow,
                ETag = googleDoc.ETag
            };
        }

        //private async Task<BaseClientService.Initializer> GetCredentials()
        //{
            
            //var secrets = new ClientSecrets
            //{
            //    ClientId = ConfigurationManager.AppSettings["googleClientId"],
            //    ClientSecret = ConfigurationManager.AppSettings["googleClientSecret"]
            //};

            //var credential = await GoogleWebAuthorizationBroker.AuthorizeAsync(
            //        secrets,
            //        new[] { DriveService.Scope.Drive },
            //        "TokenSession/MessianicChords",
            //        CancellationToken.None,
            //        new RavenBackedGoogleCredentialStore());

            //var initializer = new BaseClientService.Initializer
            //{
            //    HttpClientInitializer = credential,
            //    ApplicationName = "BitShuva-MessianicChords/1.0"
            //};

            //return initializer;
        //}
    }
}