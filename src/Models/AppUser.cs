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
        public const string AdminRole = "admin";
        
        /// <summary>
        /// Gets the total number of songs played by this user.
        /// </summary>
        public int TotalPlays { get; set; }

        /// <summary>
        /// Gets the date the user registered.
        /// </summary>
        public DateTime RegistrationDate { get; set; }

        /// <summary>
        /// Gets the last time we saw this user.
        /// </summary>
        public DateTime LastSeen { get; set; }

        /// <summary>
        /// Gets the total number of song requests made by this user.
        /// </summary>
        public int TotalSongRequests { get; set; }

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

        public AppUser Clone()
        {
            return new AppUser
            {
                Id = Id,
                LastSeen = LastSeen,
                TotalSongRequests = TotalSongRequests,
                RegistrationDate = RegistrationDate,
                RequiresPasswordReset = RequiresPasswordReset,
                TotalPlays = TotalPlays,
                Email = Email,
                UserName = UserName,
                LockoutEnabled = LockoutEnabled
            };
        }

        public bool IsAdmin()
        {
            return Roles.Contains(AppUser.AdminRole);
        }
    }
}