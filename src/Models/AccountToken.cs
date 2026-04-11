namespace MessianicChords.Models
{
    public class AccountToken
    {
        public string? Id { get; set; }
        public string Token { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
    }
}
