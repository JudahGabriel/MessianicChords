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

    public Task SendWelcomeEmailAsync(string to)
    {
        var htmlBody = "<h1>Welcome to MessianicChords!</h1>" + 
            "<p>Thank you for signing up for an account on MessianicChords. You can now edit chord charts, add charts to your favorites, and more.</p>" +
            "<p><a href='https://messianicchords.com'>MessianicChords</a></p>";
        var email = this.CreateEmail("Welcome to MessianicChords", new EmailAddress(to), null, htmlBody);
        return this.SendEmail(email);
    }

    public Task SendResetPassword(string email, string token)
    {
        var htmlBody = "<h1>MessianicChords: Reset your password</h1>" +
            "<p>Click the link below to reset your password. This link will expire in 24 hours.</p>" +
            $"<p><a href='https://messianicchords.com/resetpassword?email={email}&token={token}'>Reset password</a></p>";
        var emailMessage = this.CreateEmail("MessianicChords: Reset your password", new EmailAddress(email), null, htmlBody);
        return this.SendEmail(emailMessage);
    }

    public Task SendSupportEmailAsync(SupportMessage message)
    {
        var htmlBody = "<h1>MessianicChords: New support message from " + message.Name + "</h1>" +
            "<p><strong>Email:</strong> " + message.Email + "</p>" +
            "<p><strong>User agent:</strong> " + message.UserAgent + "</p>" +
            "<p><strong>Message:</strong><br/>" + message.Message + "</p>";
        var email = this.CreateEmail("MessianicChords: New support message from " + message.Name, new EmailAddress(this.settings.EmailSender), null, htmlBody);
        email.ReplyTo = new EmailAddress(message.Email);
        return this.SendEmail(email);
    }

    public Task SendConfirmEmailAsync(string destinationAddress, string token, AppSettings appOptions)
    {
        var encodedEmail = Uri.EscapeDataString(destinationAddress);
        var encodedToken = Uri.EscapeDataString(token);
        var body = "<h1>MessianicChords: Confirm your email</h1>" +
            "<p>Thanks for registering on MessianicChords! Click the link below to confirm your email address. This link will expire in 24 hours.</p>" +
            $"<p><a href='https://messianicchords.com/confirmemail?email={encodedEmail}&token={encodedToken}'>Confirm email</a></p>";
        var email = this.CreateEmail("MessianicChords: Confirm your email", new EmailAddress(destinationAddress), null, body);
        return this.SendEmail(email);
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
