using MessianicChords.Common;
using MessianicChords.Models;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Raven.Client.Documents;
using Raven.Client.Documents.Linq;
using Raven.Client.Documents.Session;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace MessianicChords.Services
{
    /// <summary>
    /// Background service that sync the chords in our Google Drive folder with the chords in the database.
    /// </summary>
    public class GoogleDriveSync
    {
        private readonly ILogger<GoogleDriveSync> logger;
        private readonly GoogleDriveChordsFetcher chordsFetcher;
        private readonly IDocumentStore db;
        private readonly Stopwatch stopwatch = new();
        private readonly SyncRecord syncRecord = new();

        public GoogleDriveSync(
            GoogleDriveChordsFetcher chordsFetcher,
            ILogger<GoogleDriveSync> logger, 
            IDocumentStore db)
        {
            this.chordsFetcher = chordsFetcher;
            this.db = db;
            this.logger = logger;
        }

        public async Task<SyncRecord> Start()
        {
            stopwatch.Start();
            try
            {
                var lastSyncTime = await GetLastSyncTime();
                syncRecord.Log.Add($"Looking for changes since last sync record of {lastSyncTime}");

                var changedGDocs = await chordsFetcher.GetUpdatedDocsSince(lastSyncTime);
                if (changedGDocs.Count > 0)
                {
                    await AddNewChordSheetsToDb(changedGDocs);
                    await UpdateExistingDocsInDb(changedGDocs);
                }

                await RemoveDeletedDocsFromDb();
            }
            catch (Exception error)
            {
                logger.LogError(error, "Failed to perform GoogleDrive sync due to exception");
                syncRecord.Log.Add("Exception during sync: " + error.ToString());
            }
            finally
            {
                syncRecord.Elapsed = stopwatch.Elapsed;
                await TrySaveSyncRecord();
            }

            return syncRecord;
        }

        private async Task RemoveDeletedDocsFromDb()
        {
            // TODO: is there a better way to find deleted docs in GDrive? I can't figure out a better way. :-(

            var gDocIds = await chordsFetcher.GetAllDocsIds();
            using var dbSession = db.OpenAsyncSession();
            var allChordSheets = dbSession.Advanced.Stream<ChordSheet>();
            var removedChords = new List<ChordSheet>(5);
            await foreach (var chordSheet in allChordSheets)
            {
                var isInGDrive = gDocIds.Contains(chordSheet.GoogleDocId);
                if (!isInGDrive)
                {
                    removedChords.Add(chordSheet);
                }
            }

            // Sanity check: are all the docs deleted? Umm, something is wrong. Punt.
            if (removedChords.Count > 20)
            {
                logger.LogWarning("{count} chords about to be deleted from DB. Possible bug, so skipping deletion. Punting. {chords}", removedChords.Count, removedChords);
                return;
            }

            if (removedChords.Any())
            {
                syncRecord.Log.Add($"Found {removedChords.Count} removed chords");
                foreach (var chord in removedChords)
                {
                    dbSession.Delete(chord.Id);
                    syncRecord.RemovedDocs.Add(chord.GetDisplayName());
                }
            }

            await dbSession.SaveChangesAsync();
        }

        private async Task TrySaveSyncRecord()
        {
            try
            {
                using var session = db.OpenAsyncSession();
                var startTime = DateTime.UtcNow.Subtract(stopwatch.Elapsed);
                var syncRecordId = $"SyncRecords/{startTime:O}";
                await session.StoreAsync(syncRecord, syncRecordId);
                session.SetRavenExpiration(syncRecord, DateTime.UtcNow.AddDays(60));
                await session.SaveChangesAsync();
            }
            catch (Exception error)
            {
                logger.LogError(error, "Unable to save sync record due to exception");
            }
        }

        private async Task AddNewChordSheetsToDb(List<ChordSheetMetadata> updatedDocs)
        {
            using var dbSession = db.OpenAsyncSession();
            var gDocIds = updatedDocs
                .Select(c => c.GoogleDocId)
                .ToList();
            var matchingChordSheets = await dbSession.Query<ChordSheet>()
                .Where(c => c.GoogleDocId.In(gDocIds))
                .ToListAsync();
            var googleChordIdsInRaven = matchingChordSheets.Select(c => c.GoogleDocId);
            var gDocIdsMissingFromRaven = gDocIds.Except(googleChordIdsInRaven);
            foreach (var docId in gDocIdsMissingFromRaven)
            {
                var resourceKey = updatedDocs
                    .Where(d => string.Equals(d.GoogleDocId, docId, StringComparison.OrdinalIgnoreCase))
                    .Select(d => d.ResourceKey)
                    .FirstOrDefault() ?? string.Empty;
                var chordSheet = await chordsFetcher.CreateChordSheet(docId, resourceKey);

                // Make sure it's not one of those temporary files created by Word or a conflict file created by Google Drive
                if (!chordSheet.IsTempFile() && !chordSheet.IsConflictFile())
                {
                    // COMMENTED OUT, NOTE TO SELF: Unfortunately, PublishToWeb doesn't work. Google Docs gives an error saying authentication is required. To fix this, we'll need to authorize: https://stackoverflow.com/questions/59148718/google-drive-api-publish-document-and-get-published-link
                    // chordSheet.PublishUri = await TryPublishToWeb(docId);
                    await dbSession.StoreAsync(chordSheet);
                    syncRecord.Log.Add($"Added {docId} as a new ChordSheet. Added it as {chordSheet.Id}, {chordSheet.GetDisplayName()}.");
                    syncRecord.AddedDocs.Add(chordSheet.GetDisplayName());
                }
            }

            await dbSession.SaveChangesAsync();
        }

        private async Task<Uri?> TryPublishToWeb(string gDocId)
        {
            // Try to publish on the web.
            try
            {
                return await chordsFetcher.PublishForWeb(gDocId);
            }
            catch (Exception publishError)
            {
                logger.LogWarning(publishError, "Error when publishing GDoc {id} to the web. This doc won't be set for web publishing.", gDocId);
                return null;
            }
        }

        //private async Task RemovedTrashedDocsFromRaven(List<ChordSheetMetadata> deletedGDocs)
        //{
        //    var deletedGDocIds = deletedGDocs
        //        .Select(d => d.GoogleDocId)
        //        .ToList();

        //    if (deletedGDocIds.Count > 0)
        //    {
        //        using var dbSession = db.OpenAsyncSession();
        //        var chordSheetsToDelete = dbSession.Query<ChordSheet>()
        //            .Where(c => c.GoogleDocId.In(deletedGDocIds))
        //            .ToList();
        //        chordSheetsToDelete.ForEach(d =>
        //        {
        //            syncRecord.RemovedDocs.Add(d.GetDisplayName());
        //            dbSession.Delete(d);
        //        });
        //        await dbSession.SaveChangesAsync();
        //    }
        //}

        /// <summary>
        /// Checks the etags for all the chord sheets. If the etag is different than the one in the database,
        /// update it with the version from Google Drive.
        /// </summary>
        /// <returns></returns>
        private async Task UpdateExistingDocsInDb(List<ChordSheetMetadata> changedGDocs)
        {
            using var dbSession = db.OpenAsyncSession();
            var changedGDocIds = changedGDocs
                .Select(d => d.GoogleDocId)
                .ToList();
            var chordSheets = await dbSession.Query<ChordSheet>()
                .Where(c => c.GoogleDocId.In(changedGDocIds))
                .ToListAsync();

            // Determine what's changed.
            var changedDocs = changedGDocs
                .Join(chordSheets, gDoc => gDoc.GoogleDocId, chordSheet => chordSheet.GoogleDocId, (gDoc, chordSheet) => (gDoc, chordSheet))
                .Where(input => input.gDoc.LastModified != input.chordSheet.LastUpdated)
                .ToList();

            syncRecord.Log.Add($"Found {changedDocs.Count} changed docs.");

            var changedChordSheets = changedDocs.Select(i => i.chordSheet);
            foreach (var chordSheet in changedChordSheets)
            {
                var refreshedChordSheet = await chordsFetcher.CreateChordSheet(chordSheet.GoogleDocId, chordSheet.GoogleDocResourceKey);
                var existingPlainTextContents = chordSheet.PlainTextContents;
                chordSheet.UpdateFrom(refreshedChordSheet);
                chordSheet.HasFetchedPlainTextContents = false; // So that it will be fetched again in the near future.
                chordSheet.PlainTextContents = existingPlainTextContents; // Use existing PlainTextContents until we can refetch them later from the updated doc.
                syncRecord.Log.Add($"Updated {chordSheet.Id}, {chordSheet.GetDisplayName()}");
                syncRecord.UpdatedDocs.Add(chordSheet.GetDisplayName());
            }
            await dbSession.SaveChangesAsync();
        }

        private async Task<DateTime> GetLastSyncTime()
        {
            using var session = db.OpenAsyncSession();
            var lastSyncRecord = await session.Query<SyncRecord>()
                .OrderByDescending(r => r.DateTime)
                .FirstOrDefaultAsync();
            return lastSyncRecord?.DateTime ?? DateTime.UtcNow.Subtract(TimeSpan.FromDays(365));
        }
    }
}
