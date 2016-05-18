using MessianicChords.Models;
using Raven.Client.Indexes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

using Raven.Client.Linq.Indexing;
using Raven.Abstractions.Indexing;
using Raven.Abstractions.Data;

namespace MessianicChords.Data
{
    public class ChordSheetSearch : AbstractIndexCreationTask<ChordSheet>
    {
        public ChordSheetSearch()
        {
            Map = chordSheets => from sheet in chordSheets
                                 select new
                                 {
                                     Song = sheet.Song,
                                     Artist = sheet.Artist,
                                     PlainTextContents = sheet.PlainTextContents
                                 };
            
            Indexes.Add(x => x.Song, FieldIndexing.Analyzed);
            Indexes.Add(x => x.Artist, FieldIndexing.Analyzed);
            Indexes.Add(x => x.PlainTextContents, FieldIndexing.Analyzed);

            Suggestion(x => x.Song);
            Suggestion(x => x.Artist);
        }
    }
}