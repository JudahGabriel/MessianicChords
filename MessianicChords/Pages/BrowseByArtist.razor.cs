using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MessianicChords.Services;
using MessianicChords.Models;
using Microsoft.AspNetCore.Components;

namespace MessianicChords.Pages
{
    public partial class BrowseByArtist
    {
        private Dictionary<string, List<ChordSheet>> chordsByArtist = new();
        private PagedList<ChordSheet> allChords;

        public BrowseByArtist()
        {
            this.allChords = new PagedList<ChordSheet>((skip, take) => this.LoadMore(skip, take));
            this.allChords.Take = 100;
        }

        [Inject]
        public ChordSheetService ChordService { get; set; }

        protected override async Task OnInitializedAsync()
        {
            await base.OnInitializedAsync();
            await this.allChords.GetNextChunk();
        }

        private async Task<PagedResults<ChordSheet>> LoadMore(int skip, int take)
        {
            var chordChunk = await this.ChordService.GetByArtistName(skip, take);

            // Group the chords by artist.
            foreach (var chordSheet in chordChunk.Results)
            {
                var artist = chordSheet.Artist ?? "Unknown Artist";
                if (!chordsByArtist.TryGetValue(artist, out var artistChords))
                {
                    artistChords = new List<ChordSheet>();
                    chordsByArtist.Add(artist, artistChords);
                }

                artistChords.Add(chordSheet);
            }

            this.StateHasChanged();

            return chordChunk;
        }
    }
}
