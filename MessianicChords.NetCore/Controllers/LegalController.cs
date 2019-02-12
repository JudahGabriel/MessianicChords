using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace MessianicChords.Controllers
{
    [RequireHttps]
    public class LegalController : Controller
    {
        //
        // GET: /Legal/

        public ActionResult Index()
        {
            return View();
        }

    }
}
