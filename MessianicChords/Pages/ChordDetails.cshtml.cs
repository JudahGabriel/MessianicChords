using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MessianicChords.Models;
using MessianicChords.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace MessianicChords.Pages
{
    public class ChordDetailsModel : PageModel
    {
        private readonly ChordSheetService chordsService;
        private readonly GoogleDriveChordsFetcher gDriveDocFetcher;
        public ChordDetailsModel(ChordSheetService chordsService, GoogleDriveChordsFetcher gDriveDocFetcher)
        {
            this.chordsService = chordsService;
            this.gDriveDocFetcher = gDriveDocFetcher;
        }

        public ChordSheet ChordSheet { get; set; } = new ChordSheet();
        public string Title { get; set; } = string.Empty;
        public Uri IFrameUri { get; set; } = new Uri("https://messianicchords.com");
        public Uri PrintUri { get; set; } = new Uri("https://messianicchords.com");
        public int IFrameHeight { get; set; }

        public async Task OnGetAsync(string chordId)
        {
            this.ChordSheet = await chordsService.Get($"chordsheets/{chordId}");

            var test = await gDriveDocFetcher.CreateChordSheet(ChordSheet.GoogleDocId);

            var keyText = string.IsNullOrWhiteSpace(this.ChordSheet.Key) ? string.Empty : $", in the key of {this.ChordSheet.Key}";
            this.Title = $"{this.ChordSheet.Song} by {this.ChordSheet.Artist}{keyText} - guitar chords and lyrics";

            IFrameUri = ChordSheet.PublishUri switch
            {
                null => new Uri($"https://docs.google.com/file/d/{ChordSheet.GoogleDocId}/preview"),
                _ => new Uri(ChordSheet.PublishUri, "?embedded=true")
            };
            PrintUri = new Uri($"https://docs.google.com/file/d/{ChordSheet.GoogleDocId}/view");

            var defaultIFrameHeight = 1100;
            IFrameHeight = ChordSheet.PagesCount == 0 ? defaultIFrameHeight : ChordSheet.PagesCount * defaultIFrameHeight;
        }
    }
}
