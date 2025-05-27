using MessianicChords.Models;
using MessianicChords.Common;
using Raven.Client.Documents.Session;
using Raven.Client.Documents;

namespace MessianicChords.Services;

/// <summary>
/// Performs creation, approvals, andrejections of chord sheet submissions.
/// </summary>
public class ChordSubmissionService
{
    private readonly ILogger<ChordSubmissionService> logger;
    private readonly IAsyncDocumentSession dbSession;
    private readonly BunnyCdnManagerService cdnService;
    private readonly EmailService emailService;

    public ChordSubmissionService(
        IAsyncDocumentSession dbSession,
        BunnyCdnManagerService cdnService,
        EmailService emailService,
        ILogger<ChordSubmissionService> logger)
    {
        this.dbSession = dbSession;
        this.cdnService = cdnService;
        this.emailService = emailService;
        this.logger = logger;
    }

    /// <summary>
    /// Creates a new chord submission, uploading any attachments to the CDN for later review.
    /// </summary>
    /// <param name="request">The submission request.</param>
    /// <returns>A new ChordSubmission saved to the database.</returns>
    public async Task<ChordSubmission> Create(ChordSubmissionRequest request)
    {
        try
        {
            return await CreateCore(request);
        }
        catch (Exception error)
        {
            logger.LogError(error, "Unable to create chord submission due to error.");
            throw;
        }            
    }

    /// <summary>
    /// Gets all chord submissiones.
    /// </summary>
    /// <param name="skip"></param>
    /// <param name="take"></param>
    /// <returns></returns>
    public Task<List<ChordSubmission>> GetAll(int skip, int take)
    {
        return dbSession.Query<ChordSubmission>()
            .OrderByDescending(a => a.Created)
            .Take(take)
            .ToListAsync();
    }

    private async Task<ChordSubmission> CreateCore(ChordSubmissionRequest request)
    {
        // We can't have more than 10 attachments.
        if (request.AttachmentUploads.Count > 10)
        {
            var tooManyAttachmentsError = new ArgumentException("Too many attachments");
            tooManyAttachmentsError.Data.Add("attachmentCount", request.AttachmentUploads.Count);
            throw tooManyAttachmentsError;
        }

        // No attachment can be > 10MB
        var tooLargeAttachment = request.AttachmentUploads.FirstOrDefault(a => a.Length > 10_000_000);
        if (tooLargeAttachment != null)
        {
            var tooLargeError = new ArgumentException("Attachment is too large");
            tooLargeError.Data.Add("attachmentName", tooLargeAttachment.Name);
            tooLargeError.Data.Add("attachmentSize", tooLargeAttachment.Length);
            throw tooLargeError;
        }

        // If the submission is editing an existing chord sheet, it must be a real chord sheet ID.
        if (!string.IsNullOrWhiteSpace(request.Id) && !request.Id.StartsWith("ChordSheets/", StringComparison.OrdinalIgnoreCase))
        {
            var badChordIdError = new ArgumentException("Chord sheet ID is malformed");
            badChordIdError.Data.Add("chordId", request.Id);
            throw badChordIdError;
        }

        // Store the submission
        var submission = new ChordSubmission();
        submission.UpdateFrom(request);
        submission.Id = null;
        submission.EditedChordSheetId = request.Id;
        submission.SavedAttachments = await this.UploadTempAttachments(request);
        await dbSession.StoreAsync(submission);

        // Store an approval/rejection token.
        var token = Guid.NewGuid().ToString();
        var approvalToken = new ApprovalToken { Token = token.ToString(), Id = $"ApprovalTokens/{token}" };
        await dbSession.StoreAsync(approvalToken);
        dbSession.SetRavenExpiration(approvalToken, DateTime.Now.AddDays(30));

        var existingChordSheet = string.IsNullOrWhiteSpace(request.Id) ? null : await dbSession.LoadRequiredAsync<ChordSheet>(request.Id!);

        await dbSession.SaveChangesAsync();

        // Send off an email to admins.
        await emailService.SendChordSubmissionEmail(submission, existingChordSheet, approvalToken.Token);

        return submission;
    }

    /// <summary>
    /// Rejects or approves the chord submission.
    /// </summary>
    /// <param name="decision">The rejection or approval decision and related details.</param>
    /// <param name="token">The approval token.</param>
    /// <returns></returns>
    public async Task ApproveOrReject(ChordSubmissionApproval decision, string token)
    {
        try
        {
            await this.ApproveOrRejectCore(decision, token);
        }
        catch (Exception error)
        {
            logger.LogError(error, "Unable to approve/deny chord submission {id} due to error. Submission details: {details}. Token: {token}", decision.SubmissionId, decision, token);
            throw;
        }
    }

    private async Task ApproveOrRejectCore(ChordSubmissionApproval decision, string token)
    {
        if (!decision.SubmissionId.StartsWith("ChordSubmissions/", StringComparison.OrdinalIgnoreCase))
        {
            var badChordSubmissionIdError = new ArgumentException("Invalid chord submission ID");
            badChordSubmissionIdError.Data.Add("chordSubmissionId", decision.SubmissionId);
            throw badChordSubmissionIdError;
        }

        var submission = await dbSession.LoadAsync<ChordSubmission>(decision.SubmissionId);
        if (submission == null)
        {
            var submissionNotFoundError = new ArgumentException("Chord submission was not found.");
            submissionNotFoundError.Data.Add("chordSubmissionId", decision.SubmissionId);
            throw submissionNotFoundError;
        }

        var approvalToken = await dbSession.LoadOptionalAsync<ApprovalToken>($"ApprovalTokens/{token}");
        if (approvalToken == null)
        {
            var tokenInvalid = new ArgumentOutOfRangeException(nameof(token), "Couldn't find approval token with that value. The token may be expired or invalid.");
            tokenInvalid.Data.Add("token", token);
            throw tokenInvalid;
        }

        // Is this a new chord?
        var isNew = string.IsNullOrWhiteSpace(submission.EditedChordSheetId);
        var chordSheet = isNew ? new ChordSheet() : await dbSession.LoadAsync<ChordSheet>(submission.EditedChordSheetId);
        if (chordSheet == null)
        {
            var chordNotFoundError = new ArgumentException("Chord sheet was not found.");
            chordNotFoundError.Data.Add("chordId", submission.EditedChordSheetId);
            throw chordNotFoundError;
        }

        if (decision.Approved)
        {
            await this.Approve(decision, submission, chordSheet, approvalToken);
        }
        else
        {
            await this.Reject(submission, approvalToken);
        }
    }

    /// <summary>
    /// Approves the submission: applies the proposed changes in the submission to the target chord sheet. The submission will then be deleted.
    /// </summary>
    /// <param name="dbSession"></param>
    /// <returns></returns>
    private async Task Approve(ChordSubmissionApproval approval, ChordSubmission submission, ChordSheet chordSheet, ApprovalToken token)
    {
        // Fill the submission with data from the approval.
        // Then copy the submission to the real chord sheet.
        submission.Address = approval.GoogleDocAddress?.ToString() ?? chordSheet.Address;
        submission.GoogleDocId = approval.GoogleDocId ?? chordSheet.GoogleDocId;
        submission.PublishUri = approval.GoogleDocPublishUri ?? chordSheet.PublishUri;
        submission.Extension = approval.GoogleDocExtension ?? chordSheet.Extension ?? "mc";
        Uri.TryCreate(string.IsNullOrWhiteSpace(submission.ChavahSongId) ? string.Empty : "https://messianicradio.com?song=" + submission.ChavahSongId, UriKind.Absolute, out var chavahUri);
        var allLinks = chordSheet.Links
            .Concat(submission.Links)
            .Concat(new[] // Also include the GoogleDocAddress and GoogleDoc publish URI
                {
                    approval.GoogleDocAddress,
                    approval.GoogleDocPublishUri,
                    chavahUri
                }
                .Where(l => l != null) // ...if they're not null
                .Select(l => l!)
            )
            .Distinct() // Remove dupes
            .ToList();
        submission.Links = allLinks;
        chordSheet.UpdateFrom(submission);
        chordSheet.LastUpdated = DateTime.UtcNow;
        chordSheet.Attachments.AddRange(submission.SavedAttachments);

        // Is it a new chord sheet (rather than edit of existing one?) If so, we'll need to store it in the database first.
        var isNew = string.IsNullOrWhiteSpace(chordSheet.Id);
        if (isNew)
        {
            await dbSession.StoreAsync(chordSheet);
        }

        // Delete the submission, as its changes have been applied.
        dbSession.Delete(submission);
        dbSession.Delete(token);
        await dbSession.SaveChangesAsync(); // Save changes now before we delete the files from CDN
        await this.TryDeleteTempAttachments(submission);
    }

    /// <summary>
    /// Rejects the submission: deletes the submission and makes no changes to the target chord sheet.
    /// </summary>
    /// <param name="dbSession"></param>
    /// <returns></returns>
    private async Task Reject(ChordSubmission submission, ApprovalToken token)
    {
        dbSession.Delete(submission);
        dbSession.Delete(token);
        await dbSession.SaveChangesAsync();
        await TryDeleteTempAttachments(submission);
    }

    private async Task TryDeleteTempAttachments(ChordSubmission submission)
    {
        // Did we have any temp attachments on the CDN? Clear those out.
        foreach (var attachment in submission.SavedAttachments)
        {
            try
            {
                await cdnService.DeleteTempAttachment(attachment.CdnFileName);
            }
            catch (Exception error)
            {
                logger.LogWarning(error, "Unable to delete temp attachment {fileName} from the CDN {url}. This file should be manually deleted.", attachment.CdnFileName, attachment.CdnUri);
            }
        }
    }

    private async Task<List<Attachment>> UploadTempAttachments(ChordSubmissionRequest request)
    {
        // Save the attachments to a temp location.
        var savedAttachments = new List<Attachment>(request.AttachmentUploads.Count);
        foreach (var attachment in request.AttachmentUploads)
        {
            var cdnFileName = Guid.NewGuid() + Path.GetExtension(attachment.FileName ?? ".unknown");
            using var attachmentStream = attachment.OpenReadStream();
            var attachmentUri = await cdnService.UploadTempAttachment(attachmentStream, cdnFileName);
            var untrustedFileName = string.IsNullOrWhiteSpace(attachment.FileName) ? "unknown-file-name.unknown" : attachment.FileName;
            var tempAttachment = new Attachment(cdnFileName, untrustedFileName, attachmentUri);
            savedAttachments.Add(tempAttachment);
        }

        return savedAttachments;
    }
}
