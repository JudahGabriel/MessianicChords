using MessianicChords.Api.Models;
using MessianicChords.Api.Services;
using MessianicChords.Common;
using MessianicChords.Models;
using MessianicChords.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Routing;
using Microsoft.Extensions.Options;
using Raven.Client.Documents.Session;
using System.ServiceModel.Syndication;
using System.Xml;

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
        public async Task<IActionResult> Review(string id, [FromQuery]string token)
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
                    content: $"<a href='https://messianicchords.com/chordsubmissions/review?id={s.Id}&token={s.ApproveRejectKey}'>Review {s.GetDisplayName()}</a>",
                    itemAlternateLink: new Uri($"https://messianicchords.com/chordsubmissions/review?id={s.Id}&token={s.ApproveRejectKey}"),
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
    }
}
