using MessianicChords.Common;
using MessianicChords.Data;
using MessianicChords.Models;
using MessianicChords.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Raven.Client.Documents;
using Raven.Client.Documents.Session;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MessianicChords.Controllers
{
    [Route("[controller]/[action]")]
    public class ChordsController : RavenController
    {
        private readonly GoogleDriveChordsFetcher gDocFetcher;

        public ChordsController(
            GoogleDriveChordsFetcher gDocFetcher,
            IAsyncDocumentSession dbSession, 
            ILogger<ChordsController> logger)
            : base(dbSession, logger)
        {
            this.gDocFetcher = gDocFetcher;
        }

        [HttpGet]
        public async Task<ChordSheet> Get(string id)
        {
            if (!id.StartsWith("ChordSheets/", StringComparison.OrdinalIgnoreCase))
            {
                throw new ArgumentException("Must be querying for chord sheets");
            }

            var chordSheet = await DbSession.LoadRequiredAsync<ChordSheet>(id);
            return chordSheet;
        }

        [HttpGet]
        public async Task<List<ChordSheet>> Search(string search)
        {
            const int maxResults = 25;
            var searchWithWildcard = search + "*";
            var matchingChords = await DbSession.Query<ChordSheet, ChordSheet_Search>()
                .Search(c => c.Song, searchWithWildcard)
                .Search(c => c.Artist, searchWithWildcard)
                .Search(c => c.PlainTextContents, searchWithWildcard)
                .Take(maxResults)
                .ToListAsync();

            // No results? See if we can suggest some.
            if (matchingChords.Count == 0 && search.Length > 2)
            {
                var songSuggestionResults = await QuerySuggestions(c => c.Song, search);
                var artistSuggestionResults = await QuerySuggestions(c => c.Artist, search);

                matchingChords = songSuggestionResults
                    .Concat(artistSuggestionResults)
                    .Take(maxResults)
                    .ToList();
            }

            logger.LogInformation("Searched for {term} with {count} results", search, matchingChords.Count);
            return matchingChords;
        }

        [HttpGet]
        public async Task<PagedResults<ChordSheet>> GetBySongName(int skip, int take)
        {
            var chordSheets = await DbSession.Query<ChordSheet>()
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

        [HttpGet]
        public async Task<PagedResults<ChordSheet>> GetByArtistName(int skip, int take)
        {
            var chordSheets = await DbSession.Query<ChordSheet>()
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

        [HttpGet]
        public async Task<PagedResults<ChordSheet>> GetArtistSongs(string artist, int skip, int take)
        {
            var chordSheets = await DbSession.Query<ChordSheet>()
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

        [HttpGet]
        public async Task<List<ChordSheet>> GetByRandom(int take)
        {
            var chordSheets = await DbSession.Query<ChordSheet>()
                .Customize(x => x.RandomOrdering())
                .Take(take)
                .ToListAsync();
            return chordSheets;
        }

        [HttpGet]
        public async Task<PagedResults<ChordSheet>> GetNew(int skip, int take)
        {
            var chordSheets = await DbSession.Query<ChordSheet>()
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

        public async Task<FileStreamResult> Download(string id)
        {
            var chordSheet = await DbSession.LoadRequiredAsync<ChordSheet>(id);
            var stream = await this.gDocFetcher.GetChordSheetStream(chordSheet.GoogleDocId, chordSheet.GoogleDocResourceKey);
            this.Response.RegisterForDispose(stream);
            var mimeType = GetMimeTypeFromChordSheetExtension(chordSheet.Extension);
            var songNames = new[]
            {
                chordSheet.Song,
                chordSheet.HebrewSongName
            }.Where(s => !string.IsNullOrWhiteSpace(s));
            var fileName = $"{chordSheet.Artist} - {string.Join(" ", songNames)}.{chordSheet.Extension}";
            return File(stream, mimeType, fileName);
        }

        private async Task<List<ChordSheet>> QuerySuggestions(System.Linq.Expressions.Expression<Func<ChordSheet, object>> field, string searchText)
        {
            var suggestResults = await DbSession
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
                return await DbSession
                    .Query<ChordSheet, ChordSheet_Search>()
                    .Search(field, firstSuggestion)
                    .ToListAsync();
            }

            return new List<ChordSheet>(0);
        }

        private string GetMimeTypeFromChordSheetExtension(string? extension)
        {
            return extension switch
            {
                "docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "pdf" => "application/pdf",
                "jpg" => "image/jpeg",
                "doc" => "application/msword",
                "rtf" => "application/rtf",
                "tif" => "image/tiff",
                _ => "application/octet-stream"
            };
        }
    }
}
