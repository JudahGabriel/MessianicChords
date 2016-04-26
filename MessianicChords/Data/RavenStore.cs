using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Raven.Client;
using Raven.Client.Document;
using Raven.Client.Indexes;
using MessianicChords.Models;
using System.Reactive.Linq;
using MessianicChords.Services;
using System.Web.Hosting;

namespace MessianicChords.Data
{
    public static class RavenStore
    {
        public static readonly IDocumentStore Instance = Initialize();
        
        public static IDocumentStore Initialize()
        {
            var store = new DocumentStore { ConnectionStringName = "RavenDb" };
            store.Initialize();
            IndexCreation.CreateIndexes(typeof(RavenStore).Assembly, store);

            // When a chord sheet is added or updated, try to fetch its plain text.
            //store.Changes().ForDocumentsInCollection<ChordSheet>()
            //    .Where(c => c.Type == Raven.Abstractions.Data.DocumentChangeTypes.BulkInsertEnded || c.Type == Raven.Abstractions.Data.DocumentChangeTypes.Put)
            //    .Subscribe(n => HostingEnvironment.QueueBackgroundWorkItem(_ => new DocumentTextFetcher(n.Id).Fetch()));
            return store;
        }
    }
}