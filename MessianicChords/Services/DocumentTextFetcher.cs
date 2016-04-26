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
        private readonly string chordSheetId;

        public DocumentTextFetcher(string chordSheetId)
        {
            this.chordSheetId = chordSheetId;
        }

        public async Task Fetch()
        {
            using (var session = RavenStore.Instance.OpenAsyncSession())
            {
                var log = new Log { Message = "Attempting to fetch plain text for " + this.chordSheetId + Environment.NewLine };
                try
                {
                    var fetchSuccessful = await FetchRaw(session);
                    if (fetchSuccessful.Item1)
                    {
                        log.Message += "Successfully fetched plain text";
                    }
                    else
                    {
                        log.Message += "Couldn't fetch plain text. " + fetchSuccessful.Item2;
                    }
                }
                catch (Exception error)
                {
                    log.Message += "Error fetching plain text: " + error.ToString();
                }
                finally
                {
                    await session.StoreAsync(log);
                    await session.SaveChangesAsync();
                }
            }
        }

        private async Task<Tuple<bool, string>> FetchRaw(IAsyncDocumentSession session)
        {
            var chordSheet = await session.LoadAsync<ChordSheet>(this.chordSheetId);
            if (chordSheet != null && chordSheet.Extension == "docx")
            {
                var initializer = ChordsFetcher.lastInitializer;
                if (initializer != null)
                {
                    var driveService = new DriveService(initializer);
                    var gDoc = await driveService.Files.Get(chordSheet.GoogleDocId).ExecuteAsync();
                    if (gDoc != null && !string.IsNullOrEmpty(gDoc.DownloadUrl))
                    {
                        using (var webClient = new WebClient())
                        {
                            var docBytes = await webClient.DownloadDataTaskAsync(gDoc.DownloadUrl);
                            using (var docByteStream = new MemoryStream(docBytes))
                            {
                                var converter = new DocxToText(docByteStream);
                                var docText = converter.ExtractText();
                                if (!string.IsNullOrWhiteSpace(docText))
                                {
                                    chordSheet.PlainTextContents = docText;
                                    await session.SaveChangesAsync();
                                    return Tuple.Create(true, "");
                                }
                                else
                                {
                                    return Tuple.Create(false, converter.log.ToString());
                                }
                            }
                        }
                    }
                }
            }

            return Tuple.Create(false, "Got to the bottom. :-(");
        }
    }
}