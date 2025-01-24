﻿namespace MessianicChords.Models;

public class ChordSheetMetadata
{
    public string GoogleDocId { get; set; } = string.Empty;
    public string ResourceKey { get; set; } = string.Empty;
    public DateTime LastModified { get; set; }
}