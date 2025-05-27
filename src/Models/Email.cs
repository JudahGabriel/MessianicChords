using SendGrid.Helpers.Mail;
using System.Net.Mail;

namespace MessianicChords.Models;

/// <summary>
/// An outgoing email. Stored in the database to be sent at a later time.
/// </summary>
public class Email
{
    public static Email FromSmtpMessage(SendGridMessage smtpEmail)
    {
        return new Email
        {
            Body = smtpEmail.HtmlContent,
            Bcc = string.Join("; ", smtpEmail.Personalizations.SelectMany(p => (p.Bccs ?? []).Select(cc => cc.Email))),
            CC = string.Join("; ", smtpEmail.Personalizations.SelectMany(p => (p.Ccs ?? []).Select(cc => cc.Email))),
            ReplyTo = smtpEmail.From?.ToString(),
            Created = DateTimeOffset.UtcNow,
            Subject = smtpEmail.Subject,
            To = string.Join("; ", smtpEmail.Personalizations.SelectMany(p => (p.Tos ?? []).Select(cc => cc.Email))),
        };
    }

    public string? Id { get; set; }
    public string To { get; set; } = string.Empty;
    public string? ReplyTo { get; set; }
    public string? CC { get; set; }
    public string? Bcc { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;

    /// <summary>
    /// The date the email was successfully sent.
    /// </summary>
    public DateTimeOffset? Sent { get; set; }

    /// <summary>
    /// When the email was created.
    /// </summary>
    public DateTimeOffset Created { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>
    /// The last error message that occurred when sending the email.
    /// </summary>
    public string? SendingErrorMessage { get; set; }

    /// <summary>
    /// The date the email was attempted to be sent again after a previous failure to send.
    /// </summary>
    public DateTimeOffset? LastRetryDate { get; set; }

    /// <summary>
    /// The number of times the email has been retried.
    /// </summary>
    public int RetryCount { get; set; }
}
