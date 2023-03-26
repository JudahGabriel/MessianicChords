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
                await this.GetNewChordsEmailHtml(submission, token) :
                await this.GetUpdatedChordsEmailHtml(submission, original, token);
            var email = this.CreateEmail("MessianicChords: chord chart edit awaiting your approval", new EmailAddress(settings.UploadedAttachmentEmailRecipient), null, htmlBody);
            await this.SendEmail(email);
        }

        private async Task<string> GetNewChordsEmailHtml(ChordSubmission submission, string token)
        {
            var templateFilePath = System.IO.Path.Combine(this.host.WebRootPath, "assets\\templates\\new-chord-sheet.html");
            var templateHtml = await System.IO.File.ReadAllTextAsync(templateFilePath);
            return templateHtml
                .Replace("{{title}}", submission.Song)
                .Replace("{{hebrewTitle}}", submission.HebrewSongName ?? string.Empty)
                .Replace("{{artist}}", submission.Artist)
                .Replace("{{authors}}", string.Join(", ", submission.Authors))
                .Replace("{{chords}}", submission.Chords ?? string.Empty)
                .Replace("{{attachmentNames}}", string.Join(", ", submission.SavedAttachments.Select(a => a.ToHtmlLink())))
                .Replace("{{links}}", string.Join(", ", submission.Links.Select(l => UriToAnchor(l))))
                .Replace("{{key}}", submission.Key ?? string.Empty)
                .Replace("{{capo}}", submission.Capo?.ToString() ?? string.Empty)
                .Replace("{{scripture}}", submission.Scripture ?? string.Empty)
                .Replace("{{ccli}}", submission.CcliNumber?.ToString() ?? string.Empty)
                .Replace("{{copyright}}", submission.Copyright?.ToString() ?? string.Empty)
                .Replace("{{year}}", submission.Year?.ToString() ?? string.Empty)
                .Replace("{{sheetMusic}}", submission.IsSheetMusic ? "✔" : "❌")
                .Replace("{{about}}", submission.About ?? string.Empty)
                .Replace("{{approveLink}}", CreateApproveRejectLink(submission, true, token))
                .Replace("{{rejectLink}}", CreateApproveRejectLink(submission, false, token));
        }

        private async Task<string> GetUpdatedChordsEmailHtml(ChordSubmission submission, ChordSheet original, string token)
        {
            var templateFilePath = System.IO.Path.Combine(this.host.WebRootPath, "assets\\templates\\updated-chord-sheet.html");
            var templateHtml = await System.IO.File.ReadAllTextAsync(templateFilePath);
            var unchangedClasses = new (bool unchanged, string templatePart)[]
            {
                (submission.Song == original.Song, "{{titleClass}}"),
                (submission.HebrewSongName == original.HebrewSongName, "{{hebrewTitleClass}}"),
                (submission.Artist == original.Artist, "{{artistClass}}"),
                (submission.Authors.SequenceEqual(original.Authors), "{{authorsClass}}"),
                (submission.Chords == original.Chords, "{{chordsClass}}"),
                (submission.SavedAttachments.Count == 0, "{{attachmentsClass}}"),
                (submission.Links.SequenceEqual(original.Links), "{{linksClass}}"),
                (submission.Key == original.Key, "{{keyClass}}"),
                (submission.Capo == original.Capo, "{{capoClass}}"),
                (submission.Scripture == original.Scripture, "{{scriptureClass}}"),
                (submission.Copyright == original.Copyright, "{{copyrightClass}}"),
                (submission.CcliNumber == original.CcliNumber, "{{ccliClass}}"),
                (submission.Year == original.Year, "{{yearClass}}"),
                (submission.IsSheetMusic == original.IsSheetMusic, "{{sheetMusicClass}}"),
                (submission.About == original.About, "{{aboutClass}}")
            }
            .Where(t => t.unchanged == true)
            .Select(t => t.templatePart);

            foreach (var part in unchangedClasses)
            {
                templateHtml = templateHtml.Replace(part, "d-none");
            }

            return templateHtml
                .Replace("{{id}}", submission.EditedChordSheetId)
                .Replace("{{titleNew}}", submission.Song)
                .Replace("{{titleOld}}", original.Song)
                .Replace("{{hebrewTitleNew}}", submission.HebrewSongName ?? string.Empty)
                .Replace("{{hebrewTitleOld}}", original.HebrewSongName ?? string.Empty)
                .Replace("{{artistNew}}", submission.Artist)
                .Replace("{{artistOld}}", original.Artist)
                .Replace("{{authorsNew}}", string.Join("<br>", submission.Authors))
                .Replace("{{authorsOld}}", string.Join("<br>", original.Authors))
                .Replace("{{chordsNew}}", submission.Chords ?? string.Empty)
                .Replace("{{chordsOld}}", original.Chords ?? string.Empty)
                .Replace("{{attachmentNamesNew}}", string.Join(", ", submission.SavedAttachments.Select(a => a.ToHtmlLink())))
                .Replace("{{linksNew}}", string.Join("<br>", submission.Links.Select(l => UriToAnchor(l))))
                .Replace("{{linksOld}}", string.Join("<br>", original.Links.Select(l => UriToAnchor(l))))
                .Replace("{{keyNew}}", submission.Key ?? string.Empty)
                .Replace("{{keyOld}}", original.Key ?? string.Empty)
                .Replace("{{capoNew}}", submission.Capo?.ToString() ?? string.Empty)
                .Replace("{{capoOld}}", original.Capo?.ToString() ?? string.Empty)
                .Replace("{{scriptureNew}}", submission.Scripture ?? string.Empty)
                .Replace("{{scriptureOld}}", original.Scripture ?? string.Empty)
                .Replace("{{copyrightNew}}", submission.Copyright ?? string.Empty)
                .Replace("{{copyrightOld}}", original.Copyright ?? string.Empty)
                .Replace("{{ccliNew}}", submission.CcliNumber?.ToString() ?? string.Empty)
                .Replace("{{ccliOld}}", original.CcliNumber?.ToString() ?? string.Empty)
                .Replace("{{yearNew}}", submission.Year?.ToString() ?? string.Empty)
                .Replace("{{yearOld}}", original.Year?.ToString() ?? string.Empty)
                .Replace("{{sheetMusicNew}}", submission.IsSheetMusic ? "✔" : "❌")
                .Replace("{{sheetMusicOld}}", original.IsSheetMusic ? "✔" : "❌")
                .Replace("{{aboutNew}}", submission.About ?? string.Empty)
                .Replace("{{aboutOld}}", original.About ?? string.Empty)
                .Replace("{{approveLink}}", CreateApproveRejectLink(submission, true, token))
                .Replace("{{rejectLink}}", CreateApproveRejectLink(submission, false, token));
        }

        private static string UriToAnchor(Uri attachment)
        {
            return $"<a href='{attachment}'>{attachment}</a>";
        }

        private static string CreateApproveRejectLink(ChordSubmission submission, bool approved, string token)
        {
            return $"https://api.messianicchords.com/chords/ApproveRejectSubmission?submissionId={Uri.EscapeDataString(submission.Id ?? string.Empty)}&approved={approved}&token={token}";
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
