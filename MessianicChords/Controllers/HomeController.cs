using Google.Apis.Auth.OAuth2.Mvc;
using Google.Apis.Services;
using MessianicChords.Common;
using MessianicChords.Data;
using MessianicChords.Models;
using MessianicChords.Services;
using Raven.Client;
using Raven.Client.Linq;
using System;
using System.IO;
using System.Linq;
using System.ServiceModel.Syndication;
using System.Threading;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;

namespace MessianicChords.Controllers
{
    [RequireHttps]
    public class HomeController : RavenSessionController
    {
        public ActionResult Index()
        {
            return View();
        }

        public async Task<JsonResult> NewChords(int skip = 0)
        {
            var recentChords = await DbSession
                .Query<ChordSheet>()
                .OrderByDescending(o => o.LastUpdated)
                .Skip(skip)
                .Take(3)
                .ToListAsync();
                
            return Json(recentChords, JsonRequestBehavior.AllowGet);
        }

        public ActionResult Artists()
        {
            return View("ArtistBrowse");
        }

        public ActionResult Songs()
        {
            return View("SongBrowse");
        }

        public async Task<ActionResult> SongById(string id)
        {
            var song = await DbSession.LoadAsync<ChordSheet>(id);
            ViewBag.DocumentUrl = song.Address;
            ViewBag.Artist = song.Artist;
            ViewBag.Song = song.Song;

            return Redirect(song.Address);
        }

        public async Task<ActionResult> Random()
        {
            var chordSheet = await DbSession
                .Query<ChordSheet>()
                .Customize(x => x.RandomOrdering())
                .FirstAsync();

            return Redirect("/chordsheets?id=" + chordSheet.Id);
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
        public async Task<ActionResult> Upload()
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
                    await StoreUploadRecord(file);
                }
            }

            return RedirectToAction("UploadFinished");
        }

        public async Task<ActionResult> UploadFeed()
        {
            var monthAgo = DateTime.Now.Subtract(TimeSpan.FromDays(30));

            var posts = await DbSession.Query<UploadRecord>()
                .Where(d => d.Date >= monthAgo)
                .OrderByDescending(p => p.Date)
                .Take(25)
                .ToListAsync();

            var postItems = posts
                .Select(
                    p => new SyndicationItem($"Guitar chords for '{p.FileName}' is now on MessianicChords.com", p.FileName, new Uri("http://messianicchords.com/#" + Uri.EscapeDataString(Path.GetFileNameWithoutExtension(p.FileName.Replace('-', ' '))))));

            var feed = new SyndicationFeed("Messianic Chords Uploads", "Feed for user-submitted chords sheets", new Uri("http://messianicchords.com"), postItems)
            {
                Language = "en-US"
            };
            return new RssResult(new Rss20FeedFormatter(feed));
        }

        public async Task<ActionResult> RecentSongsFeed()
        {
            var monthAgo = DateTime.Now.Subtract(TimeSpan.FromDays(30));
            var chords = await DbSession
                .Query<ChordSheet>()
                .OrderByDescending(o => o.Created)
                .Take(10)
                .ToListAsync();

            var chordFeedItems = chords
                .Where(c => !c.Artist.Contains("~") && !c.Artist.Contains("$")) // Skip the Word temporary files.
                .Select(c => new SyndicationItem(
                    string.Format("\"{0}\" by {1}, lyrics and chords are now on MessianicChords", c.Song, c.Artist),
                    string.Format("{0} - {1} has been added to or updated on MessianicChords.com", c.Artist, c.Song),
                    new Uri("http://messianicchords.com/chordsheets/?id=" + c.Id)
                    ));
                    
            var feed = new SyndicationFeed("Messianic Chords Uploads", "Feed for user-submitted chords sheets", new Uri("http://messianicchords.com"), chordFeedItems)
            {
                Language = "en-US"
            };

            return new RssResult(new Rss20FeedFormatter(feed));
        }

        public ActionResult StartUpload()
        {
            return PartialView();
        }

        public ActionResult UploadFinished()
        {
            return PartialView();
        }

        public async Task<JsonResult> GetSongsByArtist(int skip, int take)
        {
            var stats = default(RavenQueryStatistics);
            var results = await DbSession
                .Query<ChordSheet>()
                .Statistics(out stats)
                .OrderBy(c => c.Artist)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
            var pagedResults = new
            {
                Items = results,
                Total = stats.TotalResults
            };
            
            return Json(pagedResults, JsonRequestBehavior.AllowGet);
        }

        public async Task<JsonResult> GetSongsByName(int skip, int take)
        {
            var stats = default(RavenQueryStatistics);
            var results = await DbSession
                .Query<ChordSheet>()
                .Statistics(out stats)
                .OrderBy(c => c.Song)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
            var pagedResults = new
            {
                Items = results,
                Total = stats.TotalResults
            };

            return Json(pagedResults, JsonRequestBehavior.AllowGet);
        }
        
        private async Task StoreUploadRecord(HttpPostedFileBase file)
        {
            var uploadRecord = new UploadRecord 
            { 
                Id = Guid.NewGuid().ToString(), 
                FileName = file.FileName,
                Date = DateTime.Now
            };

            await DbSession.StoreAsync(uploadRecord);
            await DbSession.SaveChangesAsync();
        }
    }
}
