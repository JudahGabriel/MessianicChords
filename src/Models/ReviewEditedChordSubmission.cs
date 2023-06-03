using MessianicChords.Api.Models;

namespace MessianicChords.Models
{
    public class ReviewEditedChordSubmission
    {
        public ReviewEditedChordSubmission(ChordSubmission updated, ChordSheet original, string token)
        {
            this.Original = original;
            this.Updated = updated;
            this.Token = token;
        }

        public ChordSubmission Updated { get; set; }
        public ChordSheet Original { get; set; }
        public string Token { get; set; }
    }
}
