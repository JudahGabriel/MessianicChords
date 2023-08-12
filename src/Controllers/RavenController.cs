using MessianicChords.Api.Common;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Raven.Client.Documents.Session;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MessianicChords.Controllers
{
    [ServiceFilter(typeof(RavenSaveChangesFilter))]
    public abstract class RavenController : Controller
    {
        private readonly IAsyncDocumentSession dbSession;
        protected readonly ILogger logger;

        public RavenController(IAsyncDocumentSession dbSession, ILogger logger)
        {
            this.dbSession = dbSession;
            this.logger = logger;
        }

        public IAsyncDocumentSession DbSession => this.dbSession;
    }
}
