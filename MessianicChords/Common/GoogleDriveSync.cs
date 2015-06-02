using Google.GData.Documents;
using MessianicChords.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using Raven.Client;
using Raven.Client.Linq;
using System.Configuration;
using Google.Apis.Auth.OAuth2;

namespace MessianicChords.Common
{
    /// <summary>
    /// Syncs the chords stored in Google Drive with the chords in the database.
    /// </summary>
    public class GoogleDriveSync
    {
        public Task StartSync()
        {            
            var startSyncTime = DateTime.Now;
            return Task
                .Factory
                .StartNew(() => EnsureAllGDocsAreInRaven(startSyncTime))
                .ContinueWith(_ => EnsureAllRavenDocsAreInGoogle(startSyncTime));
        }

        private void EnsureAllGDocsAreInRaven(DateTime startSyncTime)
        {
            var nextChunkUri = "https://docs.google.com/feeds/default/private/full/" + Constants.MessianicChordsFolderId + "/contents";
            var docService = new DocumentsService("MessianicChords.com");

            //docService.setUserCredentials(ConfigurationManager.AppSettings["googleAccount"], ConfigurationManager.AppSettings["googlePassword"]);

            while (nextChunkUri != null)
            {
                if (string.IsNullOrEmpty(nextChunkUri))
                {
                    break;
                }

                var docQuery = new DocumentsListQuery();
                docQuery.Uri = new Uri(nextChunkUri);
                docQuery.BaseAddress = nextChunkUri;
                var feed = docService.Query(docQuery);
                feed
                    .Entries
                    .Select(ChordSheet.FromGDoc)
                    .Chunk(c => c, 25)
                    .ForEach(c => EnsureExistsInDatabase(c, startSyncTime));

                nextChunkUri = feed.NextChunk;
            }
        }

        private void EnsureExistsInDatabase(IEnumerable<ChordSheet> googleDocChordSheets, DateTime startSyncTime)
        {
            var gDocChordChunk = googleDocChordSheets.Where(c => c != null).ToArray();
            var gDocChordHashes = gDocChordChunk.Select(c => c.AddressHash).ToArray();
            using (var session = RavenStore.Instance.OpenSession())
            {
                // Update the LastSyncCheck for the google doc chord sheets that are in the database.
                var chordsInDb = session
                    .Query<ChordSheet>()
                    .Where(a => a.AddressHash.In(gDocChordHashes))
                    .ToArray();
                chordsInDb.ForEach(c => c.LastSyncCheck = startSyncTime);

                // Update the last modified date in the database if necessary.
                var updatedChords = from ravenChord in chordsInDb
                                    join gDocChord in gDocChordChunk on ravenChord.AddressHash equals gDocChord.AddressHash
                                    where ravenChord.LastUpdated != gDocChord.LastUpdated
                                    select new
                                    {
                                        NewUpdatedDate = gDocChord.LastUpdated,
                                        ChordSheet = ravenChord
                                    };
                updatedChords.ForEach(c => c.ChordSheet.LastUpdated = c.NewUpdatedDate);
                                
                // Add any missing chords to the database.
                var hashesInDb = chordsInDb.Select(c => c.AddressHash).ToArray();
                var chordsMissingFromDb = gDocChordChunk.Except(c => hashesInDb.Contains(c.AddressHash));
                chordsMissingFromDb
                    .Do(c => c.LastSyncCheck = startSyncTime)
                    .ForEach(session.Store);

                session.SaveChanges();
            }
        }

        private void EnsureAllRavenDocsAreInGoogle(DateTime lastSyncStartTime)
        {
            using (var session = RavenStore.Instance.OpenSession())
            {
                var deletedChords = session
                    .Query<ChordSheet>()
                    .Customize(x => x.WaitForNonStaleResultsAsOfLastWrite(TimeSpan.FromSeconds(10)))
                    .Where(c => c.LastSyncCheck < lastSyncStartTime)
                    .ToArray();
                
                deletedChords.ForEach(session.Delete);
                session.SaveChanges();
            }
        }
    }
}