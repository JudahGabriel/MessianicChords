using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MessianicChords.Models
{
    public class ChangesPoll
    {
        public DateTime Date { get; set; }
        public long? LastChangeId { get; set; }
    }
}