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
        public DateTime LastUpdated { get; set; }

        public void UpdateFrom(ChordSheet other)
        {
            this.Address = other.Address;
            this.Artist = other.Artist;
            this.ETag = other.ETag;
            this.GoogleDocId = other.GoogleDocId;
            this.Key = other.Key;
            this.LastUpdated = DateTime.UtcNow;
            this.Song = other.Song;
            this.ThumbnailUrl = other.ThumbnailUrl;            
        }
    }
}