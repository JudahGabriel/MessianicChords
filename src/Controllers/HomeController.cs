using MessianicChords.Common;
using MessianicChords.Models;
using MessianicChords.Services;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Raven.Client.Documents.Session;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Xml;

namespace MessianicChords.Controllers
{
    [Route("")]
    public class HomeController : Controller
    {
        private readonly IAsyncDocumentSession dbSession;
        private readonly IWebHostEnvironment webHost;
        private readonly FingerprintedResourceService fingerprintedResourceService;
        private readonly ILogger<HomeController> logger;

        public HomeController(
            IAsyncDocumentSession dbSession, 
            IWebHostEnvironment webHost, 
            FingerprintedResourceService fingerprintedResourceService,
            ILogger<HomeController> logger)
        {
            this.dbSession = dbSession;
            this.webHost = webHost;
            this.fingerprintedResourceService = fingerprintedResourceService;
            this.logger = logger;
        }

        /// <summary>
        /// Server side rendering for home page.
        /// </summary>
        /// <returns></returns>
        [HttpGet("/")]
        public async Task<IActionResult> Index()
        {
            // Development? Return our simple dev-index.html file.
            if (this.webHost.IsDevelopment())
            {
                return File("/dev-index.html", "text/html");
            }

            var resources = await this.fingerprintedResourceService.GetResourcesAsync();
            if (resources == null)
            {
                return StatusCode(500, "Error fetching fingerprinted resources.");
            }

            var model = new HomeViewModel(resources.IndexJs, resources.IndexCss);
            return View("Index", model);
        }

        /// <summary>
        /// Server side rendering for chord details.
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [HttpGet("chordsheets/{id}")]
        public async Task<IActionResult> ChordDetails(string id)
        {
            // Development? Return our simple dev-index.html file.
            if (this.webHost.IsDevelopment())
            {
                return File("/dev-index.html", "text/html");
            }

            var resources = await this.fingerprintedResourceService.GetResourcesAsync();
            if (resources == null)
            {
                return StatusCode(500, "Error fetching fingerprinted resources.");
            }

            var model = new HomeViewModel(resources.IndexJs, resources.IndexCss);
            var chordSheet = await dbSession.LoadOptionalAsync<ChordSheet>("chordsheets/" + id);
            if (chordSheet != null)
            {
                model.UpdateFromChordSheet(chordSheet);
            }

            return View("Index", model);
        }

        [HttpGet("sitemap")]
        public async Task<IActionResult> Sitemap()
        {
            // Grab all the chord sheets with which we'll generate our site map.
            var chords = new List<ChordSheet>(3000);
            var artists = new HashSet<string>(1000);
            await foreach (var doc in dbSession.Advanced.Stream<ChordSheet>())
            {
                chords.Add(doc);
                if (!string.IsNullOrEmpty(doc.Artist))
                {
                    artists.Add(doc.Artist);
                }
            }
            var lastUpdatedChordDate = chords
                .OrderByDescending(c => c.LastUpdated)
                .Select(c => c.LastUpdated)
                .FirstOrDefault();

            // Write the sitemap.
            var xmlDoc = new XmlDocument();
            var declaration = xmlDoc.CreateXmlDeclaration("1.0", "UTF-8", "yes");
            xmlDoc.AppendChild(declaration);
            var urlSet = xmlDoc.CreateElement("urlset", "http://www.sitemaps.org/schemas/sitemap/0.9");
            xmlDoc.AppendChild(urlSet);
            
            // Append our pages
            urlSet.AppendChild(CreateUrlNode(xmlDoc, "https://messianicchords.com", lastUpdatedChordDate, "weekly", 1));
            urlSet.AppendChild(CreateUrlNode(xmlDoc, "https://messianicchords.com/browse/newest", lastUpdatedChordDate, "weekly", 0.8));
            urlSet.AppendChild(CreateUrlNode(xmlDoc, "https://messianicchords.com/browse/songs", lastUpdatedChordDate, "weekly", 0.8));
            urlSet.AppendChild(CreateUrlNode(xmlDoc, "https://messianicchords.com/browse/artists", lastUpdatedChordDate, "weekly", 0.8));
            urlSet.AppendChild(CreateUrlNode(xmlDoc, "https://messianicchords.com/browse/random", lastUpdatedChordDate, "always", 0.2));
            urlSet.AppendChild(CreateUrlNode(xmlDoc, "https://messianicchords.com/about", lastUpdatedChordDate, "yearly", 0.2));
            
            // Append artist pages.
            foreach (var artist in artists)
            {
                var artistLastModified = chords
                    .Where(c => string.Equals(c.Artist, artist, StringComparison.OrdinalIgnoreCase))
                    .OrderByDescending(c => c.LastUpdated)
                    .Select(c => c.LastUpdated)
                    .FirstOrDefault();
                urlSet.AppendChild(CreateUrlNode(xmlDoc, $"https://messianicchords.com/artist/{Uri.EscapeDataString(artist)}", artistLastModified, "monthly", 0.4));
            }

            // Append chord detail pages
            foreach (var chord in chords)
            {
                urlSet.AppendChild(CreateUrlNode(xmlDoc, "https://messianicchords.com/" + chord.Id!.ToLowerInvariant(), chord.LastUpdated, "yearly", 0.5));
            }

            var docStream = new MemoryStream();
            var docStreamWriter = XmlWriter.Create(docStream, new XmlWriterSettings { OmitXmlDeclaration = false });
            xmlDoc.Save(docStreamWriter);
            docStream.Position = 0;

            Response.RegisterForDispose(docStreamWriter);
            Response.RegisterForDispose(docStream);

            return File(docStream, "text/xml");
        }

        [HttpGet(".well-known/apple-app-site-association")]
        public IActionResult AppleSiteAssociation()
        {
            return File("/apple-app-site-association.json", "application/json");
        }

        private XmlNode CreateUrlNode(XmlDocument doc, string location, DateTime lastModified, string changeFrequency, double priority)
        {
            var siteMapNamespace = "http://www.sitemaps.org/schemas/sitemap/0.9";
            var urlElement = doc.CreateElement("url", siteMapNamespace);
            var locElement = doc.CreateElement("loc", siteMapNamespace);
            var lastModElement = doc.CreateElement("lastmod", siteMapNamespace);
            var changeFreqElement = doc.CreateElement("changefreq", siteMapNamespace);
            var priorityElement = doc.CreateElement("priority", siteMapNamespace);

            locElement.InnerText = location;
            lastModElement.InnerText = lastModified.ToString("yyyy'-'MM'-'dd");
            changeFreqElement.InnerText = changeFrequency;
            priorityElement.InnerText = priority.ToString();

            urlElement.AppendChild(locElement);
            urlElement.AppendChild(lastModElement);
            urlElement.AppendChild(changeFreqElement);
            urlElement.AppendChild(priorityElement);
            
            return urlElement;
        }
    }
}
