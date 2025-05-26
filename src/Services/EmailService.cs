using MessianicChords.Api.Models;
using MessianicChords.Common;
using MessianicChords.Models;
using Microsoft.Extensions.Options;
using Raven.Client.Documents;
using SendGrid.Helpers.Mail;

namespace MessianicChords.Services;

public class EmailService
{
    private readonly AppSettings settings;
    private readonly IWebHostEnvironment host;
    private readonly ILogger<EmailService> logger;
    private readonly IDocumentStore db;

    public EmailService(IOptions<AppSettings> options, IWebHostEnvironment host, IDocumentStore db, ILogger<EmailService> logger)
    {
        this.settings = options.Value;
        this.host = host;
        this.db = db;
        this.logger = logger;
    }

    /// <summary>
    /// Sends an email notifying that a chord sheet has been edited or created and is awaiting approval.
    /// </summary>
    /// <param name="submission"></param>
    /// <param name="original">The original chord sheet being edited. If this is a new chord sheet being submitted, this will be null.</param>
    /// <param name="token">The approval token.</param>
    /// <returns></returns>
    public async Task SendChordSubmissionEmail(ChordSubmission submission, ChordSheet? original, string token)
    {
        var htmlBody = original == null ?
            this.GetNewChordsEmailHtml(submission, token) :
            this.GetUpdatedChordsEmailHtml(submission, token);
        var email = this.CreateEmail("MessianicChords: chord chart edit awaiting your approval", new EmailAddress(settings.UploadedAttachmentEmailRecipient), null, htmlBody);
        await this.SendEmail(email);
    }

    private string GetNewChordsEmailHtml(ChordSubmission submission, string token)
    {
        return "" +
            "<h1>New chords uploaded to MessianicChords</h1>" +
            "<p>" +
            $"<a href='https://messianicchords.com/chordsubmissions/review?id={submission.Id}&token={token}'>Review new chord chart</a>" +
            "</p>";
    }

    private string GetUpdatedChordsEmailHtml(ChordSubmission submission, string token)
    {
        return "" +
            "<h1>Chord chart edited on MessianicChords</h1>" +
            "<p>" +
            $"<a href='https://messianicchords.com/chordsubmissions/review?id={submission.Id}&token={token}'>Review edited chord chart</a>" +
            "</p>";
    }

    private SendGridMessage CreateEmail(string subject, EmailAddress to, string? plainText, string html)
    {
        var email = new SendGridMessage
        {
            Subject = subject,
            From = new EmailAddress(settings.EmailSender, "Messianic Chords"),
            PlainTextContent = plainText,
            HtmlContent = html
        };
        email.AddTo(to);

        return email;
    }

    private async Task SendEmail(SendGridMessage email)
    {
        // Store the email in the database.
        var dbEmail = Email.FromSmtpMessage(email);

        var client = new SendGrid.SendGridClient(settings.SendGridKey);
        try
        {
            var result = await client.SendEmailAsync(email);
            if (result.IsSuccessStatusCode)
            {
                logger.LogInformation("Email sent successfully, status code {statusCode}", result.StatusCode);
                dbEmail.Sent = DateTimeOffset.UtcNow;
            }
            else
            {
                logger.LogError("Email failed to send. Status code {code} was non-successful.", result.StatusCode);
                dbEmail.SendingErrorMessage = $"Email failed to send. Status code {result.StatusCode} was non-successful.";
            }
        }
        catch (Exception error)
        {
            logger.LogError(error, "Email sending failed due to exception.");
            dbEmail.SendingErrorMessage = $"Email failed to send due to exception: {error}";
            throw;
        }
        finally
        {
            await TrySaveDbEmail(dbEmail);
        }
    }

    private async Task TrySaveDbEmail(Email dbEmail)
    {
        try
        {
            var dbSession = db.OpenAsyncSession();
            await dbSession.StoreAsync(dbEmail);
            dbSession.SetRavenExpiration(dbEmail, DateTime.UtcNow.AddDays(120));
            await dbSession.SaveChangesAsync();
        }
        catch (Exception dbException)
        {
            logger.LogError(dbException, "Unable to save email to database due to error.");
        }
    }
}
