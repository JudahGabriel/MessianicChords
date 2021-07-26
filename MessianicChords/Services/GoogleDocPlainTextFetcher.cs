using MessianicChords.Common;
using MessianicChords.Data;
using MessianicChords.Models;
using Microsoft.Extensions.Logging;
using Raven.Client;
using Raven.Client.Documents;
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
    public class GoogleDocPlainTextFetcher
    {
        private readonly DocumentTextFetchRecord plainTextFetchRecord = new();
        private readonly GoogleDriveChordsFetcher chordsFetcher;
        private readonly IDocumentStore db;
        private readonly ILogger<GoogleDocPlainTextFetcher> logger;

        public GoogleDocPlainTextFetcher(
            GoogleDriveChordsFetcher chordsFetcher, 
            IDocumentStore db,
            ILogger<GoogleDocPlainTextFetcher> logger)
        {
            this.chordsFetcher = chordsFetcher;
            this.db = db;
            this.logger = logger;
        }

        public async Task Start()
        {
            try
            {
                await TryUpdateDocPlainText();
            }
            catch (Exception error)
            {
                plainTextFetchRecord.Log.Add($"Exception during plain text fetch. {error}");
            }
            finally
            {
                await TrySaveFetchRecord();
            }
        }

        private async Task TryUpdateDocPlainText()
        {
            // Find the .docx files that need plain text fetch.
            using var dbSession = db.OpenAsyncSession();
            var docsNeedingPlainTextUpdate = await dbSession.Query<ChordSheet>()
                .Where(c => c.HasFetchedPlainTextContents == false && c.Extension == "docx")
                .OrderByDescending(c => c.LastUpdated)
                .Take(5)
                .ToListAsync();

            this.plainTextFetchRecord.ChordIds = docsNeedingPlainTextUpdate
                .Select(c => c.Id)
                .ToList();
            this.plainTextFetchRecord.ChordDescriptions = docsNeedingPlainTextUpdate
                .Select(c => c.GetDisplayName())
                .ToList();

            foreach (var doc in docsNeedingPlainTextUpdate)
            {
                plainTextFetchRecord.Log.Add($"Attempting plain text extraction for {doc.Id}, {doc.GetDisplayName()}");
                try
                {
                    var plainText = await FetchPlainTextForChord(doc);
                    doc.PlainTextContents = plainText;
                    plainTextFetchRecord.Log.Add("Successfully extracted plain text. Length is " + plainText.Length);
                }
                catch (Exception error)
                {
                    plainTextFetchRecord.Log.Add("Unable to fetch plain text due to exception. " + error.ToString());
                }
                finally
                {
                    doc.HasFetchedPlainTextContents = true;
                }
            }

            await dbSession.SaveChangesAsync();
        }

        private async Task TrySaveFetchRecord()
        {
            try
            {
                using var dbSession = db.OpenAsyncSession();
                await dbSession.StoreAsync(this.plainTextFetchRecord);
                dbSession.SetRavenExpiration(this.plainTextFetchRecord, DateTime.UtcNow.AddDays(30 * 6));
                await dbSession.SaveChangesAsync();
            }
            catch (Exception error)
            {
                logger.LogError(error, "Unable to save plain text fetch record due to error.");
            }
        }

        private async Task<string> FetchPlainTextForChord(ChordSheet chord)
        {
            using var stream = await chordsFetcher.GetChordSheetStream(chord.GoogleDocId);
            
            // We have a .docx on Google Drive.
            // Download it, crack it open, extract plain text.
            var converter = new DocxToText(stream, plainTextFetchRecord);
            try
            {
                var plainText = converter.ExtractText();
                plainTextFetchRecord.Log.Add($"Successfully extracted plain text for {chord.GetDisplayName()}");
                return plainText;
            }
            catch (Exception error)
            {
                plainTextFetchRecord.Log.Add($"Error extracting plain text. {error}");
                return string.Empty;
            }
        }
    }
}