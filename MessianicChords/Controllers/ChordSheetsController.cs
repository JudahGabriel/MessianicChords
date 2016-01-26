using MessianicChords.Common;
using MessianicChords.Models;
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
    }
}