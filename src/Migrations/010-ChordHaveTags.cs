using Raven.Migrations;

namespace MessianicChords.Migrations
{
    [Migration(10)]
    public class ChordsHaveTags : Migration
    {
        public override void Up()
        {
            this.PatchCollection(@"
                from ChordSheets
                update {
                    this.Tags = [];
                }
            ");
        }
    }
}
