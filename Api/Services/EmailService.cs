using MessianicChords.Api.Models;
using MessianicChords.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
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
        private readonly ILogger<EmailService> logger;

        public EmailService(IOptions<AppSettings> options, ILogger<EmailService> logger)
        {
            this.settings = options.Value;
            this.logger = logger;
        }

        public async Task SendEmailWithUploadedChords(List<IFormFile> chordSheets)
        {
            // No more than 3 MB total
            var maxAttachmentTotalSize = 3000000;
            var totalSize = chordSheets.Sum(c => c.Length);
            if (totalSize > maxAttachmentTotalSize)
            {
                logger.LogError("User uploaded {count} attachments totalling {size} in size. This is beyond the max limit of {limit}, so we're rejecting it.", chordSheets.Count(), totalSize, maxAttachmentTotalSize);
                throw new ArgumentException("Attachments too large");
            }

            var plainText = "Someone uploaded new chord sheets to Messianic Chords. See attached.";
            var html = "<h1>New Chords available</h1><p>Someone uploaded new chords sheets to Messianic Chords. See attached.";
            var email = this.CreateEmail("New chords uploaded", new EmailAddress(settings.UploadedAttachmentEmailRecipient), plainText, html);
            foreach (var chordSheet in chordSheets)
            {
                using var attachmentStream = chordSheet.OpenReadStream();
                await email.AddAttachmentAsync(chordSheet.FileName, attachmentStream, chordSheet.ContentType);
            }
            await this.SendEmail(email);
        }

        /// <summary>
        /// Sends an email notifying that a chord sheet has been edited or created and is awaiting approval.
        /// </summary>
        /// <param name="submission"></param>
        /// <param name="token">The approval token.</param>
        /// <returns></returns>
        public async Task SendChordSubmissionEmail(ChordSubmission submission, string token)
        {
            var isNew = submission.EditedChordSheetId == null;
            var chordChartLabel = $"{submission.Artist ?? string.Join(", ", submission.Authors)} - {submission.Song}";
            var submissionDescription = isNew ?
                $"A new chord chart for {chordChartLabel} has been submitted." :
                $"The chord chart for {chordChartLabel} has been edited.";
            var chordChart = $"<pre>{submission.Chords ?? "[empty]"}</pre>";
            var createApproveRejectLink = new Func<bool, string>(approved => $"https://api.messianicchords.com/chords/ApproveRejectSubmission?submissionId={Uri.EscapeDataString(submission.Id ?? string.Empty)}&approved={approved}&token={token}");
            var htmlBody = $"<p>{submissionDescription}</p><p>{chordChart}</p><a href='{createApproveRejectLink(true)}'>Approve</a> or <a href='{createApproveRejectLink(false)}'>Reject</a>.";
            var email = this.CreateEmail("MessianicChords: chord chart edit awaiting your approval", new EmailAddress(settings.UploadedAttachmentEmailRecipient), null, htmlBody);
            await this.SendEmail(email);
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

        private Task SendEmail(SendGridMessage email)
        {
            var client = new SendGrid.SendGridClient(settings.SendGridKey);
            return client.SendEmailAsync(email);
        }
    }
}
