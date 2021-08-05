using MessianicChords.Data;
using MessianicChords.Models;
using Microsoft.Extensions.Logging;
using Raven.Client.Documents;
using Raven.Client.Documents.Session;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MessianicChords.Services
{
    /// <summary>
    /// Services for interacting with ChordSheet objects.
    /// </summary>
    public class ChordSheetService
    {
        private readonly IDocumentStore db;
        private readonly ILogger<ChordSheetService> logger;

        public ChordSheetService(IDocumentStore db, ILogger<ChordSheetService> logger)
        {
            this.db = db;
            this.logger = logger;
        }

        public async Task<ChordSheet> Get(string id)
        {
            using var dbSession = db.OpenAsyncSession();
            return await dbSession.LoadAsync<ChordSheet>(id);
        }

        public async Task<List<ChordSheet>> Search(string search)
        {
            const int maxResults = 25;
            using var dbSession = db.OpenAsyncSession();
            var searchWithWildcard = search + "*";
            var matchingChords = await dbSession.Query<ChordSheet, ChordSheet_Search>()
                .Search(c => c.Song, searchWithWildcard)
                .Search(c => c.Artist, searchWithWildcard)
                .Search(c => c.PlainTextContents, searchWithWildcard)
                .Take(maxResults)
                .ToListAsync();

            // No results? See if we can suggest some.
            if (matchingChords.Count == 0 && search.Length > 2)
            {
                var songSuggestionResults = await QuerySuggestions(dbSession, c => c.Song, search);
                var artistSuggestionResults = await QuerySuggestions(dbSession, c => c.Artist, search);

                matchingChords = songSuggestionResults
                    .Concat(artistSuggestionResults)
                    .Take(maxResults)
                    .ToList();
            }

            logger.LogInformation("Searched for {term} with {count} results", search, matchingChords.Count);
            return matchingChords;
        }

        public async Task<PagedResults<ChordSheet>> GetBySongName(int skip, int take)
        {
            using var dbSession = db.OpenAsyncSession();
            var chordSheets = await dbSession.Query<ChordSheet>()
                .Statistics(out var stats)
                .OrderBy(sheet => sheet.Song)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
            return new PagedResults<ChordSheet>
            {
                Results = chordSheets,
                Skip = skip,
                Take = take,
                TotalCount = stats.TotalResults
            };
        }

        public async Task<PagedResults<ChordSheet>> GetByArtistName(int skip, int take)
        {
            using var dbSession = db.OpenAsyncSession();
            var chordSheets = await dbSession.Query<ChordSheet>()
                .Statistics(out var stats)
                .OrderBy(sheet => sheet.Artist)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
            return new PagedResults<ChordSheet>
            {
                Results = chordSheets,
                Skip = skip,
                Take = take,
                TotalCount = stats.TotalResults
            };
        }

        public async Task<PagedResults<ChordSheet>> GetByArtistName(string artist, int skip, int take)
        {
            using var dbSession = db.OpenAsyncSession();
            var chordSheets = await dbSession.Query<ChordSheet>()
                .Statistics(out var stats)
                .Where(a => a.Artist == artist)
                .OrderBy(a => a.Song)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
            return new PagedResults<ChordSheet>
            {
                Results = chordSheets,
                Skip = skip,
                Take = take,
                TotalCount = stats.TotalResults
            };
        }

        public async Task<List<ChordSheet>> GetByRandom(int take)
        {
            using var dbSession = db.OpenAsyncSession();
            var chordSheets = await dbSession.Query<ChordSheet>()
                .Customize(x => x.RandomOrdering())
                .Take(take)
                .ToListAsync();
            return chordSheets;
        }

        public async Task<PagedResults<ChordSheet>> GetNew(int skip, int take)
        {
            using var dbSession = db.OpenAsyncSession();
            var chordSheets = await dbSession.Query<ChordSheet>()
                .Statistics(out var stats)
                .OrderByDescending(a => a.Created)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
            return new PagedResults<ChordSheet>
            {
                Results = chordSheets,
                Skip = skip,
                Take = take,
                TotalCount = stats.TotalResults
            };
        }

        private async Task<List<ChordSheet>> QuerySuggestions(IAsyncDocumentSession dbSession, System.Linq.Expressions.Expression<Func<ChordSheet, object>> field, string searchText)
        {
            var suggestResults = await dbSession
                .Query<ChordSheet, ChordSheet_Search>()
                .SuggestUsing(b => b.ByField(field, searchText))
                .ExecuteAsync();
            var firstSuggestion = suggestResults
                .FirstOrDefault()
                .Value?
                .Suggestions
                .FirstOrDefault();
            if (firstSuggestion != null)
            {
                // Run the query for that suggestion.
                return await dbSession
                    .Query<ChordSheet, ChordSheet_Search>()
                    .Search(field, firstSuggestion)
                    .ToListAsync();
            }

            return new List<ChordSheet>(0);
        }
    }
}
