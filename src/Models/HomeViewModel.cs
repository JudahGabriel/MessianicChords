using System;
using System.Reflection;

namespace MessianicChords.Models
{
    /// <summary>
    /// View model used for rendering the home page.
    /// </summary>
    public class HomeViewModel
    {
        public HomeViewModel(Uri indexJsUrl, Uri? indexCssUrl)
        {
            this.IndexJsUrl = indexJsUrl;
            this.IndexCssUrl = indexCssUrl;
        }

        public Uri IndexJsUrl { get; init; }
        public Uri? IndexCssUrl { get; init; }
        public string Title { get; set; } = "MessianicChords";
        public string Description { get; set; } = "Guitar chords, lyrics, and sheet music for Messianic Jewish and Hebrew Roots music";
        public string Keywords { get; set; } = "chords, guitar chords, messianic, messianic jewish, messianic jewish music, messianic jewish guitar chords, messianic jewish lyrics, hebrew roots music, hebrew roots guitar chords, hebrew roots lyrics";
        public Uri SocialCardUrl { get; set; } = new Uri("https://messianicchords.com");
        public string SocialCardType { get; set; } = "website"; // For possible values, see https://ogp.me/
        public Uri SocialCardImage { get; set; } = new Uri("https://messianicchords.com/assets/images/512x512.png");
        public string TwitterHandle { get; set; } = "@MessianicChords";

        /// <summary>
        /// Updates the home view model to include title, description, etc. of a specific chord sheet.
        /// </summary>
        /// <param name="chordSheet"></param>
        public void UpdateFromChordSheet(ChordSheet chordSheet)
        {
            this.Description = $"Chord chart for {chordSheet.GetSongName()} by {chordSheet.Artist}. {new[] { chordSheet.Chords, chordSheet.PlainTextContents }.FirstOrDefault(i => !string.IsNullOrEmpty(i)) ?? string.Empty}";
            this.Keywords = string.Join(", ", new[] { chordSheet.GetSongName(), chordSheet.Artist }.Concat(chordSheet.Authors)) + ", " + this.Keywords;
            if (!string.IsNullOrEmpty(chordSheet.ThumbnailUrl))
            {
                this.SocialCardImage = new Uri(chordSheet.ThumbnailUrl);
            }
            this.Title = $"Chord chart for {chordSheet.GetSongName()} by {chordSheet.Artist} - Messianic Chords";
            this.SocialCardUrl = new Uri($"https://messianicchords.com/{chordSheet.Id}");
        }

        /// <summary>
        /// Updates the home view model to include title, description, etc. for chords for a specific artist.
        /// </summary>
        /// <param name="chordSheet"></param>
        public void UpdateFromArtist(string artistName)
        {
            this.Description = $"Chord charts for songs by {artistName}";
            this.Keywords = $"{artistName} chords, {this.Keywords}";
            this.Title = $"Chord charts by {artistName} - Messianic Chords";
            this.SocialCardUrl = new Uri($"https://messianicchords.com/artist/{Uri.EscapeDataString(artistName)}");
        }

        /// <summary>
        /// Updates the home view model to include title, description, etc. for a browse page.
        /// </summary>
        /// <param name="order">Must be 'newest', 'songs', 'artists', or 'random'.</param>
        public void UpdateFromBrowse(string order)
        {
            if (order != "newest" && order != "songs" && order != "artists" && order != "random")
            {
                throw new ArgumentException("Order must be 'newest', 'songs', 'artists', or 'random'", nameof(order));
            }

            this.Description = $"Browse chord charts for songs by {order}";
            this.Title = $"Browse chord charts by {order} - Messianic Chords";
            this.SocialCardUrl = new Uri($"https://messianicchords.com/browse/{Uri.EscapeDataString(order)}");
        }

        /// <summary>
        /// Updates the home view model to update title, description, etc. for the about page.
        /// </summary>
        public void UpdateFromAbout()
        {
            this.Description = $"About - Messianic Chords";
            this.Title = $"About - Messianic Chords";
            this.SocialCardUrl = new Uri($"https://messianicchords.com/about");
        }
    }
}
