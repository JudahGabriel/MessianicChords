using MessianicChords.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;
using Raven.Client.Documents.Session;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MessianicChords.Api.Common
{
    /// <summary>
    /// MVC action filter that saves changes on the raven session.
    /// </summary>
    public class RavenSaveChangesFilter : IAsyncActionFilter
    {
        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var result = await next();
            var ravenController = context.Controller as RavenController;
            if (ravenController != null && result.Exception == null && context.HttpContext.Request.Method != "GET")
            {
                await ravenController.DbSession.SaveChangesAsync();
            }
        }
    }
}
