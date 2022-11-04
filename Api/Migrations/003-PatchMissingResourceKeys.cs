using MessianicChords.Models;
using MessianicChords.Services;
using Raven.Migrations;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MessianicChords.Api.Migrations
{
    [Migration(3)]
    public class PatchMissingResourceKeys : Migration
    {
        private readonly GoogleDriveChordsFetcher gDriveChordsFetcher;

        public PatchMissingResourceKeys(GoogleDriveChordsFetcher gDriveChordsFetcher)
        {
            this.gDriveChordsFetcher = gDriveChordsFetcher;
        }

        public override void Up()
        {
            using var session = DocumentStore.OpenSession();
            var chordsWithMissingResourceKeys = session.Query<ChordSheet>()
                .Where(c => c.GoogleDocResourceKey == "" || c.GoogleDocResourceKey == null)
                .ToList();

            var allGDocs = gDriveChordsFetcher.GetAllDocs()
                .ConfigureAwait(false).GetAwaiter().GetResult();

            // Match up the Google Docs with the chords.
            
            foreach (var gDoc in allGDocs)
            {
                var matchingChord = chordsWithMissingResourceKeys.FirstOrDefault(c => c.GoogleDocId == gDoc.Id);
                if (matchingChord != null && !string.IsNullOrWhiteSpace(gDoc.ResourceKey))
                {
                    session.Advanced.Evict(matchingChord);
                    session.Advanced.Patch<ChordSheet, string?>(matchingChord.Id, c => c.GoogleDocResourceKey, gDoc.ResourceKey);
                }
            }

            session.SaveChanges();
        }
    }
}
