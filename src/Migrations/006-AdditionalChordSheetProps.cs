using Raven.Migrations;

namespace MessianicChords.Api.Migrations
{
    /// <summary>
    /// In this migration, we add a bunch of new properties to ChordSheet as we build out support for chords outside of Google Docs.
    /// </summary>
    [Migration(6)]
    public class AdditionalChordSheetProps : Migration
    {
        public override void Up()
        {
            this.PatchCollection(@"
                from ChordSheets
                update {
                    this.Links = [];
                    this.Authors = [];
                    this.Copyright = null;
                    this.IsSheetMusic = this.Song && this.Song.indexOf('sheet music') !== -1;
                    this.Capo = null;
                    this.About = null;
                    this.Year = null;
                    this.Scripture = null;
                    this.Chords = null;
                    delete this.Etag;

                    if (this.PublishUri) {
                        this.Links.push(this.PublishUri);
                    }
                    if (this.Address) {
                        this.Links.push(this.Address);
                    }
                }
            ");
        }
    }
}
