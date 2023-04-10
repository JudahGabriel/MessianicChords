using Raven.Migrations;

namespace MessianicChords.Api.Migrations
{
    /// <summary>
    /// In this migration, we add a CCLI field to ChordSheet.
    /// </summary>
    [Migration(8)]
    public class ChordSheetsHaveCCLI : Migration
    {
        public override void Up()
        {
            this.PatchCollection(@"
                from ChordSheets
                update {
                    var existingCcli = null;
                    if (this.Copyright) {
                        var ccliRegExp = new RegExp(/CCLI#?\s(\d+)/g);
                        var ccliMatch = ccliRegExp.exec(this.Copyright);
                        var extractedCcli = ccliMatch && ccliMatch.length === 2 ? ccliMatch[1] : null;
                        if (!isNaN(parseFloat(extractedCcli))) {
                            existingCcli = extractedCcli;
                        }
                    }
                    this.CcliNumber = existingCcli;
                }
            ");
        }
    }
}