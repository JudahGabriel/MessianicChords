using System.Text.Json;
using MessianicChords.Models;

namespace MessianicChords.Tests;

public class ChordSubmissionApprovalTests
{
    [Theory]
    [InlineData("Am  D\nSong lyrics")]
    [InlineData("")]
    public void ApprovalAcceptsAdminChordsOverride(string chords)
    {
        var json = JsonSerializer.Serialize(new { submissionId = "ChordSubmissions/1", approved = true, chords });
        var approval = JsonSerializer.Deserialize<ChordSubmissionApproval>(json, new JsonSerializerOptions(JsonSerializerDefaults.Web))!;
        var serialized = JsonSerializer.SerializeToElement(approval, new JsonSerializerOptions(JsonSerializerDefaults.Web));

        Assert.True(serialized.TryGetProperty("chords", out var overrideValue));
        Assert.Equal(chords, overrideValue.GetString());
    }

    [Fact]
    public void LegacyApprovalHasNoChordsOverride()
    {
        var approval = JsonSerializer.Deserialize<ChordSubmissionApproval>(
            """{"submissionId":"ChordSubmissions/1","approved":true}""",
            new JsonSerializerOptions(JsonSerializerDefaults.Web))!;
        var serialized = JsonSerializer.SerializeToElement(approval, new JsonSerializerOptions(JsonSerializerDefaults.Web));

        Assert.True(serialized.TryGetProperty("chords", out var overrideValue));
        Assert.Equal(JsonValueKind.Null, overrideValue.ValueKind);
    }
}
