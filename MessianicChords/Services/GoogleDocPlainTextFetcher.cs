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
                await UpdateDocPlainText();
            }
            catch (Exception error)
            {
                logger.LogError(error, "Error updating plain text for documents.");
            }
        }

        private async Task UpdateDocPlainText()
        {
            // Find the .docx files that need plain text fetch.
            using var dbSession = db.OpenAsyncSession();
            var docsNeedingPlainTextUpdate = await dbSession.Query<ChordSheet>()
                .Where(c => c.HasFetchedPlainTextContents == false && c.Extension == "docx")
                .OrderByDescending(c => c.LastUpdated)
                .Take(5)
                .ToListAsync();

            foreach (var doc in docsNeedingPlainTextUpdate)
            {
                try
                {
                    var plainText = await FetchPlainTextForChord(doc);
                    doc.PlainTextContents = plainText;
                }
                catch (Exception error)
                {
                    logger.LogError(error, "Error fetching plain text for {id} {name}", doc.Id, doc.GetDisplayName());
                }
                finally
                {
                    doc.HasFetchedPlainTextContents = true;
                }
            }

            await dbSession.SaveChangesAsync();
        }

        private async Task<string> FetchPlainTextForChord(ChordSheet chord)
        {
            using var stream = await chordsFetcher.GetChordSheetStream(chord.GoogleDocId);
            
            // We have a .docx on Google Drive.
            // Download it, crack it open, extract plain text.
            var converter = new DocxToText(stream);
            try
            {
                var plainText = converter.ExtractText();
                if (string.IsNullOrWhiteSpace(plainText))
                {
                    logger.LogWarning("Unable to fetch plain text for {id} {name}. The text fetch returned an empty result.", chord.Id, chord.GetDisplayName());
                }
                else
                {
                    logger.LogInformation($"Successfully extracted plain text for {chord.GetDisplayName()}");
                }

                return plainText;
            }
            catch (Exception error)
            {
                logger.LogError(error, "Error extracting plain text for {id} {name}", chord.Id, chord.GetDisplayName());
                return string.Empty;
            }
        }
    }
}