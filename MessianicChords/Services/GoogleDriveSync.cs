using MessianicChords.Common;
using MessianicChords.Data;
using MessianicChords.Models;
using Raven.Abstractions.Data;
using Raven.Client;
using Raven.Client.Linq;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;

namespace MessianicChords.Services
{
    /// <summary>
    /// Syncs the chords stored in Google Drive with the chords in the database.
    /// </summary>
    public class GoogleDriveSync
    {
        private readonly ChordsFetcher chordsFetcher;
        private readonly Stopwatch stopwatch = new Stopwatch();
        private readonly SyncRecord syncRecord = new SyncRecord();
        private readonly long lastChangeId;

        public GoogleDriveSync(ChordsFetcher chordsFetcher, long lastChangeId)
        {
            this.chordsFetcher = chordsFetcher;
            this.lastChangeId = lastChangeId;
            this.syncRecord.LastChangeId = lastChangeId;
        }

        public async Task<SyncRecord> Start(IAsyncDocumentSession session)
        {
            stopwatch.Start();

            var allChordSheets = await this.GetMatchingChordSheets(session, c => true);
            var allGDocs = await chordsFetcher.GetChords();
            await EnsureAllGDocsAreInRaven(allChordSheets, allGDocs);
            EnsureAllRavenDocsAreInGoogle(session, allChordSheets, allGDocs);
            await EnsureChordSheetsAreUpdated(session, allChordSheets, allGDocs);
            
            syncRecord.Elapsed = stopwatch.Elapsed;

            return syncRecord;
        }

        private async Task EnsureAllGDocsAreInRaven(List<ChordSheet> allChordSheets, List<ChordSheetMetadata> allGDocs)
        {
            syncRecord.Log.Add($"Looking for new chords in Google Drive.");
            var googleDriveChordIds = allGDocs.Select(c => c.GoogleDocId).ToList();
            var googleChordIdsInRaven = allChordSheets.Select(c => c.GoogleDocId).ToList();
            
            var docIdsMissingFromRaven = googleDriveChordIds.Except(googleChordIdsInRaven);
            using (var bulkInsert = RavenStore.Instance.BulkInsert())
            {
                foreach (var docId in docIdsMissingFromRaven)
                {
                    var chordSheet = await chordsFetcher.CreateChordSheet(docId);

                    // Make sure it's not one of those temporary files created by Word.
                    var isWordTempFile = IsTempFile(chordSheet);
                    var isConflictFile = IsConflict(chordSheet);
                    if (!isWordTempFile && !isConflictFile)
                    {
                        bulkInsert.Store(chordSheet);
                        syncRecord.Log.Add($"Google doc {docId} was missing from Raven. Added it as {chordSheet.Id}, {chordSheet.GetDisplayName()}.");
                        syncRecord.AddedDocs.Add(chordSheet.GetDisplayName());
                    }
                }
            }
        }

        private void EnsureAllRavenDocsAreInGoogle(IAsyncDocumentSession session, List<ChordSheet> allChordSheets, List<ChordSheetMetadata> allGDocs)
        {
            syncRecord.Log.Add($"Looking for deleted chords from Google Drive.");
            var googleDocIds = allGDocs.Select(c => c.GoogleDocId).ToList();

            var ravenDocIdsToDelete = allChordSheets
                .Where(ravenDoc => !googleDocIds.Contains(ravenDoc.GoogleDocId))
                .ToList();
            ravenDocIdsToDelete.ForEach(d => syncRecord.RemovedDocs.Add(d.GetDisplayName()));
            ravenDocIdsToDelete.ForEach(d => session.Delete(d.Id)); // Must delete by ID, as these docs don't belong to the session.
            syncRecord.Log.Add($"Found {ravenDocIdsToDelete.Count} docs to delete.");
        }

        /// <summary>
        /// Checks the etags for all the chord sheets. If the etag is different than the one in the database,
        /// update it with the version from Google Drive.
        /// </summary>
        /// <returns></returns>
        private async Task EnsureChordSheetsAreUpdated(IAsyncDocumentSession session, List<ChordSheet> allChords, List<ChordSheetMetadata> allGDocs)
        {
            syncRecord.Log.Add($"Looking for updated chords in Google Drive.");
            var changes = await chordsFetcher.Changes(lastChangeId + 1);
            var changedGDocIds = changes
                .Select(c => c.FileId)
                .ToList();
            var changedRavenDocs = allChords
                .Where(c => changedGDocIds.Contains(c.GoogleDocId))
                .ToList();

            syncRecord.Log.Add($"Found {changedGDocIds.Count} changed Google docs. Matched these up with {changedRavenDocs.Count} changed Raven docs.");

            // Get the changed Raven docs. Because they are streamed in, they're untracked by the session, so we'll need to insert them via bulk insert.
            using (var bulkInsert = RavenStore.Instance.BulkInsert(null, new BulkInsertOptions { OverwriteExisting = true }))
            {
                foreach (var ravenDoc in changedRavenDocs)
                {
                    var refreshedChordSheet = await chordsFetcher.CreateChordSheet(ravenDoc.GoogleDocId);
                    ravenDoc.UpdateFrom(refreshedChordSheet);
                    ravenDoc.HasFetchedPlainTextContents = false; // So that it will be fetched again in the near future.
                    bulkInsert.Store(ravenDoc);
                    syncRecord.Log.Add($"Updated {ravenDoc.Id}, {ravenDoc.GetDisplayName()}");
                    syncRecord.UpdatedDocs.Add(ravenDoc.GetDisplayName());
                }
            }

            syncRecord.LastChangeId = changes.Select(c => c.Id).LastOrDefault() ?? lastChangeId;
            syncRecord.Log.Add($"Updated changed record to {syncRecord.LastChangeId}");
        }

        private bool IsTempFile(ChordSheet sheet)
        {
            return sheet.Artist != null && sheet.Artist.Contains("$") && sheet.Artist.Contains("~");
        }

        private bool IsConflict(ChordSheet sheet)
        {
            return (sheet.Song != null && sheet.Song.Contains("[Conflict]"))
                ||
                (sheet.Key != null && sheet.Key.Contains("[Conflict]"));
        }

        private async Task<List<ChordSheet>> GetMatchingChordSheets(IAsyncDocumentSession session, Func<ChordSheet, bool> filter)
        {
            // Would be really useful if C# supported async iterators.
            var list = new List<ChordSheet>(1000);
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