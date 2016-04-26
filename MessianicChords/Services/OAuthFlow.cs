
using Google.Apis.Auth.OAuth2;
using Google.Apis.Auth.OAuth2.Flows;
using Google.Apis.Auth.OAuth2.Mvc;
using Google.Apis.Drive.v2;
using MessianicChords.Data;
using System.Configuration;
using System.Web.Mvc;

namespace MessianicChords.Services
{
    public class OAuthFlow : FlowMetadata
    {
        private static readonly IAuthorizationCodeFlow flow =
            new GoogleAuthorizationCodeFlow(new GoogleAuthorizationCodeFlow.Initializer
            {
                ClientSecrets = new ClientSecrets
                {
                    ClientId = ConfigurationManager.AppSettings["googleClientId"],
                    ClientSecret = ConfigurationManager.AppSettings["googleClientSecret"],
                },
                Scopes = new[] { DriveService.Scope.Drive },
                DataStore = new RavenBackedGoogleCredentialStore()
            });

        public override string GetUserId(Controller controller)
        {
            return "judahgabriel@gmail.com";
        }

        public override IAuthorizationCodeFlow Flow
        {
            get { return flow; }
        }
    }
}