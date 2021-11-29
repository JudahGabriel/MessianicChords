namespace MessianicChords.Api.Models
{
    /// <summary>
    /// A song loaded from Chavah Messianic Radio.
    /// </summary>
    public class ChavahSong
    {
        public string Id { get; set; } = string.Empty;
        // Omitted other fields: we don't need them for now. If we do in the future, we can add them here.
    }
}
