using MessianicChords.Api.Models;

namespace MessianicChords.Models
{
    public class EditedChordSubmission
    {
        public EditedChordSubmission(ChordSubmission updated, ChordSheet original)
        {
            this.Original = original;
            this.Updated = updated;
        }

        public ChordSubmission Updated { get; set; }
        public ChordSheet Original { get; set; }
    }
}
