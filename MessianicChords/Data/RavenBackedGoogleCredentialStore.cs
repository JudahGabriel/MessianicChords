using Google.Apis.Util.Store;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Threading.Tasks;
using Raven.Abstractions.Data;
using MessianicChords.Models;
using Raven.Client;
using Raven.Client.Linq;

namespace MessianicChords.Data
{
    public class RavenBackedGoogleCredentialStore : IDataStore
    {
        public async Task ClearAsync()
        {
            using (var session = RavenStore.Instance.OpenAsyncSession())
            {
                var indexQuery = new IndexQuery { Query = "Tag:" + nameof(GoogleOAuthCredential) };
                session.Advanced.DocumentStore.DatabaseCommands.DeleteByIndex(
                    "Raven/DocumentsByEntityName",
                    indexQuery, 
                    new BulkOperationOptions() { AllowStale = true });

                await session.SaveChangesAsync();
            }
        }

        public async Task DeleteAsync<T>(string key)
        {
            using (var session = RavenStore.Instance.OpenAsyncSession())
            {
                var obj = await session.Query<GoogleOAuthCredential>()
                    .Where(c => c.Key == key)
                    .FirstOrDefaultAsync();
                if (obj != null)
                {
                    session.Delete(obj);
                    await session.SaveChangesAsync();
                }
            }
        }

        public async Task<T> GetAsync<T>(string key)
        {
            using (var session = RavenStore.Instance.OpenAsyncSession())
            {
                var cred = await session.Query<GoogleOAuthCredential>()
                    .FirstOrDefaultAsync(c => c.Key == key);
                if (cred != null)
                {
                    return (T)cred.Value;
                }
            }

            return default(T);
        }

        public async Task StoreAsync<T>(string key, T value)
        {
            using (var session = RavenStore.Instance.OpenAsyncSession())
            {
                var existing = await session.Query<GoogleOAuthCredential>()
                    .FirstOrDefaultAsync(c => c.Key == key);
                if (existing != null)
                {
                    existing.Value = value;
                }
                else
                {
                    var newCred = new GoogleOAuthCredential
                    {
                        Key = key,
                        Value = value
                    };
                    await session.StoreAsync(newCred);
                }

                await session.SaveChangesAsync();
            }
        }
    }
}