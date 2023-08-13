using MessianicChords.Models;
using MessianicChords.Services;
using Raven.Migrations;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MessianicChords.Migrations
{
    [Migration(2)]
    public class ChordSheetsArePublishedToWeb : Migration
    {
        private readonly GoogleDriveChordsFetcher chordFetcher;

        public ChordSheetsArePublishedToWeb(GoogleDriveChordsFetcher chordFetcher)
        {
            this.chordFetcher = chordFetcher;
        }

        public override void Up()
        {
            var allGDocs = this.chordFetcher.GetAllDocs()
                .ConfigureAwait(false).GetAwaiter().GetResult();

            using var session = this.DocumentStore.OpenSession();
            var chordSheets = this.Stream<ChordSheet>().ToList();

            foreach (var gDoc in allGDocs)
            {
                // Find the relevant Raven doc.
                var matchingChordSheet = chordSheets.FirstOrDefault(c => c.GoogleDocId == gDoc.Id);
                if (matchingChordSheet != null)
                {
                    session.Advanced.Patch<ChordSheet, string?>(matchingChordSheet.Id, c => c.GoogleDocResourceKey, gDoc.ResourceKey ?? string.Empty);
                }
            }

            session.SaveChanges();
        }
    }
}
