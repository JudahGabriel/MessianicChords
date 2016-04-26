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
                var authorizeResults = await ChordsFetcher.Authorize(this);
                if (!string.IsNullOrEmpty(authorizeResults.RedirectUrl))
                {
                    return new RedirectResult(authorizeResults.RedirectUrl);
                }

                var syncRecord = await new GoogleDriveSync(authorizeResults.ChordsFetcher).Start();
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
    }
}