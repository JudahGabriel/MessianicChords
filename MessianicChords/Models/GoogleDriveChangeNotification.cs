using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MessianicChords.Models
{
    /// <summary>
    /// A change notification pushed from Google Drive.
    /// </summary>
    /// <remarks>
    /// See https://dzone.com/articles/working-with-the-google-drive-api-track-changes-in
    /// </remarks>
    public class GoogleDriveChangeNotification
    {
        public string? Kind { get; set; }
        public string? Type { get; set; }
        public DateTime Time { get; set; }
        public bool Removed { get; set; }
        public string? FileId { get; set; }
        public GoogleDirveChangedFile? File { get; set; }
    }

    public class GoogleDirveChangedFile
    {
        public string? Kind { get; set; }
        public string? Id { get; set; }
        public string? Name { get; set; }
        public string? MimeType { get; set; }
    }
}
