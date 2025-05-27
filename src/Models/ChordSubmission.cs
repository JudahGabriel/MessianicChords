using MessianicChords.Models;
using System.Collections.Generic;
using System;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.IO;
using MessianicChords.Services;
using System.Threading.Tasks;

namespace MessianicChords.Api.Models
{
    /// <summary>
    /// A record in the database containing an edited or new chord sheet submitted by a user.
    /// </summary>
    public class ChordSubmission : ChordSheet
    {
        /// <summary>
        /// Gets the ID of the chord sheet that was edited. If this is a new chord sheet submission, this will be null.
        /// </summary>
        public string? EditedChordSheetId { get; set; }

        /// <summary>
        /// The key used for approval or rejection of the submission.
        /// </summary>
        public string? ApproveRejectKey { get; set; }

        /// <summary>
        /// Attachments saved to a temporary location on our CDN.
        /// </summary>
        public List<TempAttachment> SavedAttachments { get; set; } = new List<TempAttachment>();
    }

    /// <summary>
    /// ASP.NET Core model for chord edit submission.
    /// </summary>
    public class ChordSubmissionRequest : ChordSheet
    {
        /// <summary>
        /// Raw attachments uploaded as part of the edit.
        /// </summary>
        [FromForm]
        public List<IFormFile> Attachments { get; set; } = new List<IFormFile>();
    }
}
