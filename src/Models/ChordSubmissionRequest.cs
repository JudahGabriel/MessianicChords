namespace MessianicChords.Models;

using Microsoft.AspNetCore.Mvc;

/// <summary>
/// ASP.NET Core model for chord edit submission.
/// </summary>
public class ChordSubmissionRequest : ChordSheet
{
    /// <summary>
    /// Raw attachments uploaded as part of the edit.
    /// </summary>
    [FromForm]
    public List<IFormFile> AttachmentUploads { get; set; } = [];
}