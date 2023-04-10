//using Google.Apis.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MessianicChords.Models
{
    public class GDriveAuthorizeResult
    {
        //public BaseClientService.Initializer Initializer { get; set; }
        public string? RedirectUri { get; set; }
    }
}