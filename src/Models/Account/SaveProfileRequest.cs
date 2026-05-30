using Microsoft.AspNetCore.Http;

namespace MessianicChords.Models.Account
{
    public class SaveProfileRequest
    {
        public string? Id { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public IFormFile? ProfilePictureFile { get; set; }
    }
}
