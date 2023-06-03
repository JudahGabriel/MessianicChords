using MessianicChords.Api.Models;
using MessianicChords.Models;
using Microsoft.AspNetCore.Components.Forms;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json.Linq;
using Raven.Client.Documents.Operations.OngoingTasks;
using SendGrid.Helpers.Mail;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using static System.Net.WebRequestMethods;

namespace MessianicChords.Services
{
    public class EmailService
    {
        private readonly AppSettings settings;
        private readonly IWebHostEnvironment host;
        private readonly ILogger<EmailService> logger;

        public EmailService(IOptions<AppSettings> options, IWebHostEnvironment host, ILogger<EmailService> logger)
        {
            this.settings = options.Value;
            this.host = host;
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
            var client = new SendGrid.SendGridClient(settings.SendGridKey);
            try
            {
                var result = await client.SendEmailAsync(email);
                if (result.IsSuccessStatusCode)
                {
                    logger.LogInformation("Email sent successfully, status code {statusCode}", result.StatusCode);
                }
                else
                {
                    logger.LogError("Email failed to send. Status code {code} was non-successful.", result.StatusCode);
                }
            }
            catch (Exception error)
            {
                logger.LogError(error, "Email sending failed due to exception.", error);
                throw;
            }
        }
    }
}
