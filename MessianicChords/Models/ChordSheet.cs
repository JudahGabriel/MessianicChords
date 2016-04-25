using System;

namespace MessianicChords.Models
{
    public class ChordSheet
    {
        public string Song { get; set; }
        public string Artist { get; set; }
        public string Key { get; set; }
        public string Address { get; set; }
        public string ThumbnailUrl { get; set; }
        public string GoogleDocId { get; set; }
        public string ETag { get; set; }
        public string Id { get; set; }
        public string PlainTextContents { get; set; }
        public DateTime LastUpdated { get; set; }
        public string Extension { get; set; }

        public void UpdateFrom(ChordSheet other)
        {
            Address = other.Address;
            Artist = other.Artist;
            ETag = other.ETag;
            GoogleDocId = other.GoogleDocId;
            Key = other.Key;
            LastUpdated = DateTime.UtcNow;
            PlainTextContents = other.PlainTextContents;
            Song = other.Song;
            ThumbnailUrl = other.ThumbnailUrl;       
        }

        public string GetDisplayName()
        {
            if (!string.IsNullOrWhiteSpace(Key))
            {
                return $"{Artist} - {Song} - {Key}";
            }

            return $"{Artist} - {Song}";
        }
    }
}