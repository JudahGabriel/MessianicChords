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
using Raven.Abstractions.Data;

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
            //store.Changes()
            //    .ForDocumentsOfType<ChordSheet>()
            //    .Where(x => x.Type == DocumentChangeTypes.Put || x.Type == DocumentChangeTypes.BulkInsertEnded)
            //    .GroupByUntil(x => 1, x => Observable.Timer(TimeSpan.FromSeconds(5)))
            //    .SelectMany(x => x.ToList())
            //    .Select(changes => changes.Select(c => c.Id))
            //    .Subscribe(results => new DocumentTextFetcher(results));

            return store;
        }
    }
}