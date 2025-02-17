﻿namespace MessianicChords.Models;

public class ChordSheet
{
    /// <summary>
    /// The name of the song.
    /// </summary>
    public string Song { get; set; } = string.Empty;

    /// <summary>
    /// The Hebrew name of the song. For use where songs are named in Hebrew.
    /// </summary>
    public string? HebrewSongName { get; set; } = string.Empty;

    /// <summary>
    /// The performing artist of this arragement of the song.
    /// </summary>
    public string Artist { get; set; } = string.Empty;

    /// <summary>
    /// The plain text chord chart for the song. This will be null if the chord chart is in docx, PDF, or other format besides plain text.
    /// </summary>
    public string? Chords { get; set; }

    /// <summary>
    /// The key of this arragement of the song.
    /// </summary>
    public string? Key { get; set; }

    /// <summary>
    /// The address of the song document on Google docs. This will be empty if the file doesn't reside on Google Docs.
    /// </summary>
    public string Address { get; set; } = string.Empty;

    /// <summary>
    /// The URL of the thumbnail screenshot of the chord sheet.
    /// </summary>
    public string? ThumbnailUrl { get; set; }

    /// <summary>
    /// URL where the chord document can be downloaded.
    /// </summary>
    public string? DownloadUrl { get; set; }

    /// <summary>
    /// The Google Doc ID of the chord sheet. This will be null if the chord sheet doesn't exist on Google Docs.
    /// </summary>
    public string? GoogleDocId { get; set; } = string.Empty;

    /// <summary>
    /// The resource key of the Google Doc.
    /// </summary>
    public string? GoogleDocResourceKey { get; set; } = string.Empty;

    public string? Id { get; set; }
    public bool HasFetchedPlainTextContents { get; set; }
    public bool HasFetchedScreenshots { get; set; }

    /// <summary>
    /// The plain text contents of the chord chart. This is set when the chord chart is in a non-text format, such as .docx or .pdf, and we've extracted the plain text from the document.
    /// </summary>
    public string? PlainTextContents { get; set; }
    public DateTime LastUpdated { get; set; }
    public DateTime Created { get; set; }
    public string? Extension { get; set; }
    public Uri? PublishUri { get; set; }
    public string? ChavahSongId { get; set; }
    public int PagesCount { get; set; }
    public List<Uri> Screenshots { get; set; } = [];
    
    /// <summary>
    /// The authors who created the song.
    /// </summary>
    public List<string> Authors { get; set; } = [];

    /// <summary>
    /// Links to relevant resources for this song, such as YouTube videos, MP3 recordings, etc.
    /// </summary>
    public List<Uri> Links { get; set; } = [];

    /// <summary>
    /// Whether we've fetched a thumbnail of the doc from Google Drive.
    /// </summary>
    public bool HasFetchedThumbnail { get; set; }

    /// <summary>
    /// Copyright notice.
    /// </summary>
    public string? Copyright { get; set; }

    /// <summary>
    /// Whether the chord chart is a sheet music (e.g. piano sheet music) document containing musical notation.
    /// </summary>
    public bool IsSheetMusic { get; set; }

    /// <summary>
    /// The recommended guitar capo for playing this song.
    /// </summary>
    public int? Capo { get; set; }

    /// <summary>
    /// Additional information about the song.
    /// </summary>
    public string? About { get; set; }

    /// <summary>
    /// The year the song was authored.
    /// </summary>
    public int? Year { get; set; }

    /// <summary>
    /// Scripture relevant to the song.
    /// </summary>
    public string? Scripture { get; set; }

    /// <summary>
    /// The Christian Copyright Licensing Internation (CCLI) number for the song.
    /// </summary>
    public int? CcliNumber { get; set; }

    /// <summary>
    /// The song tags, containing characteristics like "slow", "hymn", "worship", "Jewish", "liturgy", etc.
    /// </summary>
    public List<string> Tags { get; set; } = [];

    /// <summary>
    /// The song timing signature, e.g. "4/4", "3/4", etc.
    /// </summary>
    public string? TimingSignature { get; set; }

    /// <summary>
    /// The file attachments of a chord chart.
    /// </summary>
    public List<Attachment> Attachments { get; set; } = [];

    public void UpdateFrom(ChordSheet other)
    {
        Address = other.Address;
        Artist = other.Artist;
        Created = other.Created;
        DownloadUrl = other.DownloadUrl;
        Extension = other.Extension;
        GoogleDocId = other.GoogleDocId;
        HasFetchedPlainTextContents = other.HasFetchedPlainTextContents;
        HasFetchedThumbnail = other.HasFetchedThumbnail;
        Key = other.Key;
        LastUpdated = other.LastUpdated;
        PlainTextContents = other.PlainTextContents;
        HebrewSongName = other.HebrewSongName;
        Song = other.Song;
        ThumbnailUrl = other.ThumbnailUrl;
        PublishUri = other.PublishUri ?? this.PublishUri; 
        ChavahSongId = other.ChavahSongId;
        PagesCount = other.PagesCount;
        Links = other.Links;
        Authors = other.Authors ?? this.Authors;
        Copyright = other.Copyright ?? this.Copyright;
        IsSheetMusic = other.IsSheetMusic;
        Capo = other.Capo ?? this.Capo;
        Scripture = other.Scripture ?? this.Scripture;
        Year = other.Year ?? this.Year;
        About = other.About ?? this.About;
        Chords = other.Chords ?? this.Chords;
        CcliNumber = other.CcliNumber ?? this.CcliNumber;
        
    }

    public void UpdateGoogleDrivePropsFrom(ChordSheet other)
    {
        Address = other.Address;
        Created = other.Created;
        DownloadUrl = other.DownloadUrl;
        Extension = other.Extension;
        GoogleDocId = other.GoogleDocId;
        LastUpdated = other.LastUpdated;
        Song = other.Song;
        PublishUri = other.PublishUri ?? this.PublishUri;
        PagesCount = other.PagesCount;
        Links = other.Links;
        Authors = other.Authors;
        IsSheetMusic = other.IsSheetMusic;
    }

    /// <summary>
    /// Gets the song name, including optional Hebrew song name.
    /// </summary>
    /// <returns></returns>
    public string GetSongName()
    {
        // Do we have a Hebrew song name as well? Then use "EnglishSongName HebrewSongName" as the format.
        return this.HebrewSongName switch
        {
            var val when string.IsNullOrWhiteSpace(val) => this.Song,
            _ => $"{this.Song} {this.HebrewSongName}"
        };
    }

    /// <summary>
    /// Returns a string in the format of "Artist - Song Name {optional Hebrew Song name} - {optional key}"
    /// </summary>
    /// <returns></returns>
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