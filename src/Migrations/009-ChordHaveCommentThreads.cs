using Raven.Migrations;

namespace MessianicChords.Migrations
{
    [Migration(9)]
    public class ChordsHaveComments : Migration
    {
        public override void Up()
        {
            this.PatchCollection(@"
                from ChordSheets
                update {
                    this.CommentCount = 0;
                }
            ");
        }
    }
}
