using MessianicChords.Common;
using MessianicChords.Data;
using MessianicChords.Models;
using MessianicChords.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;
using Raven.Client;
using Raven.Client.Linq;

namespace MessianicChords.Controllers
{
    [RequireHttps]
    public class ChordSheetsController : RavenSessionController
    {
        // GET: Chords
        public async Task<ActionResult> Index(string id)
        {
            var chordSheet = await DbSession.LoadAsync<ChordSheet>(id);
            if (chordSheet == null)
            {
                return Redirect("/");
            }

            return View(chordSheet);
        }

        [HttpGet]
        public async Task<ActionResult> Search(string term)
        {
            var termWildcardEnd = term + "*";
            var matchingChords = await DbSession
                .Query<ChordSheet, ChordSheetSearch>()
                .Search(x => x.Song, termWildcardEnd, boost: 3, escapeQueryOptions: EscapeQueryOptions.AllowPostfixWildcard)
                .Search(x => x.Artist, termWildcardEnd, boost: 2, escapeQueryOptions: EscapeQueryOptions.AllowPostfixWildcard)
                .Search(x => x.PlainTextContents, termWildcardEnd, boost: 1, escapeQueryOptions: EscapeQueryOptions.AllowPostfixWildcard)
                .ToListAsync();
            
            return Json(new
            {
                Search = term,
                Results = matchingChords
            }, JsonRequestBehavior.AllowGet);
        }

        public async Task<ActionResult> Print(string id)
        {
            var chordSheet = await DbSession.LoadAsync<ChordSheet>(id);
            if (chordSheet == null)
            {
                return Redirect("/");
            }

            return View(chordSheet);
        }

        [HttpGet]
        public async Task<ActionResult> Sync()
        {
            // Syncing not working? Google refresh token coming back null?
            // To fix, follow these steps: http://stackoverflow.com/questions/10827920/not-receiving-google-oauth-refresh-token

            try
            {
                var authorizeResults = await GoogleDriveApi.Authorize(this);
                if (!string.IsNullOrEmpty(authorizeResults.RedirectUri))
                {
                    return new RedirectResult(authorizeResults.RedirectUri);
                }

                var chordsFetcher = new ChordsFetcher(new GoogleDriveApi(authorizeResults.Initializer));
                var syncRecord = await new GoogleDriveSync(chordsFetcher).Start();
                await DbSession.StoreAsync(syncRecord);

                return Json(syncRecord, JsonRequestBehavior.AllowGet);
            }
            catch (Exception error)
            {
                await DbSession.StoreAsync(new Log
                {
                    Message = error.ToString(),
                    Date = DateTime.UtcNow
                });
                await DbSession.SaveChangesAsync();

                throw;
            }
        }

        [HttpGet]
        public async Task<ActionResult> TempTouchDocx()
        {
            var authorizeResults = await GoogleDriveApi.Authorize(this);
            var driveApi = new GoogleDriveApi(authorizeResults.Initializer);
            var docXFiles = await driveApi.SearchFolder(System.Configuration.ConfigurationManager.AppSettings["messianicChordsFolderId"], "docx");
            var docxFileIds = docXFiles.Select(d => d.Id).ToList();
            var docsToBulkInsert = new List<ChordSheet>(docxFileIds.Count);
            using (var enumerator = await DbSession.Advanced.StreamAsync<ChordSheet>("ChordSheets/"))
            {
                while (await enumerator.MoveNextAsync())
                {
                    var currentChordSheet = enumerator.Current.Document;
                    docsToBulkInsert.Add(currentChordSheet);
                }
            }

            using (var bulkInsert = RavenStore.Instance.BulkInsert())
            {
                foreach (var chord in docsToBulkInsert)
                {
                    if (docxFileIds.Contains(chord.GoogleDocId) && chord.Id != "ChordSheets/1000")
                    {
                        chord.Extension = "docx";
                        bulkInsert.Store(chord);
                    }
                }
            }

            return Json($"A total of {docsToBulkInsert.Count} chord sheets updated", JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Finds ChordSheets that need their plain text contents fetched, downloads them, 
        /// extracts the plain text from the .docx file, and stores that in the ChordSheet.
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        public async Task<ActionResult> SyncDocxPlainText()
        {
            var needsPlainTextFetch = await DbSession
                .Query<ChordSheet>()
                .Where(x => !x.HasFetchedPlainTextContents && x.Extension == "docx") // We only know how to extract plain text from .docx.
                .OrderByDescending(x => x.LastUpdated)
                .Take(20)
                .ToListAsync();

            var authorizeResults = await GoogleDriveApi.Authorize(this);
            var driveApi = new GoogleDriveApi(authorizeResults.Initializer);
            var docTextFetcher = new DocumentTextFetcher(needsPlainTextFetch, driveApi);
            var fetchRecord = await docTextFetcher.Fetch();
            await DbSession.StoreAsync(fetchRecord);
            DbSession.AddRavenExpiration(fetchRecord, DateTime.UtcNow.AddDays(30));

            return Json(fetchRecord, JsonRequestBehavior.AllowGet);
        }
    }
}