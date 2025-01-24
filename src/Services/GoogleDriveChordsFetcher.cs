using Google.Apis.Drive.v3;
using Google.Apis.Drive.v3.Data;
using Google.Apis.Services;
using MessianicChords.Models;
using MessianicChords.Common;
using Microsoft.Extensions.Options;
using System.Text.Json;

namespace MessianicChords.Services;

/// <summary>
/// Connects to Google Drive and fetches the IDs of the chord sheet documents.
/// </summary>
public class GoogleDriveChordsFetcher
{
    private readonly DriveService driveApi;
    private readonly AppSettings settings;
    private readonly HttpClient http;
    private readonly ILogger<GoogleDriveChordsFetcher> logger;

    public GoogleDriveChordsFetcher(
        IHttpClientFactory httpClientFactory, 
        IOptions<AppSettings> settings,
        ILogger<GoogleDriveChordsFetcher> logger)
    {
        this.http = httpClientFactory.CreateClient();
        var initializer = new BaseClientService.Initializer
        {
            ApplicationName = "Messianic Chords",
            ApiKey = settings.Value.GDriveApiKey
        };

        this.driveApi = new DriveService(initializer);
        this.settings = settings.Value;
        this.logger = logger;
    }

    /// <summary>
    /// Fetches the chord sheets from Google Drive that have been created or modified since the specified date.
    /// </summary>
    /// <param name="date">The date from which to return chords sheets.</param>
    /// <returns>Chord sheets modified after the specified date.</returns>
    public async Task<List<ChordSheetMetadata>> GetUpdatedDocsSince(DateTime date)
    {
        var listReq = this.driveApi.Files.List();
        listReq.OrderBy = "modifiedTime desc";
        listReq.Q = $"'{this.settings.GDriveFolderId}' in parents and (modifiedTime > '{date:O}' or createdTime > '{date:O}') and (trashed = true or trashed = false)"; // Inside our Messianic chords folder, modified since the specified date, and isn't a folder itself
        listReq.PageSize = 100;
        listReq.IncludeItemsFromAllDrives = true;
        listReq.SupportsAllDrives = true;
        listReq.Fields = "files/id, files/modifiedTime, files/createdTime, files/resourceKey, nextPageToken";
        listReq.AddExecuteInterceptor(new ResourceKeyInterceptor(this.settings.GDriveFolderId, this.settings.GDriveFolderResourceKey));

        var chordSheets = new List<ChordSheetMetadata>(50);
        var hasMoreResults = true;
        while(hasMoreResults)
        {
            var searchResults = await listReq.ExecuteAsync();
            var files = searchResults.Files
                .Select(i => new ChordSheetMetadata
                {
                    GoogleDocId = i.Id,
                    LastModified = i.ModifiedTime ?? i.CreatedTime ?? DateTime.UtcNow,
                    ResourceKey = i.ResourceKey
                })
                .ToArray();
            chordSheets.AddRange(files);
            listReq.PageToken = searchResults.NextPageToken;
            hasMoreResults = !string.IsNullOrEmpty(searchResults.NextPageToken);
        }

        return chordSheets;
    }

    /// <summary>
    /// Fetches all chord sheets from the chords folder in Google Drive.
    /// </summary>
    public async Task<HashSet<string>> GetAllDocsIds()
    {
        var listReq = this.driveApi.Files.List();
        listReq.OrderBy = "modifiedTime";
        listReq.Q = $"'{this.settings.GDriveFolderId}' in parents";
        listReq.IncludeItemsFromAllDrives = true;
        listReq.SupportsAllDrives = true;
        listReq.AddExecuteInterceptor(new ResourceKeyInterceptor(this.settings.GDriveFolderId, this.settings.GDriveFolderResourceKey));

        var allDocIds = new HashSet<string>(2000);
        var hasMoreResults = true;
        while (hasMoreResults)
        {
            var searchResults = await listReq.ExecuteAsync();
            var docIds = searchResults.Files
                .Select(d => d.Id);
            foreach (var id in docIds)
            {
                allDocIds.Add(id);
            }
            listReq.PageToken = searchResults.NextPageToken;
            hasMoreResults = !string.IsNullOrEmpty(searchResults.NextPageToken);
        }

        return allDocIds;
    }

    /// <summary>
    /// Fetches all chord sheets from the chords folder in Google Drive.
    /// </summary>
    public async Task<List<Google.Apis.Drive.v3.Data.File>> GetAllDocs()
    {
        var listReq = this.driveApi.Files.List();
        listReq.OrderBy = "modifiedTime";
        listReq.Q = $"'{this.settings.GDriveFolderId}' in parents";
        listReq.IncludeItemsFromAllDrives = true;
        listReq.SupportsAllDrives = true;
        listReq.AddExecuteInterceptor(new ResourceKeyInterceptor(this.settings.GDriveFolderId, this.settings.GDriveFolderResourceKey));

        var allDocs = new List<Google.Apis.Drive.v3.Data.File>(2000);
        var hasMoreResults = true;
        while (hasMoreResults)
        {
            var searchResults = await listReq.ExecuteAsync();
            allDocs.AddRange(searchResults.Files);
            listReq.PageToken = searchResults.NextPageToken;
            hasMoreResults = !string.IsNullOrEmpty(searchResults.NextPageToken);
        }

        return allDocs;
    }

    /// <summary>
    /// Gets the contents of the specified file.
    /// </summary>
    /// <param name="googleDocId">The ID of the Google Doc.</param>
    /// <param name="resourceKey">The resource key for the doc.</param>
    /// <returns>A stream of the file contents.</returns>
    public async Task<Stream> GetChordSheetStream(string googleDocId, string? resourceKey)
    {
        var query = driveApi.Files.Get(googleDocId);
        query.Fields = "webContentLink";
        if (!string.IsNullOrEmpty(resourceKey))
        {
            query.AddExecuteInterceptor(new ResourceKeyInterceptor(googleDocId, resourceKey));
        }
        var gDoc = await query.ExecuteAsync();

        var bytes = await this.http.GetByteArrayAsync(gDoc.WebContentLink);
        var memStream = new MemoryStream(bytes)
        {
            Position = 0
        };
        return memStream;

        // COMMENTED OUT: below is the proper way to download files in Google Drive.
        // Unfortunately, we consistently get a 404 not found. Not sure why.

        //var query = driveApi.Files.Get(googleDocId);
        //query.SupportsAllDrives = true;

        //var memoryStream = new MemoryStream(50_000);
        //if (!string.IsNullOrEmpty(resourceKey))
        //{
        //    query.AddExecuteInterceptor(new ResourceKeyInterceptor(googleDocId, resourceKey));
        //}

        //var progressError = default(Exception);
        //var progressHandler = new Action<Google.Apis.Download.IDownloadProgress>(progress =>
        //{
        //    if (progress.Exception != null)
        //    {
        //        logger.LogError(progress.Exception, "Google doc download failed for {googleDocId}.", googleDocId);
        //        progressError = progress.Exception;
        //    }
        //    else
        //    {
        //        logger.LogInformation("Google doc download progresssed. {status}, {bytes downloaded}", progress.Status, progress.BytesDownloaded);
        //    }
        //});

        //query.MediaDownloader.ProgressChanged += progressHandler;
        //try
        //{
        //    var downloadTask = await query.DownloadAsync(memoryStream);
        //    if (downloadTask.Exception != null)
        //    {
        //        throw downloadTask.Exception;
        //    }
        //}
        //catch (Exception downloadError)
        //{
        //    logger.LogError(downloadError, "Error downloading Google doc {id}", googleDocId);
        //    memoryStream.Dispose();
        //    throw;
        //}
        //finally
        //{
        //    query.MediaDownloader.ProgressChanged -= progressHandler;
        //}

        //// If there was an exception from the progress handler, throw that here.
        //if (progressError != null)
        //{
        //    memoryStream.Dispose();
        //    throw progressError;
        //}

        //memoryStream.Position = 0;
        //return memoryStream;
    }

    /// <summary>
    /// Gets the web published URI link for a Google doc.
    /// </summary>
    /// <param name="gDocId"></param>
    /// <returns></returns>
    /// <remarks>
    /// NOTE: This throws a 401 error currently, saying authorization is required.
    /// </remarks>
    public async Task<Uri?> GetWebPublishedLink(string gDocId)
    {
        var query = driveApi.Revisions.Get(gDocId, "head");
        query.Fields = "*";
        var lastRevision = await query.ExecuteAsync();

        Uri.TryCreate(lastRevision?.PublishedLink, UriKind.Absolute, out var validUri);
        return validUri;
    }

    public async Task<Google.Apis.Drive.v3.Data.File?> GetDocument(string gDocId, string? resourceKey)
    {
        var query = driveApi.Files.Get(gDocId);
        if (!string.IsNullOrEmpty(resourceKey))
        {
            query.AddExecuteInterceptor(new ResourceKeyInterceptor(gDocId, resourceKey));
        }
        query.Fields = "*";

        var googleDoc = await query.ExecuteAsync();
        return googleDoc;
    }

    public async Task<ChordSheet> CreateChordSheet(string googleDocId, string? resourceKey)
    {
        var googleDoc = await GetDocument(googleDocId, resourceKey);
        if (googleDoc == null)
        {
            logger.LogWarning("Attempted to create ChordSheet from GDoc {id}, but no such doc was found", googleDocId);
            throw new InvalidOperationException("No Google Doc with ID found");
        }

        var artistTitleKey = System.IO.Path.GetFileNameWithoutExtension(googleDoc.Name.Replace('/', ','))
            .Split(new[] { " - " }, StringSplitOptions.RemoveEmptyEntries);
        var artist = artistTitleKey.ElementAtOrDefault(0) ?? "Unknown Artist";
        var songName = artistTitleKey.ElementAtOrDefault(1) ?? string.Empty; // handled below
        var key = artistTitleKey.ElementAtOrDefault(2);

        if (string.IsNullOrWhiteSpace(songName))
        {
            songName = artist;
            artist = "Unknown Artist";
        }

        (var englishName, var hebrewName) = songName.GetEnglishAndHebrew();
        var chavahSong = await TryGetChavahSong(englishName, artist);
        var downloadUrl = googleDoc.WebContentLink switch
        {
            var val when string.IsNullOrEmpty(val) => $"https://docs.google.com/uc?id={googleDocId}&export=download&resourcekey={googleDoc.ResourceKey}",
            _ => googleDoc.WebContentLink
        };

        var chordSheet = new ChordSheet
        {
            Artist = artist,
            Song = englishName,
            HebrewSongName = hebrewName,
            Key = key,
            Address = googleDoc.WebViewLink,
            Created = googleDoc.CreatedTime ?? DateTime.UtcNow,
            ThumbnailUrl = googleDoc.ThumbnailLink,
            GoogleDocId = googleDoc.Id,
            LastUpdated = googleDoc.ModifiedTime ?? DateTime.UtcNow,
            Extension = !string.IsNullOrEmpty(googleDoc.FileExtension) ? googleDoc.FileExtension : !string.IsNullOrEmpty(googleDoc.FullFileExtension) ? googleDoc.FullFileExtension : ".gdoc",
            PlainTextContents = "",
            HasFetchedPlainTextContents = false,
            HasFetchedThumbnail = false,
            DownloadUrl = downloadUrl,
            ChavahSongId = chavahSong?.Id,
            PagesCount = 1,
            PublishUri = null,
            Authors = new List<string>(),
            Links = new List<Uri>(),
            Copyright = null,
            IsSheetMusic = englishName.Contains("sheet music", StringComparison.OrdinalIgnoreCase),
            Capo = 0
        };
        
        return chordSheet;
    }

    private async Task<ChavahSong?> TryGetChavahSong(string songName, string artist)
    {
        try
        {
            var uri = new Uri($"https://messianicradio.com/api/songs/getsongbynameandartist?name={Uri.EscapeDataString(songName)}&artist={Uri.EscapeDataString(artist)}");
            var songJson = await http.GetStringAsync(uri);
            if (songJson == null)
            {
                return null;
            }

            return JsonSerializer.Deserialize<ChavahSong>(songJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        }
        catch (Exception fetchOrDeserializeError)
        {
            logger.LogWarning(fetchOrDeserializeError, "Attempted to fetch Chavah song for {songName} by {artist}, but encountered an error.", songName, artist);
            return null;
        }
    }

    /// <summary>
    /// Marks a Google Doc file as published to the web. Returns the URL of the published doc.
    /// </summary>
    /// <param name="gDocId">The ID of the document.</param>
    /// <returns></returns>
    public async Task<Uri> PublishForWeb(string gDocId)
    {
        var revision = new Revision
        {
            Published = true,
            PublishAuto = true
        };
        var updateResult = driveApi.Revisions.Update(revision, gDocId, "head");
        var updatedRevision = await updateResult.ExecuteAsync();
        return new Uri(updatedRevision.PublishedLink);
    }

    /// <summary>
    /// Google Docs request interceptor that adds one or more resource keys to the request.
    /// </summary>
    private class ResourceKeyInterceptor : Google.Apis.Http.IHttpExecuteInterceptor
    {
        private readonly List<(string docId, string resourceKey)> docResourceIds;

        public ResourceKeyInterceptor(string docId, string resourceKey)
        {
            this.docResourceIds = new List<(string docId, string resourceKey)> { (docId, resourceKey) };
        }

        public ResourceKeyInterceptor(List<(string docId, string resourceKey)> docResourceIds)
        {
            this.docResourceIds = docResourceIds;
        }

        public Task InterceptAsync(HttpRequestMessage request, System.Threading.CancellationToken cancellationToken)
        {
            var headerValues = docResourceIds
                .Select(kv => $"{kv.docId}/{kv.resourceKey}");
            request.Headers.Add("X-Goog-Drive-Resource-Keys", string.Join(',', headerValues));
            return Task.CompletedTask;
        }
    }
}
