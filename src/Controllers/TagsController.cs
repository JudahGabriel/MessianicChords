using MessianicChords.Models;
using MessianicChords.Common;
using MessianicChords.Data;
using MessianicChords.Services;
using Microsoft.AspNetCore.Mvc;
using Raven.Client.Documents;
using Raven.Client.Documents.Session;
using System.Text;
using Microsoft.AspNetCore.Authorization;

namespace MessianicChords.Controllers;

[Route("[controller]/[action]")]
public class TagsController : RavenController
{
    public TagsController(IAsyncDocumentSession dbSession, ILogger<TagsController> logger) : base(dbSession, logger)
    {
        
    }

    /// <summary>
    /// Fetches all tags from the songs.
    /// </summary>
    /// <returns></returns>
    [HttpGet]
    public async Task<List<string>> GetAll()
    {
        var tags = await DbSession.Query<ChordSheetTagResult>("ChordSheetTags")
            .Take(1000)
            .ToListAsync();
        return [.. tags
            .OrderBy(r => r.Tag)
            .Select(r => r.Tag)];
    }

    /// <summary>
    /// Fetches all chord sheets by a specific tag.
    /// </summary>
    /// <param name="tag">The tag to filter by.</param>
    /// <returns>A list of chord sheets that match the tag.</returns>
    [HttpGet]
    public async Task<List<ChordSheet>> GetChordSheetsByTag(string tag)
    {
        var result = await DbSession.Query<ChordSheetTagResult>("ChordSheetTags")
            .Include(r => r.ChordSheetIds)
            .FirstOrDefaultAsync(r => r.Tag == tag);
        if (result != null)
        {
            var chordSheets = await DbSession.LoadAsync<ChordSheet>(result.ChordSheetIds);
            return chordSheets
                .Select(kv => kv.Value)
                .Where(v => v != null)
                .ToList();
        }
        return [];
    }

    public class ChordSheetTagResult
    {
        public string Tag { get; set; } = string.Empty;
        public List<string> ChordSheetIds { get; set; } = new();
    }
}