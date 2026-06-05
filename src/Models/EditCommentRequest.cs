namespace MessianicChords.Models;

public class EditCommentRequest
{
    public string ChordSheetId { get; set; } = string.Empty;
    public string CommentId { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
}