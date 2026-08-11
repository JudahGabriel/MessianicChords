using MessianicChords.Models;

namespace MessianicChords.Tests;

public class ChordSheetTests
{
    [Fact]
    public void UpdateFromCopiesTags()
    {
        var chordSheet = new ChordSheet();
        var editedChordSheet = new ChordSheet
        {
            Tags = ["worship", "upbeat"]
        };

        chordSheet.UpdateFrom(editedChordSheet);

        Assert.Equal(editedChordSheet.Tags, chordSheet.Tags);
    }

    [Fact]
    public void UpdateFromCopiesSubmittedBy()
    {
        var chordSheet = new ChordSheet();
        var editedChordSheet = new ChordSheet
        {
            SubmittedBy = "submitter@example.com"
        };

        chordSheet.UpdateFrom(editedChordSheet);

        Assert.Equal(editedChordSheet.SubmittedBy, chordSheet.SubmittedBy);
    }
}
