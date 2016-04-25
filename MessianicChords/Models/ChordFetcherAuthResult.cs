using MessianicChords.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MessianicChords.Models
{
    public class ChordFetcherAuthResult
    {
        public ChordsFetcher ChordsFetcher { get; set; }
        public string RedirectUrl { get; set; }
    }
}