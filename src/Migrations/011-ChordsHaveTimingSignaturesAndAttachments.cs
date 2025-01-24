using Raven.Migrations;

namespace MessianicChords.Migrations
{
    [Migration(11)]
    public class ChordsHaveTimingSignatures : Migration
    {
        public override void Up()
        {
            this.PatchCollection(@"
                from ChordSheets
                update {
                    this.TimingSignature = null;
                    this.Attachments = [];
                }
            ");
        }
    }
}
