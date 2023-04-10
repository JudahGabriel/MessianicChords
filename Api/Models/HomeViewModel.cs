using System;

namespace MessianicChords.Models
{
    /// <summary>
    /// View model used for rendering the home page.
    /// </summary>
    public class HomeViewModel
    {
        public HomeViewModel(Uri indexJsUrl, Uri indexCssUrl)
        {
            this.IndexJsUrl = indexJsUrl;
            this.IndexCssUrl = indexCssUrl;
        }

        public Uri IndexJsUrl { get; init; }
        public Uri IndexCssUrl { get; init; }
        public string Title { get; set; } = "MessianicChords";
        public string Description { get; set; } = "Guitar chords, lyrics, and sheet music for Messianic Jewish and Hebrew Roots music";
        public string Keywords { get; set; } = "chords, guitar chords, messianic, messianic jewish, messianic jewish music, messianic jewish guitar chords, messianic jewish lyrics, hebrew roots music, hebrew roots guitar chords, hebrew roots lyrics";
        public Uri SocialCardUrl { get; set; } = new Uri("https://messianicchords.com");
        public string SocialCardType { get; set; } = "website"; // For possible values, see https://ogp.me/
        public Uri SocialCardImage { get; set; } = new Uri("https://messianicchords.com/assets/images/512x512.png");
        public string TwitterHandle { get; set; } = "@MessianicChords";
    }
}
