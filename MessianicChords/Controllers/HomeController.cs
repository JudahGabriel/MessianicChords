using MessianicChords.Common;
using MessianicChords.Models;
using MessianicChords.Services;
using Raven.Client;
using Raven.Client.Linq;
using System;
using System.IO;
using System.Linq;
using System.ServiceModel.Syndication;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;

namespace MessianicChords.Controllers
{
    public class HomeController : Controller
    {
        public ActionResult Index()
        {
            return View();
        }

        public async Task<JsonResult> NewChords()
        {
            using (var session = RavenStore.Instance.OpenAsyncSession())
            {
                var recentChords = await session
                    .Query<ChordSheet>()
                    .OrderByDescending(o => o.LastUpdated)
                    .Take(3)
                    .ToListAsync();
                
                return Json(recentChords, JsonRequestBehavior.AllowGet);
            }
        }

        public ActionResult Artists()
        {
            return View("ArtistBrowse");
        }

        public ActionResult Songs()
        {
            return View("SongBrowse");
        }

        public ActionResult SongById(string id)
        {
            using (var session = RavenStore.Instance.OpenSession())
            {
                var song = session.Load<ChordSheet>(id);
                ViewBag.DocumentUrl = song.Address;
                ViewBag.Artist = song.Artist;
                ViewBag.Song = song.Song;

                return Redirect(song.Address);
                //return View("Song");
            }
        }

        public ActionResult Random()
        {
            using (var session = RavenStore.Instance.OpenSession())
            {
                var chordSheet = session
                    .Query<ChordSheet>()
                    .Customize(x => x.RandomOrdering())
                    .First();

                return Redirect("/chordsheets?id=" + chordSheet.Id);
            }
        }

        public ActionResult Song(string url, string artist, string song)
        {
            return Redirect(url);
        }

        public ActionResult About()
        {
            return View();
        }

        public ActionResult Legal()
        {
            return View();
        }

        [HttpPost]
        public ActionResult Upload()
        {
            var uploadsDirectory = this.HttpContext.Server.MapPath("~/App_Data/Uploads");
            if (!Directory.Exists(uploadsDirectory))
            {
                Directory.CreateDirectory(uploadsDirectory);
            }

            for (int i = 0; i < Request.Files.Count; i++)
            {
                var file = Request.Files[i]; 
                if (file.ContentLength > 0)
                {
                    file.SaveAs(Path.Combine(uploadsDirectory, file.FileName));
                    StoreUploadRecord(file);
                }
            }

            return RedirectToAction("UploadFinished");
        }

        public ActionResult UploadFeed()
        {
            var monthAgo = DateTime.Now.Subtract(TimeSpan.FromDays(30));
            using (var session = RavenStore.Instance.OpenSession())
            {
                var postItems = session.Query<UploadRecord>()
                    .Where(d => d.Date >= monthAgo)
                    .OrderByDescending(p => p.Date)
                    .Take(25)
                    .ToArray()
                    .Select(p => new SyndicationItem(string.Format("Guitar chords for '{0}' is now on MessianicChords.com", p.FileName), p.FileName, new Uri("http://messianicchords.com/#" + Uri.EscapeDataString(Path.GetFileNameWithoutExtension(p.FileName.Replace('-', ' '))))));

                var feed = new SyndicationFeed("Messianic Chords Uploads", "Feed for user-submitted chords sheets", new Uri("http://messianicchords.com"), postItems)
                {
                    Language = "en-US"
                };
                return new RssResult(new Rss20FeedFormatter(feed));
            }
        }

        public ActionResult RecentSongsFeed()
        {
            var monthAgo = DateTime.Now.Subtract(TimeSpan.FromDays(30));
            using (var session = RavenStore.Instance.OpenSession())
            {
                var chordFeedItems = session
                    .Query<ChordSheet>()
                    .OrderByDescending(o => o.LastUpdated)
                    .Take(10)
                    .AsEnumerable()
                    .Where(c => !c.Artist.Contains("~") && !c.Artist.Contains("$")) // Skip the Word temporary files.
                    .Select(c => new SyndicationItem(
                        string.Format("\"{0}\" by {1}, lyrics and chords are now on MessianicChords", c.Song, c.Artist),
                        string.Format("{0} - {1} has been added to or updated on MessianicChords.com", c.Artist, c.Song),
                        new Uri("http://messianicchords.com/home/songbyid/?id=" + c.Id)
                        ));
                    
                var feed = new SyndicationFeed("Messianic Chords Uploads", "Feed for user-submitted chords sheets", new Uri("http://messianicchords.com"), chordFeedItems)
                {
                    Language = "en-US"
                };
                return new RssResult(new Rss20FeedFormatter(feed));
            }
        }

        public ActionResult StartUpload()
        {
            return PartialView();
        }

        public ActionResult UploadFinished()
        {
            return PartialView();
        }

        public JsonResult GetSongsByArtist(int skip, int take)
        {
            using (var session = RavenStore.Instance.OpenSession())
            {
                var stats = default(RavenQueryStatistics);
                var results = session
                    .Query<ChordSheet>()
                    .Statistics(out stats)
                    .OrderBy(c => c.Artist)
                    .Skip(skip)
                    .Take(take);
                var pagedResults = new
                {
                    Items = results.ToArray(),
                    Total = stats.TotalResults
                };
                return Json(pagedResults, JsonRequestBehavior.AllowGet);
            }
        }

        public JsonResult GetSongsByName(int skip, int take)
        {
            using (var session = RavenStore.Instance.OpenSession())
            {
                var stats = default(RavenQueryStatistics);
                var results = session
                    .Query<ChordSheet>()
                    .Statistics(out stats)
                    .OrderBy(c => c.Song)
                    .Skip(skip)
                    .Take(take);
                var pagedResults = new
                {
                    Items = results.ToArray(),
                    Total = stats.TotalResults
                };
                return Json(pagedResults, JsonRequestBehavior.AllowGet);
            }
        }

        public async Task<JsonResult> GetMatchingDocuments(string search)
        {
            var fetcher = new ChordsFetcher();
            var chordsMeta = await fetcher.GetChords(search);
            var chordIds = chordsMeta.Take(50).Select(c => c.GoogleDocId);

            using (var session = RavenStore.Instance.OpenAsyncSession())
            {
                var chordSheets = await session.Query<ChordSheet>()
                    .Where(s => s.GoogleDocId.In(chordIds))
                    .ToListAsync();

                var searchObj = new Search { Date = DateTime.Now, Text = search };
                await session.StoreAsync(searchObj);
                session.Advanced.GetMetadataFor(searchObj)["Raven-Expiration-Date"] = new Raven.Json.Linq.RavenJValue(DateTime.Now.AddMonths(3));
                
                await session.SaveChangesAsync();

                return Json(new
                {
                    Search = search,
                    Results = chordSheets
                }, JsonRequestBehavior.AllowGet);
            }
        }

        private void StoreUploadRecord(HttpPostedFileBase file)
        {
            var uploadRecord = new UploadRecord 
            { 
                Id = Guid.NewGuid().ToString(), 
                FileName = file.FileName,
                Date = DateTime.Now
            };
            using (var session = RavenStore.Instance.OpenSession())
            {
                session.Store(uploadRecord);
                session.SaveChanges();
            }
        }
    }
}
