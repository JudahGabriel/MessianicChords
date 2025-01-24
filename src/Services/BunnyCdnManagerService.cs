using MessianicChords.Models;
using Microsoft.Extensions.Options;

namespace MessianicChords.Services;

/// <summary>
/// CDN service that uploads media to BunnyCDN.
/// </summary>
/// <remarks>bunnycdn.com</remarks>
public class BunnyCdnManagerService
{
    private readonly HttpClient http;

    public BunnyCdnManagerService(
        IHttpClientFactory httpClientFactory,
        IOptions<AppSettings> settings)
    {
        this.http = httpClientFactory.CreateClient();
        this.http.BaseAddress = new Uri("https://storage.bunnycdn.com");
        this.http.DefaultRequestHeaders.Add("AccessKey", settings.Value.BunnyCdnApiKey);
        this.http.DefaultRequestHeaders.TryAddWithoutValidation("accept", "application/json");
    }

    /// <summary>
    /// Uploads the source stream to BunnyCDN.
    /// </summary>
    /// <param name="source">The stream containing the data to upload.</param>
    /// <param name="directory">The directory in BunnyCDN to upload to.</param>
    /// <param name="fileName">The name of the file to create in BunnyCDN.</param>
    /// <returns>An HTTP URI pointing to the new file in BunnyCDN.</returns>
    public Task<Uri> UploadScreenshot(Stream source, string fileName)
    {
        return this.Upload(source, "chord-screenshots", fileName);
    }

    /// <summary>
    /// Uploads the source stream to BunnyCDN.
    /// </summary>
    /// <param name="source">The stream containing the data to upload.</param>
    /// <param name="extension">The extension of the file to create in BunnyCDN.</param>
    /// <returns>An HTTP URI pointing to the new file in BunnyCDN.</returns>
    public Task<Uri> UploadTempAttachment(Stream source, string fileName)
    {
        return this.Upload(source, "uploaded-attachments", fileName);
    }

    public Task DeleteTempAttachment(string fileName)
    {
        return this.Delete("uploaded-attachments", fileName);
    }

    private async Task Delete(string directoryName, string fileName)
    {
        var url = $"messianicchords/{directoryName}/{fileName}";
        HttpResponseMessage? deleteResponseOrNull = null;
        try
        {
            deleteResponseOrNull = await http.DeleteAsync(url);
            deleteResponseOrNull.EnsureSuccessStatusCode();
        }
        catch (HttpRequestException uploadError)
        {
            uploadError.Data.Add("fileName", fileName);
            uploadError.Data.Add("url", url);
            if (deleteResponseOrNull != null)
            {
                uploadError.Data.Add("statusCode", deleteResponseOrNull.StatusCode);
                uploadError.Data.Add("reasonPhrase", deleteResponseOrNull.ReasonPhrase);
            }
            throw;
        }
        finally
        {
            deleteResponseOrNull?.Dispose();
        }
    }

    private async Task<Uri> Upload(Stream source, string directoryName, string fileName)
    {
        var url = $"messianicchords/{directoryName}/{fileName}";
        using var sourceStreamContent = new StreamContent(source);
        HttpResponseMessage? uploadResponseOrNull = null;
        try
        {
            uploadResponseOrNull = await http.PutAsync(url, sourceStreamContent);
            uploadResponseOrNull.EnsureSuccessStatusCode();
            return new Uri($"https://messianicchords.b-cdn.net/{directoryName}/{fileName}");
        }
        catch (HttpRequestException uploadError)
        {
            uploadError.Data.Add("fileName", fileName);
            uploadError.Data.Add("url", url);
            if (uploadResponseOrNull != null)
            {
                uploadError.Data.Add("statusCode", uploadResponseOrNull.StatusCode);
                uploadError.Data.Add("reasonPhrase", uploadResponseOrNull.ReasonPhrase);
            }
            throw;
        }
        finally
        {
            uploadResponseOrNull?.Dispose();
        }
    }
}
