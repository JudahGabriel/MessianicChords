using MessianicChords.Migrations;
using MessianicChords.Models;
using MessianicChords.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.ViewEngines;
using Raven.Client.Documents.Session;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace MessianicChords.Api.Models
{
    /// <summary>
    /// Request model for approval or rejection of a chord submission approval.
    /// </summary>
    public class ChordSubmissionApproval
    {
        [Required]
        public string SubmissionId { get; set; } = string.Empty;

        /// <summary>
        /// Whether the submission is approved or rejected.
        /// </summary>
        [Required]
        public bool Approved { get; set; }

        /// <summary>
        /// The ID of the Google Doc if the chord submission generated a document in Google Drive.
        /// </summary>
        public string? GoogleDocId { get; set; }

        /// <summary>
        /// The URI of the Google Doc if the chord submission generated a document in Google Drive.
        /// </summary>
        public Uri? GoogleDocAddress { get; set; }

        /// <summary>
        /// The URI of the published-to-web Google Doc if the chord submission generated a document in Google Drive.
        /// </summary>
        public Uri? GoogleDocPublishUri { get; set; }

        /// <summary>
        /// The file extension of the file if the chord submission generated a document in Google Drive. Example: "docx"
        /// </summary>
        public string? GoogleDocExtension { get; set; }
    }
}
