using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MessianicChords.Data;
using MessianicChords.Models;
using MessianicChords.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Raven.Client.Documents;
using Raven.Client.Documents.Session;

namespace MessianicChords.Controllers
{
    [Route("[controller]/[action]")]
    public class UploadsController : RavenController
    {
        private readonly EmailService emailService;

        public UploadsController(EmailService emailService, IAsyncDocumentSession dbSession, ILogger<ChordsController> logger)
            : base(dbSession, logger)
        {
            this.emailService = emailService;
        }

        [HttpPost]
        public async Task Upload(List<IFormFile> files)
        {
            await this.emailService.SendEmailWithUploadedChords(files);
        }
    }
}
