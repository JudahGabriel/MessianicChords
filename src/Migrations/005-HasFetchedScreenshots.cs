using Raven.Migrations;

namespace MessianicChords.Api.Migrations
{
    [Migration(5)]
    public class HasFetchedScreenshots : Migration
    {
        public override void Up()
        {
            this.PatchCollection(@"
                from ChordSheets
                update {
                    this.HasFetchedScreenshots = !!this.Screenshots && this.Screenshots.length > 0;
                }
            ");
        }
    }
}
