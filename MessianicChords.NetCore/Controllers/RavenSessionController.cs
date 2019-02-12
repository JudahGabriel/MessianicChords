using MessianicChords.Common;
using MessianicChords.Data;
using Raven.Client;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace MessianicChords.Controllers
{
    public abstract class RavenSessionController : Controller
    {
        public IAsyncDocumentSession DbSession { get; set; }

        protected override void OnActionExecuting(ActionExecutingContext filterContext)
        {
            this.DbSession = RavenStore.Instance.OpenAsyncSession();
        }

        protected override void OnActionExecuted(ActionExecutedContext filterContext)
        {
            if (filterContext.IsChildAction)
            {
                return;
            }

            using (DbSession)
            {
                if (DbSession != null && filterContext.Exception == null)
                {
                    var task = DbSession.SaveChangesAsync();
                    task.ContinueWith(_ => base.OnActionExecuted(filterContext));
                }
            }
        }
    }
}