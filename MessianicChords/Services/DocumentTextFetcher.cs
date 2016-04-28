using Google.Apis.Drive.v2;
using MessianicChords.Data;
using MessianicChords.Models;
using Raven.Client;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using System.Web;

namespace MessianicChords.Services
{
    /// <summary>
    /// Fetches the plain text of .docx files stored in Google Drive and puts them into the chordSheet.PlainTextContents in Raven.
    /// </summary>
    public class DocumentTextFetcher
    {
        private readonly List<ChordSheet> chordSheets;
        private readonly DocumentTextFetchRecord fetchRecord;
        private readonly GoogleDriveApi driveApi;

        public DocumentTextFetcher(IList<ChordSheet> chordSheets, GoogleDriveApi driveApi)
        {
            this.driveApi = driveApi;
            this.chordSheets = chordSheets
                .Where(c => c.Extension == "docx")
                .ToList();
            this.fetchRecord = new DocumentTextFetchRecord
            {
                ChordIds = chordSheets
                    .Select(c => c.Id)
                    .ToList(),
                ChordDescriptions = chordSheets
                    .Select(c => c.GetDisplayName())
                    .ToList()
            };
        }

        public async Task<DocumentTextFetchRecord> Fetch()
        {
            foreach (var chord in chordSheets)
            {
                fetchRecord.Log.Add($"Attempting plain text extraction for {chord.Id}, {chord.GetDisplayName()}");
                try
                {
                    var plainText = await FetchPlainTextForChord(chord);
                    chord.PlainTextContents = plainText;
                    fetchRecord.Log.Add("Successfully extracted plain text. Length is " + plainText.Length);
                }
                catch (Exception error)
                {
                    fetchRecord.Log.Add("Unable to fetch plain text due to exception. " + error.ToString());
                }
                finally
                {
                    chord.HasFetchedPlainTextContents = true;
                }
            }

            return this.fetchRecord;
        }

        private async Task<string> FetchPlainTextForChord(ChordSheet chord)
        {
            var gDoc = await driveApi.GetFile(chord.GoogleDocId);
            if (gDoc == null)
            {
                fetchRecord.Log.Add($"{chord.Id} points to Google doc {chord.GoogleDocId}, but it couldn't be found.");
                return string.Empty;
            }

            if (string.IsNullOrEmpty(gDoc.DownloadUrl))
            {
                fetchRecord.Log.Add($"{chord.Id} points to Google doc {chord.GoogleDocId}, but there was no download URL.");
                return string.Empty;
            }
            
            // We have a .docx on Google Drive.
            // Download it, crack it open, extract plain text.
            var memoryStream = default(MemoryStream);
            try
            {
                memoryStream = await driveApi.DownloadFile(gDoc);
            }
            catch (Exception error)
            {
                fetchRecord.Log.Add($"Failed to download Google doc from {gDoc.DownloadUrl}. {error.ToString()}");
                return string.Empty;
            }

            var converter = new DocxToText(memoryStream, fetchRecord);
            try
            {
                return converter.ExtractText();
            }
            catch (Exception error)
            {
                fetchRecord.Log.Add($"Error extracting plain text. {error.ToString()}");
                return string.Empty;
            }
        }
    }
}