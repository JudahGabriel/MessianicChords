namespace MessianicChords.Models;

/// <summary>
/// An attachment stored on MessianicChords CDN.
/// </summary>
/// <param name="CdnFileName">The actual file name stored on the CDN, e.g. "ab585222-d91a-43d9.docx"</param>
/// <param name="UntrustedUserFileName">The user-supplied file name of the attachment. This should be considered untrusted.</param>
/// <param name="CdnUri">The full URI to the file on the CDN.</param>
public record Attachment(string CdnFileName, string UntrustedUserFileName, Uri CdnUri)
{
    public string ToHtmlLink()
    {
        return $"<a href='{CdnUri}'>{GetHtmlLinkLabelFromUntrusted()}</a>";
    }

    public string GetHtmlLinkLabelFromUntrusted()
    {
        var baseName = string.IsNullOrWhiteSpace(UntrustedUserFileName) ? CdnFileName : UntrustedUserFileName;
        var safeName = new string(UntrustedUserFileName
            .Select(c => (char.IsLetterOrDigit(c) || c == '.') ? c : '_')
            .ToArray());

        return safeName;
    }
}
