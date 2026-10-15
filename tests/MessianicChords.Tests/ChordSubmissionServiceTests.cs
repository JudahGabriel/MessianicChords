using System.Reflection;
using MessianicChords.Models;
using MessianicChords.Services;
using Microsoft.Extensions.Logging.Abstractions;
using Raven.Client.Documents.Session;

namespace MessianicChords.Tests;

public class ChordSubmissionServiceTests
{
    [Theory]
    [InlineData(true, false)]
    [InlineData(false, false)]
    [InlineData(true, true)]
    [InlineData(false, true)]
    public async Task ApprovalHonorsRemovedLinks(bool byAdmin, bool removeAll)
    {
        var kept = new Uri("https://example.com/kept");
        var removed = new Uri("https://example.com/removed");
        var original = new ChordSheet { Id = "ChordSheets/1", Links = [kept, removed] };
        var submittedLinks = removeAll ? new List<Uri>() : [kept];

        var approved = await Approve(original, submittedLinks, new ChordSubmissionApproval(), byAdmin);

        Assert.Equal(submittedLinks, approved.Links);
        Assert.DoesNotContain(removed, approved.Links);
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task ApprovalUsesReplacementLinks(bool byAdmin)
    {
        var original = new ChordSheet
        {
            Id = "ChordSheets/1",
            Links = [new Uri("https://example.com/old")]
        };
        List<Uri> submittedLinks = [new Uri("https://example.com/new")];

        var approved = await Approve(original, submittedLinks, new ChordSubmissionApproval(), byAdmin);

        Assert.Equal(submittedLinks, approved.Links);
    }

    [Theory]
    [InlineData(true, false)]
    [InlineData(false, false)]
    [InlineData(true, true)]
    [InlineData(false, true)]
    public async Task ApprovalAddsGoogleDocLinksWithoutDuplicates(bool byAdmin, bool isNew)
    {
        var doc = new Uri("https://docs.google.com/document/d/example/edit");
        var publishedDoc = new Uri("https://docs.google.com/document/d/example/pub");
        var media = new Uri("https://example.com/media");
        var original = isNew ? null : new ChordSheet
        {
            Id = "ChordSheets/1",
            Links = [new Uri("https://example.com/removed")]
        };
        var approval = new ChordSubmissionApproval
        {
            GoogleDocAddress = doc,
            GoogleDocPublishUri = publishedDoc
        };

        var approved = await Approve(original, [media, doc, media], approval, byAdmin);

        Assert.Equal(new[] { media, doc, publishedDoc }, approved.Links);
    }

    private static async Task<ChordSheet> Approve(
        ChordSheet? original, List<Uri> links, ChordSubmissionApproval approval, bool byAdmin)
    {
        var submission = new ChordSubmission
        {
            Id = "ChordSubmissions/1",
            EditedChordSheetId = original?.Id,
            ApproveRejectKey = "test-token",
            Links = links
        };
        var session = DispatchProxy.Create<IAsyncDocumentSession, ApprovalSession>();
        var state = (ApprovalSession)session;
        state.Submission = submission;
        state.ChordSheet = original;
        var service = new ChordSubmissionService(
            session,
            null!,
            new AlbumArtFetcher(null!, null!, NullLogger<AlbumArtFetcher>.Instance),
            NullLogger<ChordSubmissionService>.Instance);
        approval.SubmissionId = submission.Id;
        approval.Approved = true;

        if (byAdmin)
        {
            await service.ApproveOrRejectByAdmin(approval);
        }
        else
        {
            await service.ApproveOrReject(approval, submission.ApproveRejectKey);
        }

        Assert.True(state.Saved);
        Assert.Contains(submission, state.Deleted);
        Assert.Contains(state.Token, state.Deleted);
        return Assert.IsType<ChordSheet>(state.ChordSheet);
    }

    public class ApprovalSession : DispatchProxy
    {
        public ChordSubmission Submission { get; set; } = new();
        public ChordSheet? ChordSheet { get; set; }
        public ApprovalToken Token { get; } = new() { Id = "ApprovalTokens/test-token" };
        public List<object> Deleted { get; } = [];
        public bool Saved { get; private set; }

        protected override object? Invoke(MethodInfo? targetMethod, object?[]? args)
        {
            switch (targetMethod?.Name)
            {
                case nameof(IAsyncDocumentSession.LoadAsync):
                    var type = targetMethod.GetGenericArguments().Single();
                    if (type == typeof(ChordSubmission))
                        return Task.FromResult(Submission);
                    if (type == typeof(ChordSheet))
                        return Task.FromResult(ChordSheet);
                    if (type == typeof(ApprovalToken))
                        return Task.FromResult(Token);
                    break;
                case nameof(IAsyncDocumentSession.StoreAsync):
                    ChordSheet = Assert.IsType<ChordSheet>(args![0]);
                    return Task.CompletedTask;
                case nameof(IAsyncDocumentSession.Delete):
                    Deleted.Add(args![0]!);
                    return null;
                case nameof(IAsyncDocumentSession.SaveChangesAsync):
                    Saved = true;
                    return Task.CompletedTask;
            }

            throw new NotSupportedException($"Unexpected session call: {targetMethod}");
        }
    }
}
