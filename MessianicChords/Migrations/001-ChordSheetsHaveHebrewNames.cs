using MessianicChords.Common;
using MessianicChords.Models;
using Raven.Migrations;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MessianicChords.Migrations
{
    [Migration(1)]
    public class ChordSheetsHaveHebrewNames : Migration
    {
        public override void Up()
        {
            this.PatchCollection(@"
                from ChordSheets
                update {
                    if (!this.HebrewSongName) {
                        this.HebrewSongName = null;
                    }
                }
            ");

            using var session = this.DocumentStore.OpenSession();
            using var chordStream = session.Advanced.Stream<ChordSheet>("chordsheets/");
            var songsWithHebrewNames = new List<ChordSheet>();

            while (chordStream.MoveNext())
            {
                var chord = chordStream.Current.Document;
                (var englishName, var hebrewName) = chord.Song.GetEnglishAndHebrew();
                if (!string.IsNullOrEmpty(hebrewName))
                {
                    chord.HebrewSongName = hebrewName;
                    chord.Song = englishName;
                    songsWithHebrewNames.Add(chord);
                }
            }

            // Save the updated chords.
            using var bulkInsert = DocumentStore.BulkInsert();
            foreach (var chord in songsWithHebrewNames)
            {
                bulkInsert.Store(chord);
            }
        }
    }
}
