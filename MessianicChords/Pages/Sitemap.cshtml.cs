using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MessianicChords.Common;
using MessianicChords.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Raven.Client.Documents;

namespace MessianicChords.Pages
{
    public class SitemapModel : PageModel
    {
        private readonly IDocumentStore db;

        public SitemapModel(IDocumentStore db)
        {
            this.db = db;
        }

        public List<ChordSheet> Chords { get; private set; } = new List<ChordSheet>(2000);
        public DateTime LastUpdatedChordDate { get; set; }

        public async Task OnGetAsync()
        {
            using var session = db.OpenAsyncSession();
            var chordSheets = session.Advanced.Stream<ChordSheet>();
            await foreach (var doc in chordSheets)
            {
                this.Chords.Add(doc);
            }

            this.LastUpdatedChordDate = await session.Query<ChordSheet>()
                .OrderByDescending(c => c.LastUpdated)
                .Select(c => c.LastUpdated)
                .FirstOrDefaultAsync();

            Response.ContentType = "text/xml";

            //var chordSheetItems = await GetChordsheetIds();
            //var sitemapItems = new List<SitemapItem>
            //{
            //    new SitemapItem("https://messianicchords.com", changeFrequency: SitemapChangeFrequency.Weekly, lastModified: chordLastModifiedDate, priority: 1.0),
            //    new SitemapItem("https://messianicchords.com/home/songs", changeFrequency: SitemapChangeFrequency.Weekly, lastModified: chordLastModifiedDate, priority: 0.8),
            //    new SitemapItem("https://messianicchords.com/home/artists", changeFrequency: SitemapChangeFrequency.Weekly, lastModified: chordLastModifiedDate, priority: 0.8),
            //    new SitemapItem("https://messianicchords.com/home/random", changeFrequency: SitemapChangeFrequency.Always, lastModified: chordLastModifiedDate, priority: 0.1),
            //    new SitemapItem("https://messianicchords.com/legal", changeFrequency: SitemapChangeFrequency.Yearly, priority: 0.2)
            //};
            //sitemapItems.AddRange(chordSheetItems);
        }
    }
}
