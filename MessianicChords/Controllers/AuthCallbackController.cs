﻿using Google.Apis.Auth.OAuth2.Mvc;
using MessianicChords.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;

namespace MessianicChords.Controllers
{
    public class AuthCallbackController : Google.Apis.Auth.OAuth2.Mvc.Controllers.AuthCallbackController
    {
        protected override Google.Apis.Auth.OAuth2.Mvc.FlowMetadata FlowData
        {
            get { return new OAuthFlow(); }
        }
    }
}