using MessianicChords.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

using Raven.Client.Documents.Indexes;
using Raven.Client.Documents.Linq.Indexing;

namespace MessianicChords.Data
{
    public class ChordSheet_Search : AbstractIndexCreationTask<ChordSheet>
    {
        public ChordSheet_Search()
        {
            Map = chordSheets => from sheet in chordSheets
                                 select new
                                 {
                                     Song = sheet.Song.Boost(3),
                                     Artist = sheet.Artist.Boost(2),
                                     PlainTextContents = sheet.PlainTextContents.Boost(1)
                                 };

            Indexes.Add(x => x.Song, FieldIndexing.Search);
            Indexes.Add(x => x.Artist, FieldIndexing.Search);
            Indexes.Add(x => x.PlainTextContents, FieldIndexing.Search);

            Suggestion(x => x.Song);
            Suggestion(x => x.Artist);
        }
    }
}