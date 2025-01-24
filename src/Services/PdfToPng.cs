using System.Net.Http.Headers;
using System.Text.Json;

namespace MessianicChords.Services;

	/// <summary>
	/// Service that uses https://pdftopng.net to convert a PDF to a zip file containing one or more PNG files.
	/// MessianicChords uses this to programmatically take screenshots of PDF documents.
	/// </summary>
	public class PdfToPng
{
    private readonly HttpClient http;
    private readonly ILogger<PdfToPng> logger;

    public PdfToPng(IHttpClientFactory httpFactory, ILogger<PdfToPng> logger)
    {
        this.http = httpFactory.CreateClient();
        this.logger = logger;
    }

		/// <summary>
		/// Converts the specified PDF to a list of PNGs.
		/// </summary>
		/// <param name="pdfStream">The stream of the PDF to convert.</param>
		/// <param name="fileName">The file name of the PDF.</param>
		/// <returns>A list containing one or more PNG image streams.</returns>
		public async Task<List<Stream>> Convert(Stream pdfStream, string fileName)
		{
			// Step 1: upload the PDF
			var uploadResult = await UploadPdf(pdfStream, fileName);

			// Step 2: convert it to PNG
			await ConvertPdf(uploadResult.Id, fileName);

			// Step 3: download the zip file containing the PNG(s)
			var zipBytes = await DownloadZip(uploadResult.Id);

			// Step 4: grab the PNG streams out of the zip.
			return await GetPngsFromZip(zipBytes, fileName);
		}

		private async Task<UploadPdfResult> UploadPdf(Stream pdfStream, string fileName)
		{
			var uploadUrl = new Uri("https://softparade.net/uploadfile");

			using var uploadBody = new MultipartFormDataContent
			{
				{ new StreamContent(pdfStream), "file", fileName }
			};

			using var postResult = await http.PostAsync(uploadUrl, uploadBody);
			postResult.EnsureSuccessStatusCode();
			var postResultString = await postResult.Content.ReadAsStringAsync();
			if (string.IsNullOrWhiteSpace(postResultString))
			{
				throw new Exception($"Unable to parse PDF to PNG response for {fileName}. Upload response was empty.");
			}

			var uploadResult = JsonSerializer.Deserialize<UploadPdfResult>(postResultString, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
			if (uploadResult == null)
			{
				throw new Exception($"Unable to parse PDF to PNG response for {fileName}. Upload response returned a null JSON object. {postResultString}");
			}
			if (uploadResult.Status != "ok")
			{
				throw new Exception($"Unable to upload PDF to PDF-to-PNG conversion service due to non-OK status: {uploadResult.Status}");
			}

			return uploadResult;
		}

		private async Task ConvertPdf(string fileId, string fileName)
		{
			// API:
			// Url: https://softparade.net/convert
			// Args:
			//	- file: string. This should be fileId.
			//  - from: "pdf"
			//	- to: "png"

			var uri = new Uri("https://softparade.net/convert");
			var requestMessage = new HttpRequestMessage(HttpMethod.Post, uri);
			requestMessage.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
			requestMessage.Headers.Referrer = new Uri("https://pdftopng.net");

			var requestBody = new FormUrlEncodedContent(new List<KeyValuePair<string, string>>
			{
				new KeyValuePair<string, string>("file", fileId),
				new KeyValuePair<string, string>("from", "pdf"),
				new KeyValuePair<string, string>("to", "png")
			});
			requestMessage.Content = requestBody;
			requestMessage.Content.Headers.ContentType!.MediaType = "application/x-www-form-urlencoded";
			requestMessage.Content.Headers.ContentType.CharSet = "UTF-8";

			var convertResult = await http.SendAsync(requestMessage);
			convertResult.EnsureSuccessStatusCode();

			var convertResultString = await convertResult.Content.ReadAsStringAsync();
			if (string.IsNullOrWhiteSpace(convertResultString))
			{
				throw new Exception("Couldn't convert PDF to PNG. Convert operation returned an empty string.");
			}

			var convertResultObj = JsonSerializer.Deserialize<ConvertPdfResult>(convertResultString, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
			if (convertResultObj == null)
			{
				throw new Exception($"Couldn't convert PDF to PNG for {fileName}. Deserialized JSON result was null.");
			}
			if (convertResultObj.Status != "ok")
			{
				throw new Exception($"Couldn't convert PDF to PNG for {fileName}. Expected result = 'ok', actual result = '{convertResultObj.Status}'");
			}
		}

		private Task<byte[]> DownloadZip(string fileId)
		{
			var url = $"https://softparade.net/download/file?id={Uri.EscapeDataString(fileId)}";
			return http.GetByteArrayAsync(new Uri(url));
		}

		private async Task<List<Stream>> GetPngsFromZip(byte[] zipBytes, string fileName)
		{
			if (zipBytes.Length > 20_000_000)
			{
				throw new Exception($"Unable to converting PDF to PNG for {fileName}, zip size is too large. Max size is 20MB, actual size is {zipBytes.Length}.");
			}

			using var zipStream = new MemoryStream(zipBytes, false);
			using var zipArchive = new System.IO.Compression.ZipArchive(zipStream);
			var pngList = new List<Stream>(zipArchive.Entries.Count);
			foreach (var png in zipArchive.Entries)
			{
				var pngZipStream = png.Open();

				var memStream = new MemoryStream(zipBytes.Length * 2);
				await pngZipStream.CopyToAsync(memStream);
				memStream.Position = 0;
				pngList.Add(memStream);
			}

			return pngList;
		}

		private record UploadPdfResult(string Id, string Status);
		private record UploadPdfResultWithSignature(string FileId);
		private record ConvertPdfResult(string FileName, string Id, string Path, int Size, string Status);
	}
