namespace MessianicChords.Api.Models
{
    /// <summary>
    /// Temporary token generated for chord approval/rejection.
    /// </summary>
    public class ApprovalToken
    {
        public string? Id { get; set; }
        public string Token { get; set; } = string.Empty;
    }
}
