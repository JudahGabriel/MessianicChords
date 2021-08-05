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
        public HashSet<string> Artists { get; private set; } = new HashSet<string>(1000);
        public DateTime LastUpdatedChordDate { get; set; }

        public async Task OnGetAsync()
        {
            using var session = db.OpenAsyncSession();
            var chordSheets = session.Advanced.Stream<ChordSheet>();
            await foreach (var doc in chordSheets)
            {
                this.Chords.Add(doc);
                this.Artists.Add(doc.Artist);
            }

            this.LastUpdatedChordDate = await session.Query<ChordSheet>()
                .OrderByDescending(c => c.LastUpdated)
                .Select(c => c.LastUpdated)
                .FirstOrDefaultAsync();
            
            Response.ContentType = "text/xml";
        }
    }
}
