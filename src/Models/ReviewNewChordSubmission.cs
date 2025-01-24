namespace MessianicChords.Models;

public class ReviewNewChordSubmission
{
    public ReviewNewChordSubmission(ChordSubmission newChordChart, string token)
    {
        this.NewChordChart = newChordChart;
        this.Token = token;
    }

    public ChordSubmission NewChordChart { get; set; }
    public string Token { get; set; }
}
