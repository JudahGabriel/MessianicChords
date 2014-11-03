using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Raven.Client;
using Raven.Client.Document;
using Raven.Client.Indexes;

namespace MessianicChords.Common
{
    public static class RavenStore
    {
        public static readonly IDocumentStore Instance = Initialize();
        
        public static IDocumentStore Initialize()
        {
            var instance = new DocumentStore { ConnectionStringName = "RavenDb" };
            instance.Initialize();
            IndexCreation.CreateIndexes(typeof(RavenStore).Assembly, instance);
            return instance;
        }
    }
}