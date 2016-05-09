using MessianicChords.Common;
using MessianicChords.Models;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;
using Raven.Client;

namespace MessianicChords.Controllers
{
    public class SitemapController : RavenSessionController
    {
        // GET: Sitemap
        public async Task<ActionResult> Index()
        {
            var stopwatch = new Stopwatch();
            stopwatch.Start();
            var chordLastModifiedDate = await DbSession.Query<ChordSheet>()
                .OrderByDescending(c => c.LastUpdated)
                .Select(c => c.LastUpdated)
                .FirstOrDefaultAsync();

            var chordSheetItems = await GetChordsheetIds();
            var sitemapItems = new List<SitemapItem>
            {
                new SitemapItem("https://messianicchords.com", changeFrequency: SitemapChangeFrequency.Weekly, lastModified: chordLastModifiedDate, priority: 1.0),
                new SitemapItem("https://messianicchords.com/home/songs", changeFrequency: SitemapChangeFrequency.Weekly, lastModified: chordLastModifiedDate, priority: 0.8),
                new SitemapItem("https://messianicchords.com/home/artists", changeFrequency: SitemapChangeFrequency.Weekly, lastModified: chordLastModifiedDate, priority: 0.8),
                new SitemapItem("https://messianicchords.com/home/random", changeFrequency: SitemapChangeFrequency.Always, lastModified: chordLastModifiedDate, priority: 0.1),
                new SitemapItem("https://messianicchords.com/legal", changeFrequency: SitemapChangeFrequency.Yearly, priority: 0.2)
            };
            sitemapItems.AddRange(chordSheetItems);

            var log = new Log
            {
                Message = $"Sitemap accessed. Generated in {stopwatch.Elapsed}. Found {chordSheetItems.Count} chords. Last modified date {chordLastModifiedDate}. User agent: {Request?.UserAgent}"
            };
            await DbSession.StoreAsync(log);
            DbSession.AddRavenExpiration(log, DateTime.UtcNow.AddMonths(1));

            return new SitemapResult(sitemapItems);
        }

        private async Task<List<SitemapItem>> GetChordsheetIds()
        {
            var items = new List<SitemapItem>(2000);
            using (var enumerator = await DbSession.Advanced.StreamAsync<ChordSheet>("ChordSheets/"))
            {
                while (await enumerator.MoveNextAsync())
                {
                    var currentChordSheet = enumerator.Current.Document;
                    if (currentChordSheet != null)
                    {
                        var sitemapItem = new SitemapItem(
                            url: "https://messianicchords.com/ChordSheets?id=" + currentChordSheet.Id,
                            lastModified: currentChordSheet.LastUpdated,
                            changeFrequency: SitemapChangeFrequency.Monthly,
                            priority: 0.7);
                        items.Add(sitemapItem);
                    }
                }
            }

            return items;
        }
    }
}