using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MessianicChords.Models
{
    public class DocumentTextFetchRecord
    {
        public DateTime DateTime { get; set; } = DateTime.UtcNow;
        public List<string> ChordDescriptions { get; set; } = new List<string>();
        public List<string> ChordIds { get; set; } = new List<string>();
        public List<string> Log { get; set; } = new List<string>();
    }
}