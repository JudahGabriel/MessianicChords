using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using Google.GData.Documents;
using System.IO;
using Google.GData.Client;
using MessianicChords.Models;
using System.Collections.Concurrent;
using System.ServiceModel.Syndication;
using System.Threading.Tasks;
using MessianicChords.Common;
using Raven.Client;
using System.Configuration;

namespace MessianicChords.Controllers
{
    public class HomeController : Controller
    {
        private static DocumentsService docService;
        

        static HomeController()
        {
            HomeController.docService = new DocumentsService("MessianicChords.com");
            docService.setUserCredentials(ConfigurationManager.AppSettings["googleAccount"], ConfigurationManager.AppSettings["googlePassword"]);
        }

        public ActionResult Index()
        {            
            return View();
        }

        public JsonResult NewChords()
        {
            using (var session = RavenStore.Instance.OpenSession())
            {
                var recentChords = session
                    .Query<ChordSheet>()
                    .OrderByDescending(o => o.LastUpdated)
                    .Take(3);
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
                ViewBag.DocumentUrl = song.GoogleDocAddress;
                ViewBag.Artist = song.Artist;
                ViewBag.Song = song.Song;

                return View("Song");
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
                ViewBag.DocumentUrl = chordSheet.GoogleDocAddress;
                ViewBag.Artist = chordSheet.Artist;
                ViewBag.Song = chordSheet.Song;

                return View("Song");
            }
        }

        public ActionResult Song(string url, string artist, string song)
        {
            ViewBag.DocumentUrl = url;
            ViewBag.Artist = artist;
            ViewBag.Song = song;

            return View();
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

        public JsonResult GetMatchingDocuments(string search)
        {
            var docQuery = new DocumentsListQuery();
            docQuery.Uri = new Uri("https://docs.google.com/feeds/default/private/full/" + Constants.MessianicChordsFolderId + "/contents");
            docQuery.Query = search;
            var feed = docService.Query(docQuery);
            var results = feed.Entries.AsParallel().Select(ChordSheet.FromGDoc);

            using (var session = RavenStore.Instance.OpenSession())
            {
                var searchObj = new Search { Date = DateTime.Now, Text = search };
                session.Store(searchObj);
                session.Advanced.GetMetadataFor(searchObj)["Raven-Expiration-Date"] = new Raven.Json.Linq.RavenJValue(DateTime.Now.AddMonths(3));
                session.SaveChanges();
            }

            return Json(new 
                {
                    Search = search,
                    Results = results.Take(50)
                }, JsonRequestBehavior.AllowGet);
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
