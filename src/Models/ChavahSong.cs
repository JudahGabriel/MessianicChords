namespace MessianicChords.Models;

/// <summary>
/// A song a represented on Chavah Messianic Radio.
/// </summary>
public class ChavahSong
{
    public List<string> Tags { get; set; } = new List<string>();
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Artist { get; set; } = "";
    public Uri? AlbumArtUri { get; set; }
}