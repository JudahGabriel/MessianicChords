using Raven.Migrations;

namespace MessianicChords.Api.Migrations
{
    /// <summary>
    /// In this migration, we find chord sheets that have a ChavahSongId and push that into the Links of the chord sheet.
    /// </summary>
    [Migration(7)]
    public class ChavahSongIdIncludedInLinks : Migration
    {
        public override void Up()
        {
            this.PatchCollection(@"
                from ChordSheets
                update {
                    if (this.ChavahSongId) {
                        this.Links.push('https://messianicradio.com/?song='+ this.ChavahSongId);
                    }
                }
            ");
        }
    }
}