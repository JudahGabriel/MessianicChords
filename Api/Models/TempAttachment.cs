using System;

namespace MessianicChords.Api.Models
{
    /// <summary>
    /// A temporary attachment stored on the CDN.
    /// </summary>
    /// <param name="CdnFileName">The actual file name stored on the CDN, e.g. "foo.docx"</param>
    /// <param name="UntrustedUserFileName">The user-supplied file name of the attachment. This should be considered untrusted.</param>
    /// <param name="CdnUri">The full URI to the file on the CDN.</param>
    public record TempAttachment(string CdnFileName, string UntrustedUserFileName, Uri CdnUri)
    {
    }
}
