using Google.Apis.Drive.v3.Data;

namespace MessianicChords.Models
{
    /// <summary>
    /// A thread of comments attached to a chord sheet.
    /// </summary>
    public class CommentThread
    {
        /// <summary>
        /// The ID of the ChordSheet this comment thread is attached to.
        /// </summary>
        required public string ChordSheetId { get; set; }

        /// <summary>
        /// The list of comments in this thread.
        /// </summary>
        public List<Comment> Comments { get; set; } = new List<Comment>();
    }
}
