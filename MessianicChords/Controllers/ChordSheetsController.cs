using MessianicChords.Common;
using MessianicChords.Models;
using MessianicChords.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;

namespace MessianicChords.Controllers
{
    [RequireHttps]
    public class ChordSheetsController : Controller
    {
        // GET: Chords
        public async Task<ActionResult> Index(string id)
        {
            using (var session = RavenStore.Instance.OpenAsyncSession())
            {
                var chordSheet = await session.LoadAsync<ChordSheet>(id);
                if (chordSheet == null)
                {
                    return Redirect("/");
                }

                return View(chordSheet);
            }
        }

        public async Task<ActionResult> Print(string id)
        {
            using (var session = RavenStore.Instance.OpenAsyncSession())
            {
                var chordSheet = await session.LoadAsync<ChordSheet>(id);
                if (chordSheet == null)
                {
                    return Redirect("/");
                }

                return View(chordSheet);
            }
        }

        [HttpGet]
        public async Task<ActionResult> Sync()
        {
            try
            {
                var authorizeResults = await ChordsFetcher.Authorize(this);
                if (!string.IsNullOrEmpty(authorizeResults.RedirectUrl))
                {
                    return new RedirectResult(authorizeResults.RedirectUrl);
                }

                await new GoogleDriveSync(authorizeResults.ChordsFetcher).Start();
                return Json("Completed successfully", JsonRequestBehavior.AllowGet);
            }
            catch (Exception error)
            {
                using (var session = RavenStore.Instance.OpenAsyncSession())
                {
                    await session.StoreAsync(new Log
                    {
                        Message = error.ToString(),
                        Date = DateTime.UtcNow
                    });
                }

                return Json(error.ToString(), JsonRequestBehavior.AllowGet);
            }
        }
    }
}