using Raven.Identity;
using System;
using System.Collections.Generic;
using System.Linq;

namespace MessianicChords.Models
{
    /// <summary>
    /// A user registered with MessianicChords.
    /// </summary>
    public class AppUser : IdentityUser
    {
        public const string AppUserPrefix = "AppUsers/";
        public const string AdminRole = "Admin";

        /// <summary>
        /// Gets the date the user registered.
        /// </summary>
        public DateTime RegistrationDate { get; set; }

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

        public AppUser Clone()
        {
            return new AppUser
            {
                Id = Id,
                LastSeen = LastSeen,
                RegistrationDate = RegistrationDate,
                RequiresPasswordReset = RequiresPasswordReset,
                Email = Email,
                UserName = UserName,
                LockoutEnabled = LockoutEnabled
            };
        }

        public bool IsAdmin()
        {
            return Roles.Contains(AdminRole);
        }
    }
}