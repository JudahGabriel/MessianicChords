﻿using Google.GData.Documents;
using MessianicChords.Models;
using MessianicChords.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using Raven.Client;
using Raven.Client.Linq;
using System.Configuration;
using Google.Apis.Auth.OAuth2;
using Raven.Abstractions.Data;
using System.Diagnostics;

namespace MessianicChords.Services
{
    /// <summary>
    /// Syncs the chords stored in Google Drive with the chords in the database.
    /// </summary>
    public class GoogleDriveSync
    {
        private readonly ChordsFetcher chordsFetcher;

        public GoogleDriveSync(ChordsFetcher chordsFetcher)
        {
            this.chordsFetcher = chordsFetcher;
        }

        public async Task<SyncRecord> Start()
        {
            var stopWatch = new Stopwatch();
            stopWatch.Start();
            var syncRecord = new SyncRecord();
            await EnsureAllGDocsAreInRaven(syncRecord)
                .ContinueWith(_ => EnsureAllRavenDocsAreInGoogle(syncRecord))
                .ContinueWith(_ => EnsureChordSheetsAreUpdated(syncRecord));
            syncRecord.Elapsed = stopWatch.Elapsed;
            return syncRecord;
        }

        private async Task EnsureAllGDocsAreInRaven(SyncRecord syncRecord)
        {
            var googleDriveChords = await chordsFetcher.GetChords();
            var googleDriveChordIds = googleDriveChords.Select(c => c.GoogleDocId).ToList();
            var googleChordIdsInRaven = new List<string>(googleDriveChordIds.Count);

            using (var session = RavenStore.Instance.OpenAsyncSession())
            {
                using (var enumerator = await session.Advanced.StreamAsync<ChordSheet>("ChordSheets/"))
                {
                    while (await enumerator.MoveNextAsync())
                    {
                        var currentChordSheet = enumerator.Current.Document;
                        googleChordIdsInRaven.Add(currentChordSheet.GoogleDocId);
                    }
                }                
            }

            var docIdsMissingFromRaven = googleDriveChordIds
                    .Where(id => !googleChordIdsInRaven.Contains(id));

            using (var bulkInsert = RavenStore.Instance.BulkInsert())
            {
                foreach (var docId in docIdsMissingFromRaven)
                {
                    var chordSheet = await chordsFetcher.CreateChordSheet(docId);

                    // Make sure it's not one of those temporary files created by Word.
                    var isWordTempFile = IsTempFile(chordSheet.Artist);
                    if (!isWordTempFile)
                    {
                        bulkInsert.Store(chordSheet);
                        syncRecord.AddedDocs.Add(chordSheet.GetDisplayName());
                    }
                }
            }
        }

        private async Task EnsureAllRavenDocsAreInGoogle(SyncRecord syncRecord)
        {
            var googleDriveChords = await chordsFetcher.GetChords();
            var googleDocIds = googleDriveChords.Select(c => c.GoogleDocId).ToList();
            var ravenDocIdsToDelete = new List<string>();
            using (var session = RavenStore.Instance.OpenAsyncSession())
            {
                using (var enumerator = await session.Advanced.StreamAsync<ChordSheet>("ChordSheets/"))
                {
                    while (await enumerator.MoveNextAsync())
                    {
                        var currentChordSheet = enumerator.Current.Document;
                        if (!googleDocIds.Contains(currentChordSheet.GoogleDocId))
                        {
                            ravenDocIdsToDelete.Add(currentChordSheet.Id);
                            syncRecord.RemovedDocs.Add(currentChordSheet.GetDisplayName());
                        }
                    }
                }

                ravenDocIdsToDelete.ForEach(session.Delete);
                await session.SaveChangesAsync();
            }
        }

        /// <summary>
        /// Checks the etags for all the chord sheets. If the etag is different than the one in the database,
        /// update it with the version from Google Drive.
        /// </summary>
        /// <returns></returns>
        private async Task EnsureChordSheetsAreUpdated(SyncRecord syncRecord)
        {            
            using (var session = RavenStore.Instance.OpenAsyncSession())
            {
                var lastPolledChangeId = await session
                    .Query<ChangesPoll>()
                    .OrderByDescending(p => p.Date)
                    .Select(c => c.LastChangeId)
                    .FirstOrDefaultAsync();

                var changes = await chordsFetcher.Changes(lastPolledChangeId.HasValue ? lastPolledChangeId + 1 : null);
                var changedGDocIds = changes
                    .Select(c => c.FileId)
                    .ToList();
                var changedRavenDocs = await this.GetMatchingChordSheets(session, c => changedGDocIds.Contains(c.GoogleDocId));

                // Get the changed Raven docs. Because they are streamed in, they're untracked by the session, so we'll need to insert them via bulk insert.
                using (var bulkInsert = RavenStore.Instance.BulkInsert(null, new BulkInsertOptions { OverwriteExisting = true }))
                {
                    foreach (var ravenDoc in changedRavenDocs)
                    {
                        var refreshedChordSheet = await chordsFetcher.CreateChordSheet(ravenDoc.GoogleDocId);
                        ravenDoc.UpdateFrom(refreshedChordSheet);
                        bulkInsert.Store(ravenDoc);
                        syncRecord.UpdatedDocs.Add(ravenDoc.GetDisplayName());
                    }
                }

                // Store a ChangesPoll record, indicating the last change ID we polled for.
                // This is done so that next time we check for changes, we can skip all the changes we've already processed.
                var changePollRecord = new ChangesPoll
                {
                    Date = DateTime.UtcNow,
                    LastChangeId = changes.Select(c => c.Id).LastOrDefault() ?? lastPolledChangeId ?? 0
                };
                await session.StoreAsync(changePollRecord);
                session.AddRavenExpiration(changePollRecord, DateTime.UtcNow.AddDays(7));
                await session.SaveChangesAsync();
            }
        }

        private async Task LogIt(string message)
        {
            using (var session = RavenStore.Instance.OpenAsyncSession())
            {
                await session.StoreAsync(new Log { Date = DateTime.UtcNow, Message = message });
                await session.SaveChangesAsync();
            }
        }

        private bool IsTempFile(string artist)
        {
            return artist.Contains("$") && artist.Contains("~");
        }

        private async Task<List<ChordSheet>> GetMatchingChordSheets(IAsyncDocumentSession session, Func<ChordSheet, bool> filter)
        {
            // Would be really useful if C# supported async iterators.
            var list = new List<ChordSheet>(500);
            using (var enumerator = await session.Advanced.StreamAsync<ChordSheet>("ChordSheets/"))
            {
                while (await enumerator.MoveNextAsync())
                {
                    var currentChordSheet = enumerator.Current.Document;
                    if (filter(currentChordSheet))
                    {
                        list.Add(currentChordSheet);
                    }
                }
            }

            return list;
        }
    }
}