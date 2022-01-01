using MessianicChords.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SendGrid.Helpers.Mail;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

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

            var client = new SendGrid.SendGridClient(settings.SendGridKey);
            var email = new SendGridMessage
            {
                Subject = "New chords uploaded",
                From = new EmailAddress(settings.EmailSender, "Messianic Chords"),
                PlainTextContent = "Someone uploaded new chord sheets to Messianic Chords. See attached.",
                HtmlContent = "<h1>New Chords available</h1><p>Someone uploaded new chords sheets to Messianic Chords. See attached."
            };
            email.AddTo(new EmailAddress(settings.UploadedAttachmentEmailRecipient));
            foreach (var chordSheet in chordSheets)
            {
                using var attachmentStream = chordSheet.OpenReadStream();
                await email.AddAttachmentAsync(chordSheet.FileName, attachmentStream, chordSheet.ContentType);
            }
            await client.SendEmailAsync(email);
        }
    }
}
