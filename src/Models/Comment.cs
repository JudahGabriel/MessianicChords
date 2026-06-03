namespace MessianicChords.Models;

/// <summary>
/// A single comment on a chord sheet.
/// </summary>
public class Comment
{
    /// <summary>
    /// Gets the unique ID of the comment.
    /// </summary>
    public string Id { get; set; } = Guid.NewGuid().ToString("N");

    /// <summary>
    /// Gets the ID of the user that created the comment.
    /// </summary>
    required public string UserId { get; set; }

    /// <summary>
    /// Gets the display name of the user who created the comment.
    /// </summary>
    required public string UserDisplayName { get; set; }

    /// <summary>
    /// Gets the profile picture URL of the user who created the comment.
    /// </summary>
    public Uri? UserProfilePictureUrl { get; set; }

    /// <summary>
    /// Gets the content of the comment.
    /// </summary>
    required public string Content { get; set; }

    /// <summary>
    /// Gets the date when the comment was created.
    /// </summary>
    public DateTimeOffset Created { get; set; }
}
