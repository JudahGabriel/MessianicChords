namespace MessianicChords.Models;

/// <summary>
/// A pending chord submission paired with its original chord sheet (if it's an edit).
/// </summary>
public class PendingChordSubmission
{
    public PendingChordSubmission(ChordSubmission submission, ChordSheet? original)
    {
        Submission = submission;
        Original = original;
    }

    /// <summary>
    /// The submitted chord chart changes.
    /// </summary>
    public ChordSubmission Submission { get; set; }

    /// <summary>
    /// The original chord sheet being edited. Null if this is a new chord chart submission.
    /// </summary>
    public ChordSheet? Original { get; set; }
}
