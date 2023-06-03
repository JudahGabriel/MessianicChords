using MessianicChords.Api.Models;
using MessianicChords.Common;
using MessianicChords.Models;
using MessianicChords.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Raven.Client.Documents.Session;

namespace MessianicChords.Controllers
{
    [Route("chordsubmissions")]
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
        public async Task<IActionResult> Review(string id)
        {
            if (!id.StartsWith("ChordSubmissions/", StringComparison.OrdinalIgnoreCase))
            {
                throw new ArgumentException("Invalid ID");
            }

            var submission = await this.dbSession.LoadRequiredAsync<ChordSubmission>(id);
            if (string.IsNullOrEmpty(submission.EditedChordSheetId))
            {
                return View("ReviewNew", submission);
            }

            var original = await this.dbSession.LoadRequiredAsync<ChordSheet>(submission.EditedChordSheetId);
            var model = new EditedChordSubmission(submission, original);
            return View("ReviewEdited", model);
        }
    }
}
