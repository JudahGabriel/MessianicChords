using Google.Apis.Auth.OAuth2.Mvc;
using Google.Apis.Drive.v2;
using Google.Apis.Drive.v2.Data;
using Google.Apis.Services;
using MessianicChords.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;

namespace MessianicChords.Services
{
    public class GoogleDriveApi
    {
        private readonly BaseClientService.Initializer initializer;
        private readonly DriveService driveService;

        public GoogleDriveApi(BaseClientService.Initializer initializer)
        {
            this.initializer = initializer;
            this.driveService = new DriveService(initializer);
        }

        public Task<List<ChildReference>> GetFolderContents(string folderId)
        {
            return SearchFolder(folderId, null);
        }

        /// <summary>
        /// Searches a folder on Google Drive for documents containing the specified search text.
        /// </summary>
        /// <param name="folderId">The ID of the folder on Google Drive</param>
        /// <param name="search">The search text.</param>
        /// <returns></returns>
        public async Task<List<ChildReference>> SearchFolder(string folderId, string search)
        {
            var pageToken = default(string);
            var hasMore = true;
            var children = new List<ChildReference>(100);
            do
            {
                var chordsFolderContentsQuery = driveService
                    .Children
                    .List(folderId);

                chordsFolderContentsQuery.PageToken = pageToken;
                if (string.IsNullOrEmpty(search))
                {
                    chordsFolderContentsQuery.Q = "trashed=false";
                }
                else
                {
                    chordsFolderContentsQuery.Q = string.Format("trashed=false and fullText contains '{0}'", search.Replace("'", "\\'"));
                }

                var folderContents = await chordsFolderContentsQuery.ExecuteAsync();
                children.AddRange(folderContents.Items);

                pageToken = folderContents.NextPageToken;
                hasMore = !string.IsNullOrEmpty(pageToken);
            } while (hasMore);

            return children;
        }

        public Task<File> GetFile(string googleDocId)
        {
            return driveService
                .Files
                .Get(googleDocId)
                .ExecuteAsync();
        }

        public async Task<System.IO.MemoryStream> DownloadFile(File file)
        {
            using (var webClient = new WebClient())
            {
                // Commented out: it appears there are some permissions issues with this. 
                // Instead, we're going to use the hardcoded URL that Google Drive website itself uses.
                //var downloadUrl = file.DownloadUrl;
                var downloadUrl = $"https://docs.google.com/uc?id={file.Id}&export=download";
                var docBytes = await webClient.DownloadDataTaskAsync(downloadUrl);
                return new System.IO.MemoryStream(docBytes);
            }
        }

        public async Task<List<Change>> GetChangesInFolder(string chordsFolderId, long? startChangeId)
        {
            var changesList = driveService.Changes.List();
            var pageToken = default(string);
            changesList.IncludeDeleted = false;
            changesList.IncludeSubscribed = false;
            changesList.StartChangeId = startChangeId;
            changesList.MaxResults = 100;
            changesList.Spaces = "drive";
            changesList.Fields = "etag,items,largestChangeId,nextPageToken";
            var results = new List<Change>();
            do
            {
                changesList.PageToken = pageToken;
                var changes = await changesList.ExecuteAsync();
                var changesInFolder = changes.Items
                    .Where(c => c.File != null && c.File.Parents != null && c.File.Parents.Any(p => p.Id == chordsFolderId))
                    .ToList();
                results.AddRange(changesInFolder);
                pageToken = changes.NextPageToken;
            } while (pageToken != null);

            return results;
        }

        public static async Task<GDriveAuthorizeResult> Authorize(Controller controller)
        {
            var flow = new OAuthFlow();
            var authResult = await new AuthorizationCodeMvcApp(controller, flow)
                .AuthorizeAsync(CancellationToken.None);
            if (authResult.Credential != null)
            {
                return new GDriveAuthorizeResult
                {
                    Initializer = new BaseClientService.Initializer
                    {
                        HttpClientInitializer = authResult.Credential,
                        ApplicationName = "Messianic Chords",
                    }
                };
            }

            return new GDriveAuthorizeResult { RedirectUri = authResult.RedirectUri };
        }
    }
}