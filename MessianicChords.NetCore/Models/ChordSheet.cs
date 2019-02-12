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
        public string DownloadUrl { get; set; }
        public string GoogleDocId { get; set; }
        public string ETag { get; set; }
        public string Id { get; set; }
        public string PlainTextContents { get; set; }
        public DateTime LastUpdated { get; set; }
        public DateTime Created { get; set; }
        public string Extension { get; set; }
        public bool HasFetchedPlainTextContents { get; set; }

        public void UpdateFrom(ChordSheet other)
        {
            Address = other.Address;
            Artist = other.Artist;
            Created = other.Created;
            DownloadUrl = other.DownloadUrl;
            ETag = other.ETag;
            Extension = other.Extension;
            GoogleDocId = other.GoogleDocId;
            HasFetchedPlainTextContents = other.HasFetchedPlainTextContents;
            Key = other.Key;
            LastUpdated = other.LastUpdated;
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