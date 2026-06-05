namespace MessianicChords.Models;

public class AddCommentRequest
{
    public string ChordSheetId { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
}