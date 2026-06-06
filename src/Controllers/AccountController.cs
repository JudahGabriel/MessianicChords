using MessianicChords.Common;
using MessianicChords.Models;
using MessianicChords.Models.Account;
using MessianicChords.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.Extensions.Options;
using Raven.Client.Documents;
using Raven.Client.Documents.Session;
using Raven.Identity;
using Raven.StructuredLogger;
using System.Net;

namespace MessianicChords.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class AccountController : RavenController
    {
        private readonly UserManager<AppUser> userManager;
        private readonly RoleManager<Raven.Identity.IdentityRole> roleManager;
        private readonly SignInManager<AppUser> signInManager;
        private readonly EmailService emailSender;
        private readonly BunnyCdnManagerService bunnyCdn;
        private readonly AppSettings appOptions;
        
        public AccountController(
            UserManager<AppUser> userManager,
            RoleManager<Raven.Identity.IdentityRole> roleManager,
            SignInManager<AppUser> signInManager,
            IAsyncDocumentSession asyncDocumentSession,
            EmailService emailSender,
            BunnyCdnManagerService bunnyCdn,
            IOptionsMonitor<AppSettings> appOptions,
            ILogger<AccountController> logger)
            : base(asyncDocumentSession, logger)
        {
            this.signInManager = signInManager;
            this.userManager = userManager;
            this.roleManager = roleManager;
            this.emailSender = emailSender;
            this.bunnyCdn = bunnyCdn;
            this.appOptions = appOptions.CurrentValue;
        }

        [HttpGet]
        public async Task<IActionResult> GetFoo([FromServices] AlbumArtFetcher albumArtFetcher)
        {
            var charts = await this.DbSession.Query<ChordSheet>().Take(2100).ToListAsync();
            foreach (var chart in charts)
            {
                if (chart.AlbumArtUrl == null)
                {
                    chart.AlbumArtUrl = await albumArtFetcher.TryFetchAlbumArt(chart);
                }
            }

            await this.DbSession.SaveChangesAsync();
            return Ok("yes");
        }

        /// <summary>
        /// Returns currently logged in user.
        /// </summary>
        /// <returns code="200">Returns logged in user.</returns>
        [HttpGet]
        [ProducesResponseType(typeof(UserViewModel), (int)HttpStatusCode.OK)]
        [ProducesResponseType(typeof(void), (int)HttpStatusCode.NoContent)]
        public async Task<IActionResult> GetCurrentUser()
        {
            var userName = User.Identity?.Name;
            if (!string.IsNullOrEmpty(userName))
            {
                var user = await base.GetUserAsync();
                var userViewModel = user == null ? null : await this.BuildUserViewModel(user);
                return Ok(userViewModel);
            }

            return Ok(null);
        }

        [HttpPost]
        public async Task<IActionResult> SaveProfile([FromForm] SaveProfileRequest model)
        {
            var currentUser = await this.GetUserAsync();
            if (currentUser == null)
            {
                return this.Unauthorized();
            }

            if (string.IsNullOrWhiteSpace(model.Id)
                || !string.Equals(currentUser.Id, model.Id, StringComparison.OrdinalIgnoreCase))
            {
                logger.LogWarning("Rejected profile save for user {id} because it doesn't match current user {currentUserId}", model.Id, currentUser.Id);
                return this.Forbid();
            }

            if (model.ProfilePictureFile != null && model.ProfilePictureFile.Length == 0)
            {
                return this.BadRequest("Profile picture file is empty.");
            }

            if (model.ProfilePictureFile != null && model.ProfilePictureFile.Length > 5_000_000)
            {
                return this.BadRequest("Profile picture is too large.");
            }

            currentUser.FirstName = model.FirstName?.Trim() ?? string.Empty;
            currentUser.LastName = model.LastName?.Trim() ?? string.Empty;

            if (model.ProfilePictureFile != null)
            {
                var extension = Path.GetExtension(model.ProfilePictureFile.FileName);
                if (string.IsNullOrWhiteSpace(extension))
                {
                    return this.BadRequest("Profile picture file type is invalid.");
                }

                var fileName = $"{Guid.NewGuid()}{extension.ToLowerInvariant()}";
                await using var imageStream = model.ProfilePictureFile.OpenReadStream();
                var profilePictureUri = await this.bunnyCdn.UploadProfilePicture(imageStream, fileName);
                currentUser.ProfilePictureUrl = profilePictureUri;
            }

            var updated = await this.BuildUserViewModel(currentUser);
            return this.Ok(updated);
        }

        [HttpPost]
        public async Task<IActionResult> Star([BindRequired, FromBody] StarChordRequest model)
        {
            var currentUser = await this.GetUserAsync();
            if (currentUser == null)
            {
                return this.Unauthorized();
            }

            var chordChartId = this.NormalizeChordChartId(model.ChordChartId);
            if (string.IsNullOrWhiteSpace(chordChartId))
            {
                return this.BadRequest("Chord chart id is required.");
            }

            var alreadyStarred = currentUser.StarredChartIds.Any(id => string.Equals(id, chordChartId, StringComparison.OrdinalIgnoreCase));
            if (!alreadyStarred)
            {
                currentUser.StarredChartIds.Add(chordChartId);
            }

            var userViewModel = await this.BuildUserViewModel(currentUser);
            return this.Ok(userViewModel);
        }

        [HttpPost]
        public async Task<IActionResult> Unstar([BindRequired, FromBody] StarChordRequest model)
        {
            var currentUser = await this.GetUserAsync();
            if (currentUser == null)
            {
                return this.Unauthorized();
            }

            var chordChartId = this.NormalizeChordChartId(model.ChordChartId);
            if (string.IsNullOrWhiteSpace(chordChartId))
            {
                return this.BadRequest("Chord chart id is required.");
            }

            currentUser.StarredChartIds.RemoveAll(id => string.Equals(id, chordChartId, StringComparison.OrdinalIgnoreCase));

            var userViewModel = await this.BuildUserViewModel(currentUser);
            return this.Ok(userViewModel);
        }

        /// <summary>
        /// User SignIn.
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        [HttpPost]
        [ProducesResponseType(typeof(SignInModel), (int)HttpStatusCode.OK)]
        [ProducesResponseType(typeof(void), (int)HttpStatusCode.NoContent)]
        public async Task<IActionResult> SignIn([BindRequired, FromBody, FromForm] SignInModel model)
        {
            if (string.IsNullOrWhiteSpace(model.Email)
                || string.IsNullOrWhiteSpace(model.Password))
            {
                logger.LogInformation("Sign-in failed due to empty {email} or {password}", model.Email, model.Password);
                return Ok(new Models.Account.SignInResult
                {
                    ErrorMessage = "Bad user name or password",
                    Status = SignInStatus.Failure
                });
            }

            // Require the user to have a confirmed email before they can log on.
            var user = await userManager.FindByEmailAsync(model.Email);

            var isCorrectPassword = false;
            if (user != null)
            {
                isCorrectPassword = await userManager.CheckPasswordAsync(user, model.Password);
            }

            if (user == null
                || !isCorrectPassword)
            {
                logger.LogInformation("Sign in failed; bad user name or password {email}", model.Email);
                return Ok(new Models.Account.SignInResult
                {
                    ErrorMessage = "Bad user name or password",
                    Status = SignInStatus.Failure
                });
            }

            var isEmailConfirmed = await userManager.IsEmailConfirmedAsync(user);
            if (!isEmailConfirmed)
            {
                return Ok(new Models.Account.SignInResult
                {
                    Status = SignInStatus.RequiresVerification
                });
            }

            var signInResult = await signInManager.PasswordSignInAsync(
                                        model.Email,
                                        model.Password,
                                        model.StaySignedIn,
                                        lockoutOnFailure: false);

            var result = new Models.Account.SignInResult
            {
                Status = SignInStatusFromResult(signInResult, model.Email),
                User = new UserViewModel(user)
                //User = mapper.Map<UserViewModel>(user)
            };

            // If we've successfully signed in, store the json web token in the user.
            if (result.Status != SignInStatus.Success)
            {
                logger.LogInformation("Sign in failed with {status}: {errorMessage}", result.Status, result.ErrorMessage);
            }

            return Ok(result);
        }

        /// <summary>
        /// SingOut from the app.
        /// </summary>
        /// <returns></returns>
        [HttpPost]
        public new async Task SignOut()
        {
            await signInManager.SignOutAsync();
        }

        /// <summary>
        /// This is used for migrating old users into the new system. The old users were imported without passwords.
        /// When such a user signs in, we prompt them to create a password.
        /// </summary>
        /// <param name="email"></param>
        /// <param name="password"></param>
        /// <returns></returns>
        [HttpPost]
        public async Task CreatePassword(string email, string password)
        {
            // Find the user with that email.
            logger.LogInformation("Migrating user {email} from old system", email);

            var userId = $"AppUsers/{email}";

            var user = await DbSession.LoadAsync<AppUser>(userId);

            if (user?.RequiresPasswordReset != true
                || password.Length < 6
                || !password.Any(c => char.IsDigit(c)))
            {
                throw new UnauthorizedAccessException();
            }

            var removePasswordResult = await userManager.RemovePasswordAsync(user);
            if (!removePasswordResult.Succeeded)
            {
                throw new InvalidOperationException("CreatePassword failed because we couldn't remove the old password.")
                    .WithData("result", string.Join(", ", removePasswordResult.Errors.Select(e => e.Description)));
            }

            var addPasswordResult = await userManager.AddPasswordAsync(user, password);
            if (!addPasswordResult.Succeeded)
            {
                throw new InvalidOperationException("Unable to set the new password for the user.")
                    .WithData("result", string.Join(", ", addPasswordResult.Errors.Select(e => e.Description)));
            }

            user.RequiresPasswordReset = false;
            user.EmailConfirmed = true;
        }

        /// <summary>
        /// Return User View Model.
        /// </summary>
        /// <param name="email"></param>
        /// <returns></returns>
        [HttpGet]
        [ProducesResponseType(typeof(UserViewModel), (int)HttpStatusCode.OK)]
        [ProducesResponseType(typeof(void), (int)HttpStatusCode.NoContent)]
        public async Task<IActionResult> GetUserWithEmail(string email)
        {
            var userId = $"AppUsers/{email}";

            var user = await DbSession.LoadAsync<AppUser>(userId);
            if (user != null)
            {
                // Remove the user from the session, as we're going to clear out the password hash for security reasons before sending it to the user.
                DbSession.Advanced.Evict(user);
            }

            return Ok(user != null ? new UserViewModel(user) : null);
        }

        /// <summary>
        /// Register a new user.
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        [HttpPost]
        [AllowAnonymous]
        [ProducesResponseType(typeof(RegisterResults), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> Register([BindRequired, FromBody, FromForm] RegisterModel model)
        {
            // See if we're already registered.
            var emailLower = model.Email.ToLowerInvariant();
            var existingUser = await userManager.FindByEmailAsync(emailLower);
            if (existingUser != null)
            {
                return Ok(new RegisterResults
                {
                    ErrorMessage = "You're already registered.",
                    IsAlreadyRegistered = true,
                    NeedsConfirmation = !existingUser.EmailConfirmed
                });
            }

            // The user doesn't exist yet. Try and register him.
            var user = new AppUser
            {
                Id = $"AppUsers/{emailLower}",
                UserName = model.Email,
                Email = model.Email,
                LastSeen = DateTime.UtcNow,
                RegistrationDate = DateTime.UtcNow
            };
            var createUserResult = await userManager.CreateAsync(user, model.Password);
            if (createUserResult.Succeeded)
            {
                // Send confirmation email.
                var confirmToken = new AccountToken //await UserManager.GenerateEmailConfirmationTokenAsync(user.Id);
                {
                    Id = $"AccountTokens/Confirm/{emailLower}",
                    UserId = user.Id,
                    Token = Guid.NewGuid().ToString()
                };
                await DbSession.StoreAsync(confirmToken);
                DbSession.SetRavenExpiration(confirmToken, DateTime.UtcNow.AddDays(14));

                await emailSender.SendConfirmEmailAsync(model.Email, confirmToken.Token, appOptions);

                logger.LogInformation("Sending new user confirmation email to {email} with confirm token {token}", model.Email, confirmToken.Token);
                return Ok(new RegisterResults
                {
                    Success = true
                });
            }
            else
            {
                // Registration failed.
                logger.LogWarning("Register new user failed with {result}", createUserResult);
                return Ok(new RegisterResults
                {
                    ErrorMessage = string.Join(", ", createUserResult.Errors.Select(s => s.Description))
                });
            }
        }

        /// <summary>
        /// Confirms a user's email.
        /// </summary>
        /// <param name="email"></param>
        /// <param name="confirmCode"></param>
        [HttpPost]
        public async Task<ConfirmEmailResult> ConfirmEmail(string email, string confirmCode)
        {
            // Make sure the user exists.
            var userId = $"AppUsers/{email.ToLowerInvariant()}";

            var user = await DbSession.LoadAsync<AppUser>(userId);
            if (user == null)
            {
                logger.LogInformation("Rejected email confirmation because couldn't find {userId}", userId);
                return new ConfirmEmailResult
                {
                    Success = false,
                    ErrorMessage = "Couldn't find a user with that email."
                };
            }

            // We've seen some users click the confirm link multiple times.
            // If the user is already confirmed, just play along and say it's ok.
            if (user.EmailConfirmed)
            {
                return new ConfirmEmailResult
                {
                    Success = true
                };
            }

            var regTokenId = $"AccountTokens/Confirm/{email.ToLowerInvariant()}";
            var regToken = await DbSession.LoadOptionalAsync<AccountToken>(regTokenId);
            var isSameCode = regToken != null && string.Equals(regToken.Token, confirmCode, StringComparison.InvariantCultureIgnoreCase);
            var isSameUser = regToken != null && string.Equals(regToken.UserId, userId, StringComparison.InvariantCultureIgnoreCase);
            var isValidToken = isSameCode && isSameUser;
            var errorMessage = default(string);
            if (isValidToken)
            {
                user.EmailConfirmed = true;
                logger.LogInformation("Successfully confirmed new account {email}", email);

                // Add a welcome notification for the user.
                //user.AddNotification(Notification.Welcome(appOptions.AuthorImageUrl));

                // Send them a welcome email.
                await emailSender.SendWelcomeEmailAsync(email);
            }
            else if (regToken == null)
            {
                using (logger.BeginKeyValueScope("tokenId", regTokenId))
                {
                    errorMessage = "Tried to confirm email, but couldn't find the registration token for this user.";
                    logger.LogWarning(errorMessage);
                }
            }
            else if (!isSameCode)
            {
                using (logger.BeginKeyValueScope("regToken", regToken))
                using (logger.BeginKeyValueScope("confirmCode", confirmCode))
                {
                    errorMessage = "Tried to confirm email, but the confirmation code was wrong.";
                    logger.LogWarning(errorMessage);
                }
            }
            else
            {
                using (logger.BeginKeyValueScope("regToken", regToken))
                using (logger.BeginKeyValueScope("email", email))
                {
                    errorMessage = "Tried to confirm email, but the confirmation code was for an incorrect user.";
                    logger.LogError(errorMessage);
                }
            }

            if (!isValidToken)
            {
                logger.LogInformation("Rejected email confirmation. {errorMessage}", errorMessage);
            }

            return new ConfirmEmailResult
            {
                Success = isValidToken,
                ErrorMessage = errorMessage
            };
        }

        /// <summary>
        /// Begins the password reset process by generating a password reset token and sending the user an email with the link to reset the password.
        /// </summary>
        /// <param name="email"></param>
        [HttpPost]
        public async Task<ResetPasswordResult> SendResetPasswordEmail(string email)
        {
            var userId = $"AppUsers/{email.ToLower()}";

            var user = await DbSession.LoadAsync<AppUser>(userId);
            if (user == null)
            {
                logger.LogWarning("Tried to reset password, but couldn't find user with {email}.", email);
                return new ResetPasswordResult
                {
                    Success = false,
                    ErrorMessage = "Couldn't find user with email",
                    InvalidEmail = true
                };
            }

            var passwordResetToken = new AccountToken //await userManager.GeneratePasswordResetTokenAsync(user);
            {
                UserId = userId,
                Id = $"AccountTokens/Reset/{user.Email}",
                Token = Guid.NewGuid().ToString()
            };
            await DbSession.StoreAsync(passwordResetToken);
            DbSession.SetRavenExpiration(passwordResetToken, DateTime.UtcNow.AddDays(14));

            await emailSender.SendResetPassword(email, passwordResetToken.Token);

            logger.LogInformation("Sending reset password email to {email} with reset code {resetCode}", email, passwordResetToken.Token);
            return new ResetPasswordResult
            {
                Success = true,
                ErrorMessage = "",
                InvalidEmail = false
            };
        }

        /// <summary>
        /// Resets the user's password using the email and password reset code.
        /// </summary>
        /// <param name="email"></param>
        /// <param name="passwordResetCode"></param>
        /// <param name="newPassword"></param>
        [HttpPost]
        public async Task<ResetPasswordResult> ResetPassword(string email, string passwordResetCode, string newPassword)
        {
            var userId = $"AppUsers/{email.ToLower()}";

            var user = await DbSession.LoadAsync<AppUser>(userId);
            if (user == null)
            {
                logger.LogWarning("Attempted to reset password, but couldn't find a user with {email}", email);
                return new ResetPasswordResult
                {
                    Success = false,
                    ErrorMessage = "Couldn't find user with email"
                };
            }

            // Find the reset token.
            var resetTokenId = $"AccountTokens/Reset/{user.Email}";
            var resetToken = await DbSession.LoadAsync<AccountToken>(resetTokenId);
            if (resetToken == null)
            {
                logger.LogWarning("Attempted to reset password for {email}, but couldn't find password reset token {tokenId}", user.Email, resetTokenId);
                return new ResetPasswordResult
                {
                    Success = false,
                    ErrorMessage = "Couldn't find a password reset token for your user"
                };
            }

            // Verify the token is good.
            var isValidToken = string.Equals(resetToken.Token, passwordResetCode, StringComparison.InvariantCultureIgnoreCase);
            if (!isValidToken)
            {
                logger.LogWarning("Attempted to reset password for {email}, but the reset token was invalid. Expected {token} but found {invalidToken}", user.Email, resetToken.Token, passwordResetCode);
                return new ResetPasswordResult
                {
                    Success = false,
                    ErrorMessage = "Invalid password reset token"
                };
            }

            var tempResetToken = await userManager.GeneratePasswordResetTokenAsync(user);
            var passwordResetResult = await userManager.ResetPasswordAsync(user, tempResetToken, newPassword);
            if (!passwordResetResult.Succeeded)
            {
                using (logger.BeginKeyValueScope("errors", passwordResetResult.Errors.Select(e => e.Description)))
                {
                    logger.LogWarning("Unable to reset password for {email} using token {code}", email, passwordResetCode);
                }
            }

            logger.LogInformation("Successfully reset password for {email} using token {code}", email, passwordResetCode);
            return new ResetPasswordResult
            {
                Success = passwordResetResult.Succeeded,
                ErrorMessage = string.Join(",", passwordResetResult.Errors.Select(e => e.Description))
            };
        }

        /// <summary>
        /// Send direct message to the support.
        /// </summary>
        /// <param name="message"></param>
        /// <returns></returns>
        [HttpPost]
        public async Task<SupportMessage> SendSupportMessage([FromBody] SupportMessage message)
        {
            if (!string.IsNullOrEmpty(User.Identity?.Name))
            {
                message.UserId = $"AppUsers/{User.Identity.Name}";
            }

            using (logger.BeginKeyValueScope("message", message))
            {
                logger.LogInformation("Support message submitted");
            }

            // If we have a userID, see if we can load that user and update his/her name.
            if (!string.IsNullOrEmpty(message.Name) && !string.IsNullOrEmpty(message.UserId))
            {
                var user = await GetUserAsync();
                if (user != null && string.IsNullOrEmpty(user.FirstName) && string.IsNullOrEmpty(user.LastName))
                {
                    // Update their name.
                    var nameParts = message.Name.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
                    user.FirstName = nameParts.FirstOrDefault() ?? string.Empty;
                    user.LastName = string.Join(' ', nameParts.Skip(1));
                }
            }

            var isMutedUser = await DbSession.Advanced.ExistsAsync("MutedEmails/" + message.Email);
            if (!isMutedUser)
            {
                await emailSender.SendSupportEmailAsync(message);
            }
            else
            {
                logger.LogInformation("Support email received from muted user {email}. No email will be sent.", message.Email);
            }

            return message;
        }

        [HttpPost]
        public async Task ResendConfirmationEmail([FromBody] AppUser user) // user is just the container for .Email, the rest of the properties aren't filled out
        {
            var userWithEmail = await DbSession.LoadAsync<AppUser>("AppUsers/" + user.Email);
            if (userWithEmail?.EmailConfirmed == false)
            {
                var confirmToken = new AccountToken
                {
                    Id = $"AccountTokens/Confirm/{userWithEmail.Email}",
                    UserId = userWithEmail.Id!,
                    Token = Guid.NewGuid().ToString()
                };
                await DbSession.StoreAsync(confirmToken);
                DbSession.SetRavenExpiration(confirmToken, DateTime.UtcNow.AddDays(14));

                await emailSender.SendConfirmEmailAsync(userWithEmail.Email, confirmToken.Token, appOptions);
            }
        }

        [HttpPost]
        public async Task<IActionResult> DeleteMyAccount()
        {
            var user = await GetUserAsync();
            if (user == null)
            {
                return Unauthorized();
            }

            await userManager.DeleteAsync(user);
            await signInManager.SignOutAsync();
            return Ok();
        }

        private SignInStatus SignInStatusFromResult(Microsoft.AspNetCore.Identity.SignInResult result, string email)
        {
            if (result.Succeeded)
            {
                return SignInStatus.Success;
            }

            if (result.IsLockedOut)
            {
                return SignInStatus.LockedOut;
            }

            if (result.IsNotAllowed)
            {
                logger.LogWarning("User {email} couldn't sign in because SignInResult = IsNotAllowed, {result}. Check that the user isn't locked out and has confirmed email.", email, result.ToString());
                return SignInStatus.Failure;
            }

            return SignInStatus.Failure;
        }

        private async Task<UserViewModel> BuildUserViewModel(AppUser user)
        {
            var userViewModel = new UserViewModel(user);
            var chordChartIds = user.EditedChordChartIds.Concat(user.NewChordChartIds).Concat(user.StarredChartIds);
            var chordChartsById = await this.DbSession.LoadAsync<ChordSheet>(chordChartIds);
            userViewModel.UpdateChordCharts(chordChartsById.Where(c => c.Value != null).Select(c => c.Value!));
            return userViewModel;
        }

        private string NormalizeChordChartId(string? chordChartId)
        {
            var normalized = chordChartId?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(normalized))
            {
                return string.Empty;
            }

            if (!normalized.StartsWith("chordsheets/", StringComparison.OrdinalIgnoreCase))
            {
                normalized = $"chordsheets/{normalized}";
            }

            return normalized;
        }
    }
}