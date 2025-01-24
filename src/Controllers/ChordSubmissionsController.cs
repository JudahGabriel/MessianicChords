using MessianicChords.Models;
using MessianicChords.Common;
using Microsoft.AspNetCore.Mvc;
using Raven.Client.Documents.Session;

namespace MessianicChords.Controllers
{
    [Route("chordSubmissions")]
    public class ChordSubmissionsController : Controller
    {
        private readonly IAsyncDocumentSession dbSession;
        private readonly ILogger<HomeController> logger;

        public ChordSubmissionsController(
            IAsyncDocumentSession dbSession,
            ILogger<HomeController> logger)
        {
            this.dbSession = dbSession;
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
    }
}
