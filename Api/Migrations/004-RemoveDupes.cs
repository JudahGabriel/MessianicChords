using MessianicChords.Models;
using Raven.Migrations;
using System.Collections.Generic;

namespace MessianicChords.Api.Migrations
{
    [Migration(4)]
    public class RemoveDupes : Migration
    {
        public override void Up()
        {
            // Grab all chord sheets and look for duplicate Google Doc IDs.
            var uniqueGIds = new Dictionary<string, ChordSheet>();
            var chords = this.GetChords();
            var chordSheetIdsToDelete = new List<string>();
            foreach (var chordSheet in chords)
            {
                if (chordSheet.Id == null)
                {
                    continue;
                }

                var isDupe = uniqueGIds.TryGetValue(chordSheet.GoogleDocId, out var existing);
                if (!isDupe)
                {
                    uniqueGIds.Add(chordSheet.GoogleDocId, chordSheet);
                }
                else 
                {
                    // We have a duplicate ChordSheet. Delete the one who's address is null.
                    if (existing?.Id != null)
                    {
                        if (existing.Address == null)
                        {
                            chordSheetIdsToDelete.Add(existing.Id);
                        }
                        else
                        {
                            chordSheetIdsToDelete.Add(chordSheet.Id);
                        }
                    }
                }
            }

            using var session = this.DocumentStore.OpenSession();
            foreach (var id in chordSheetIdsToDelete)
            {
                session.Delete(id);
            }

            session.SaveChanges();
        }

        private IEnumerable<ChordSheet> GetChords()
        {
            using (var dbSession = DocumentStore.OpenSession(Database))
            {
                var collectionName = dbSession.Advanced.DocumentStore.Conventions.GetCollectionName(typeof(ChordSheet));
                var separator = dbSession.Advanced.DocumentStore.Conventions.IdentityPartsSeparator;
                using var enumerator = dbSession.Advanced.Stream<ChordSheet>(collectionName + separator);
                while (enumerator.MoveNext())
                {
                    yield return enumerator.Current.Document;
                }
            }
        }
    }
}
