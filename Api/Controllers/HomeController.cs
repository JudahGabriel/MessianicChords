using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MessianicChords.Controllers
{
    [Route("")]
    public class HomeController : ControllerBase
    {
        [HttpGet("/")]
        public string Get()
        {
            return "Messianic Chords API is running";
        }
    }
}
