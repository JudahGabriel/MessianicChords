using MessianicChords.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Mvc.ModelBinding.Binders;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Primitives;
using System.Globalization;

namespace MessianicChords.Tests;

public class ChordSheetTests
{
    [Theory]
    [InlineData(nameof(ChordSubmissionRequest.BeatsPerMinute))]
    [InlineData(nameof(ChordSubmissionRequest.TimingSignature))]
    public async Task SubmissionFormPreservesExplicitlyClearedArrangementField(string propertyName)
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddControllers();
        using var provider = services.BuildServiceProvider();
        var metadata = provider.GetRequiredService<IModelMetadataProvider>()
            .GetMetadataForProperty(typeof(ChordSubmissionRequest), propertyName);
        var values = new FormValueProvider(BindingSource.Form,
            new FormCollection(new Dictionary<string, StringValues> { [propertyName] = "" }),
            CultureInfo.InvariantCulture);
        var context = DefaultModelBindingContext.CreateBindingContext(
            new ActionContext { HttpContext = new DefaultHttpContext() },
            values, metadata, bindingInfo: null, modelName: propertyName);
        var binder = new SimpleTypeModelBinder(typeof(string), NullLoggerFactory.Instance);

        await binder.BindModelAsync(context);

        Assert.True(context.Result.IsModelSet);
        Assert.Equal("", context.Result.Model);
    }

    [Theory]
    [InlineData("110", "4/4")]
    [InlineData("60/90", "3/4")]
    [InlineData("", "")]
    public void UpdateFromCopiesTempoAndTimingSignature(string beatsPerMinute, string timingSignature)
    {
        var chordSheet = new ChordSheet { BeatsPerMinute = "80", TimingSignature = "6/8" };
        var editedChordSheet = new ChordSheet
        {
            BeatsPerMinute = beatsPerMinute,
            TimingSignature = timingSignature
        };

        chordSheet.UpdateFrom(editedChordSheet);

        Assert.Equal(beatsPerMinute, chordSheet.BeatsPerMinute);
        Assert.Equal(timingSignature, chordSheet.TimingSignature);
    }

    [Fact]
    public void UpdateFromPreservesTempoAndTimingSignatureWhenOmitted()
    {
        var chordSheet = new ChordSheet { BeatsPerMinute = "80", TimingSignature = "6/8" };

        chordSheet.UpdateFrom(new ChordSheet());

        Assert.Equal("80", chordSheet.BeatsPerMinute);
        Assert.Equal("6/8", chordSheet.TimingSignature);
    }

    [Fact]
    public void UpdateFromCopiesTags()
    {
        var chordSheet = new ChordSheet();
        var editedChordSheet = new ChordSheet
        {
            Tags = ["worship", "upbeat"]
        };

        chordSheet.UpdateFrom(editedChordSheet);

        Assert.Equal(editedChordSheet.Tags, chordSheet.Tags);
    }

    [Fact]
    public void UpdateFromCopiesSubmittedBy()
    {
        var chordSheet = new ChordSheet();
        var editedChordSheet = new ChordSheet
        {
            SubmittedBy = "submitter@example.com"
        };

        chordSheet.UpdateFrom(editedChordSheet);

        Assert.Equal(editedChordSheet.SubmittedBy, chordSheet.SubmittedBy);
    }
}
