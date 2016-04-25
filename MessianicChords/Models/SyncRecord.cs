using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MessianicChords.Models
{
    public class SyncRecord
    {
        public string Id { get; set; }
        public DateTime DateTime { get; set; }
        public List<string> AddedDocs { get; set; } = new List<string>();
        public List<string> RemovedDocs { get; set; } = new List<string>();
        public List<string> UpdatedDocs { get; set; } = new List<string>();
        public TimeSpan Elapsed { get; set; }
    }
}