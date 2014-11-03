using Google.GData.Client;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;

namespace MessianicChords.Models
{
    public class ChordSheet
    {
        public string Song { get; set; }
        public string Artist { get; set; }
        public string Key { get; set; }
        public string Address { get; set; }
        public string GoogleDocAddress { get; set; }
        public int AddressHash { get; set; }
        public DateTime LastUpdated { get; set; }
        public DateTime LastSyncCheck { get; set; }
        public string Id { get; set; }
        
        public static ChordSheet FromGDoc(AtomEntry document)
        {
            // Replace "/edit" with "/view"
            var address = document.AlternateUri.Content.Substring(0, document.AlternateUri.Content.Length - 5) + "/view";
            var title = Path.GetFileNameWithoutExtension(document.Title.Text.Replace('/', ','));
            var parts = title.Split(new[] { " - " }, StringSplitOptions.RemoveEmptyEntries);

            var getEmbeddedAddress = new Func<string, string, string>((artist, song) =>
                "/home/song?url=" + Uri.EscapeUriString(address) + "&artist=" + Uri.EscapeUriString(artist) + "&song=" + Uri.EscapeUriString(song));

            // Artist - Song - Key
            if (parts.Length >= 2)
            {
                return new ChordSheet
                {
                    Artist = parts[0].Trim(),
                    Song = parts[1].Trim(),
                    Key = parts.Length > 2 ? parts[2].Trim() : string.Empty,
                    Address = getEmbeddedAddress(parts[0].Trim(), parts[1].Trim()),
                    GoogleDocAddress = address,
                    LastUpdated = document.Updated,
                    AddressHash = address.GetHashCode()
                };
            }

            return new ChordSheet
            {
                Address = getEmbeddedAddress("Unknown Artist", title),
                GoogleDocAddress = address,
                Artist = "Unknown Artist",
                Key = string.Empty,
                Song = title,
                LastUpdated = DateTime.Now,
                AddressHash = address.GetHashCode()
            };
        }
    }
}