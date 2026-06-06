using MessianicChords.Models;

namespace MessianicChords.Services;

/// <summary>
/// Service for fetching album art for chord sheets that link to Chavah Messianic Radio song IDs.
/// </summary>
public class AlbumArtFetcher
{
    private const string RedirectLookupClientName = "AlbumArtRedirectLookup";

    private readonly ILogger<AlbumArtFetcher> logger;
    private readonly GoogleDriveChordsFetcher chordsFetcher;
    private readonly IHttpClientFactory httpClientFactory;
    

    public AlbumArtFetcher(
        GoogleDriveChordsFetcher chordsFetcher,
        IHttpClientFactory httpClientFactory,
        ILogger<AlbumArtFetcher> logger)
    {
        this.chordsFetcher = chordsFetcher;
        this.httpClientFactory = httpClientFactory;
        this.logger = logger;
    }

    /// <summary>
    /// Fetches album art for the given chord sheet if linked to a Chavah Messianic Radio song.
    /// </summary>
    public async Task<Uri?> TryFetchAlbumArt(ChordSheet chordSheet)
    {
        var chavahSongLink = chordSheet.Links.FirstOrDefault(l => l.Host.Contains("messianicradio.com", StringComparison.OrdinalIgnoreCase));
        if (chavahSongLink != null)
        {
            var queryParams = System.Web.HttpUtility.ParseQueryString(chavahSongLink.Query);
            var songId = queryParams["song"];
            if (!string.IsNullOrWhiteSpace(songId))
            {
                // We have a Chavah song ID. Ask Chavah for the true album art URL: this will be a redirect to the real URL.
                var chavahAlbumArtRedirector = new Uri($"https://messianicradio.com/api/albums/GetAlbumArtBySongId?songid={songId}");

                try
                {
                    var httpClient = this.httpClientFactory.CreateClient(RedirectLookupClientName);
                    using var response = await httpClient.GetAsync(chavahAlbumArtRedirector, HttpCompletionOption.ResponseHeadersRead);
                    var statusCode = (int)response.StatusCode;
                    if (statusCode >= 300 && statusCode < 400)
                    {
                        var redirectLocation = response.Headers.Location;
                        if (redirectLocation != null)
                        {
                            var target = redirectLocation.IsAbsoluteUri
                                ? redirectLocation
                                : new Uri(chavahAlbumArtRedirector, redirectLocation);

                            return target;
                        }
                    }
                }
                catch (Exception error)
                {
                    logger.LogWarning(error, "Unable to fetch album art redirect URL for song ID {songId}", songId);
                }
            }
        }

        return null;
    }
}
