namespace MessianicChords.Models;

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
    public List<Attachment> SavedAttachments { get; set; } = [];
}
