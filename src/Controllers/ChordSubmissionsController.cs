using MessianicChords.Models;
using MessianicChords.Common;
using Microsoft.AspNetCore.Mvc;
using Raven.Client.Documents.Session;
using MessianicChords.Services;
using Microsoft.Extensions.Options;
using Microsoft.AspNetCore.Authorization;
using System.Xml;
using System.ServiceModel.Syndication;

namespace MessianicChords.Controllers
{
    [Route("chordSubmissions")]
    public class ChordSubmissionsController : Controller
    {
        private readonly IAsyncDocumentSession dbSession;
        private readonly ILogger<HomeController> logger;
        private readonly ChordSubmissionService chordSubmissionService;

        public ChordSubmissionsController(
            IAsyncDocumentSession dbSession,
            ChordSubmissionService chordSubmissionService,
            ILogger<HomeController> logger)
        {
            this.dbSession = dbSession;
            this.chordSubmissionService = chordSubmissionService;
            this.logger = logger;
        }

        [HttpGet("review")]
        public async Task<IActionResult> Review(string id, [FromQuery] string token)
        {
            if (string.IsNullOrWhiteSpace(token))
            {
                return BadRequest("No token specified.");
            }

            if (!id.StartsWith("ChordSubmissions/", StringComparison.OrdinalIgnoreCase))
            {
                throw new ArgumentException("Invalid ID");
            }

            var submission = await this.dbSession.LoadRequiredAsync<ChordSubmission>(id);
            if (string.IsNullOrEmpty(submission.EditedChordSheetId))
            {
                var reviewNewChordModel = new ReviewNewChordSubmission(submission, token);
                return View("ReviewNew", reviewNewChordModel);
            }

            var original = await this.dbSession.LoadRequiredAsync<ChordSheet>(submission.EditedChordSheetId);
            var reviewEditedChordModel = new ReviewEditedChordSubmission(submission, original, token);
            return View("ReviewEdited", reviewEditedChordModel);
        }

        [HttpGet("feed")]
        public async Task<IActionResult> RssFeed([FromQuery] string token, [FromServices] IOptions<AppSettings> settings)
        {
            if (token != settings.Value.RssFeedKey)
            {
                return Unauthorized();
            }

            var submissions = await chordSubmissionService.GetAll(0, 100);
            var feedItems = submissions.Select(s => new SyndicationItem(
                    title: s.EditedChordSheetId == null ? $"New chord chart: {s.GetDisplayName()}" : $"Updated chart for {s.GetDisplayName()}",
                    content: $"<a href='https://messianicchords.com/chordsubmissions/review?id={s.Id!.ToLower()}&token={s.ApproveRejectKey}'>Review {s.GetDisplayName()}</a>",
                    itemAlternateLink: new Uri($"https://messianicchords.com/chordsubmissions/review?id={s.Id.ToLower()}&token={s.ApproveRejectKey}"),
                    id: s.ApproveRejectKey,
                    lastUpdatedTime: s.Created));

            var feed = new SyndicationFeed("MessianicChords chart submission feed", "Latest chord charts for Messianic worship music", new Uri($"https://messianicchords.com/chordsubmissions/feed?key={token}"));
            feed.Items = feedItems;

            using var sw = new StringWriter();
            using var writer = XmlWriter.Create(sw);
            var rssFormatter = new Rss20FeedFormatter(feed);
            rssFormatter.WriteTo(writer);
            writer.Flush();

            return Content(sw.ToString(), "application/xml");
        }

        /// <summary>
        /// Gets all pending chord submissions with their original chord sheets (for edits). Admin only.
        /// </summary>
        [HttpGet("~/api/chordsubmissions/pending")]
        [Authorize(Roles = AppUser.AdminRole)]
        public async Task<List<PendingChordSubmission>> GetPending()
        {
            var submissions = await chordSubmissionService.GetAll(0, 100);

            // Load the original chord sheets for edit submissions.
            var editedIds = submissions
                .Where(s => !string.IsNullOrWhiteSpace(s.EditedChordSheetId))
                .Select(s => s.EditedChordSheetId!)
                .Distinct()
                .ToList();
            var originals = editedIds.Count > 0
                ? await dbSession.LoadAsync<ChordSheet>(editedIds)
                : new Dictionary<string, ChordSheet>();

            return submissions.Select(s =>
            {
                ChordSheet? original = null;
                if (!string.IsNullOrWhiteSpace(s.EditedChordSheetId))
                {
                    originals.TryGetValue(s.EditedChordSheetId!, out original);
                }
                return new PendingChordSubmission(s, original);
            }).ToList();
        }

        /// <summary>
        /// Approves a chord submission. Admin only, no token required.
        /// </summary>
        [HttpPost("~/api/chordsubmissions/approve")]
        [Authorize(Roles = AppUser.AdminRole)]
        public async Task<IActionResult> Approve([FromBody] ChordSubmissionApproval decision)
        {
            decision.Approved = true;
            await chordSubmissionService.ApproveOrRejectByAdmin(decision);
            return Ok(new { message = "Chord chart submission approved." });
        }

        /// <summary>
        /// Rejects a chord submission. Admin only, no token required.
        /// </summary>
        [HttpPost("~/api/chordsubmissions/reject")]
        [Authorize(Roles = AppUser.AdminRole)]
        public async Task<IActionResult> Reject([FromBody] ChordSubmissionApproval decision)
        {
            decision.Approved = false;
            await chordSubmissionService.ApproveOrRejectByAdmin(decision);
            return Ok(new { message = "Chord chart submission rejected." });
        }
    }
}