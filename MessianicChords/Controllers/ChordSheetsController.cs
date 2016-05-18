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
            var queryForTerm = new Func<string, IRavenQueryable<ChordSheet>>(query =>
            {
                return DbSession
                    .Query<ChordSheet, ChordSheetSearch>()
                    .Search(x => x.Song, query, boost: 3, escapeQueryOptions: EscapeQueryOptions.AllowPostfixWildcard)
                    .Search(x => x.Artist, query, boost: 2, escapeQueryOptions: EscapeQueryOptions.AllowPostfixWildcard)
                    .Search(x => x.PlainTextContents, query, boost: 1, escapeQueryOptions: EscapeQueryOptions.AllowPostfixWildcard);
            });

            var termWildcardEnd = term + "*";
            var matchingChordsQuery = queryForTerm(termWildcardEnd);
            var matchingChords = await queryForTerm(termWildcardEnd).ToListAsync();
            
            // No results? See if we can suggest some.
            if (!matchingChords.Any() && term.Length > 2)
            {
                var suggestions = await matchingChordsQuery.SuggestAsync();
                var firstSuggestion = suggestions.Suggestions.FirstOrDefault();
                if (firstSuggestion != null)
                {
                    matchingChords = await queryForTerm(firstSuggestion).ToListAsync();
                }
            }

            System.Web.Hosting.HostingEnvironment.QueueBackgroundWorkItem(_ => AddOrIncrementSearch(term));
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
                var lastChangeId = await DbSession.Query<SyncRecord>()
                    .OrderByDescending(s => s.DateTime)
                    .Select(s => s.LastChangeId)
                    .FirstOrDefaultAsync();
                var syncRecord = await new GoogleDriveSync(chordsFetcher, lastChangeId)
                    .Start(DbSession);
                await DbSession.StoreAsync(syncRecord);
                DbSession.AddRavenExpiration(syncRecord, DateTime.UtcNow.AddMonths(1));

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

        static void AddOrIncrementSearch(string term)
        {
            using (var session = RavenStore.Instance.OpenSession())
            {
                var existing = session.Query<Search>()
                    .Where(t => t.Text == term)
                    .FirstOrDefault();
                if (existing != null)
                {
                    existing.Count = existing.Count + 1;
                }
                else
                {
                    session.Store(new Search
                    {
                        Count = 1,
                        Date = DateTime.UtcNow,
                        Text = term
                    });
                }

                session.SaveChanges();
            }
        }
    }
}