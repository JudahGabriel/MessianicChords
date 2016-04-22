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

        public async Task<ActionResult> Sync()
        {
            try
            {
                await new GoogleDriveSync().StartSync();
                return Json("Completed successfully");
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

                return Json("Error: " + error.Message);
            }
        }
    }
}