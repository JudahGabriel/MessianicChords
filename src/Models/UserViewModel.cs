using MessianicChords.Common;
using Raven.Identity;
using System.Reactive;

namespace MessianicChords.Models
{
    public class UserViewModel
    {
        public UserViewModel()
        {            
        }

        public UserViewModel(AppUser user)
        {
            this.CopyPropsFrom(user);
        }

        /// <summary>
        /// Gets the date the user registered.
        /// </summary>
        public DateTime RegistrationDate { get; set; }

        /// <summary>
        /// Gets the last time we saw this user.
        /// </summary>
        public DateTime LastSeen { get; set; }

        /// <summary>
        /// Whether this user requires a password reset.
        /// </summary>
        public bool RequiresPasswordReset { get; set; }

        /// <summary>
        /// The user's first name.
        /// </summary>
        public string FirstName { get; set; } = string.Empty;

        /// <summary>
        /// The user's last name.
        /// </summary>
        public string LastName { get; set; } = string.Empty;

        /// <summary>
        /// The user's profile image URL.
        /// </summary>
        public Uri? ProfilePictureUrl { get; set; }

        /// <summary>
        /// Number of times sign in failed.
        /// </summary>
        public int AccessFailedCount { get; set; }

        /// <summary>
        /// The user's claims, for use in claims-based authentication.
        /// </summary>
        public List<IdentityUserClaim> Claims { get; set; } = new List<IdentityUserClaim>();

        /// <summary>
        /// The email of the user.
        /// </summary>
        public string Email { get; set; } = string.Empty;

        /// <summary>
        /// The ID of the user.
        /// </summary>
        public string? Id { get; set; }

        /// <summary>
        /// The user name. Usually the same as the email.
        /// </summary>
        public string UserName { get; set; } = string.Empty;

        /// <summary>
        /// Whether the user has confirmed their email address.
        /// </summary>
        public bool EmailConfirmed { get; set; }

        /// <summary>
        /// Whether the user has confirmed their phone.
        /// </summary>
        public bool IsPhoneNumberConfirmed { get; set; }

        /// <summary>
        /// Whether the user is locked out.
        /// </summary>
        public bool LockoutEnabled { get; set; }

        /// <summary>
        /// Whether the user is locked out.
        /// </summary>
        public DateTimeOffset? LockoutEndDate { get; set; }

        /// <summary>
        /// Whether 2-factor authentication is enabled.
        /// </summary>
        public bool TwoFactorEnabled { get; set; }

        /// <summary>
        /// The phone number.
        /// </summary>
        public string? PhoneNumber { get; set; }

        /// <summary>
        ///  The roles of the user.
        /// </summary>
        public List<string> Roles { get; set; } = new List<string>();

        /// <summary>
        /// Whether the user is an admin.
        /// </summary>
        public bool IsAdmin => Roles.Contains(AppUser.AdminRole);

        /// <summary>
        /// The IDs of the chord charts the user has starred.
        /// </summary>
        public List<string> StarredChartIds { get; set; } = new List<string>();

        /// <summary>
        /// The IDs of the chord charts the user has edited.
        /// </summary>
        public List<string> EditedChordChartIds { get; set; } = new List<string>();

        /// <summary>
        /// The IDs of the chord charts the user has created.
        /// </summary>
        public List<string> NewChordChartIds { get; set; } = new List<string>();

        /// <summary>
        /// A dictionary mapping chord chart IDs to chord chart names for the chord charts the user has
        /// </summary>
        public Dictionary<string, string> NewChordCharts { get; set; } = new Dictionary<string, string>();
        
        /// <summary>
        /// A dictionary mapping chord chart IDs to chord chart names for the chord charts the user has edited.
        /// </summary>
        public Dictionary<string, string> EditedChordCharts { get; set; } = new Dictionary<string, string>();

        /// <summary>
        /// A dictionary mapping chord chart IDs to chord chart names for the chord charts the user has starred.
        /// </summary>
        public Dictionary<string, string> StarredChordCharts { get; set; } = new Dictionary<string, string>();

        /// <summary>
        /// Updates the NewChordCharts, EditedChordCharts, and StarredChordCharts dictionaries based on the given chord charts.
        /// </summary>
        /// <param name="charts"></param>
        public void UpdateChordCharts(IEnumerable<ChordSheet> charts)
        {
            foreach (var chart in charts)
            {
                if (string.IsNullOrEmpty(chart.Id))
                {
                    continue;
                }

                if (EditedChordChartIds.Contains(chart.Id))
                {
                    EditedChordCharts[chart.Id] = $"{chart.Artist} - {chart.Song}";
                }

                if (NewChordChartIds.Contains(chart.Id))
                {
                    NewChordCharts[chart.Id] = $"{chart.Artist} - {chart.Song}";
                }

                if (StarredChartIds.Contains(chart.Id))
                {
                    StarredChordCharts[chart.Id] = $"{chart.Artist} - {chart.Song}";
                }
            }
        }
    }
}
