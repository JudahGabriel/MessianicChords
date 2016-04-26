using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MessianicChords.Models
{
    public class Log
    {
        public string Message { get; set; }
        public DateTime Date { get; set; } = DateTime.UtcNow;
    }
}