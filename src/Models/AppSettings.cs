namespace MessianicChords.Models;

public class AppSettings
{
    public string GDriveApiKey { get; set; } = string.Empty;
    public string GDriveFolderId { get; set; } = string.Empty;
    public string GDriveFolderResourceKey { get; set; } = string.Empty;
    public string GoogleUserName { get; set; } = string.Empty;
    public string GoogleClientId { get; set; } = string.Empty;
    public string GoogleClientSecret { get; set; } = string.Empty;
    public string SendGridKey { get; set; } = string.Empty;
    public string UploadedAttachmentEmailRecipient { get; set; } = string.Empty;
    public string EmailSender { get; set; } = string.Empty;
    public string BunnyCdnApiKey { get; set; } = string.Empty;
}
