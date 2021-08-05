using System;

namespace MessianicChords.Models
{
    public class ChordSheet
    {
        public string Song { get; set; } = string.Empty;
        public string? HebrewSongName { get; set; }
        public string Artist { get; set; } = string.Empty;
        public string? Key { get; set; }
        public string Address { get; set; } = string.Empty;
        public string? ThumbnailUrl { get; set; }
        public string? DownloadUrl { get; set; }
        public string GoogleDocId { get; set; } = string.Empty;
        public string? ETag { get; set; }
        public string? Id { get; set; }
        public string? PlainTextContents { get; set; }
        public DateTime LastUpdated { get; set; }
        public DateTime Created { get; set; }
        public string? Extension { get; set; }
        public bool HasFetchedPlainTextContents { get; set; }
        public Uri? PublishUri { get; set; }
        public Uri? ChavahSongUri { get; set; }
        public int PagesCount { get; set; }

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
            HebrewSongName = other.HebrewSongName;
            Song = other.Song;
            ThumbnailUrl = other.ThumbnailUrl;
            PublishUri = other.PublishUri;
            ChavahSongUri = other.ChavahSongUri;
            PagesCount = other.PagesCount;
        }

        public string GetDisplayName()
        {
            // Do we have a Hebrew song name as well? Then use "EnglishSongName HebrewSongName" as the format.
            var songName = this.HebrewSongName switch
            {
                var val when string.IsNullOrWhiteSpace(val) => this.Song,
                _ => $"{this.Song} {this.HebrewSongName}"
            };

            if (!string.IsNullOrWhiteSpace(Key))
            {
                return $"{Artist} - {songName} - {Key}";
            }

            return $"{Artist} - {songName}";
        }

        public bool IsTempFile()
        {
            return this.Artist != null && this.Artist.Contains("$") && this.Artist.Contains("~");
        }

        public bool IsConflictFile()
        {
            return (this.Song != null && this.Song.Contains("[Conflict]"))
                ||
                (this.Key != null && this.Key.Contains("[Conflict]"));
        }
    }
}