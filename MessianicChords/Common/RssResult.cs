using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Text;
using System.Web.Mvc;
using System.ServiceModel.Syndication;
using System.Xml;
using System.Diagnostics.Contracts;

namespace MessianicChords.Common
{
    public class RssResult : ActionResult
    {
        public RssResult(SyndicationFeedFormatter feed)
        {
            this.Feed = feed;
        }

        public Encoding ContentEncoding { get; set; }
        public string ContentType { get; set; }
        public SyndicationFeedFormatter Feed { get; private set; }

        public override void ExecuteResult(ControllerContext context)
        {
            Contract.Requires(context != null);

            var response = context.HttpContext.Response;
            response.ContentType = !string.IsNullOrEmpty(ContentType) ? ContentType : "application/rss+xml";

            if (ContentEncoding != null)
            {
                response.ContentEncoding = ContentEncoding;
            }

            if (Feed != null)
            {
                using (var xmlWriter = new XmlTextWriter(response.Output))
                {
                    xmlWriter.Formatting = Formatting.Indented;
                    Feed.WriteTo(xmlWriter);
                }
            }
        }
    }
}