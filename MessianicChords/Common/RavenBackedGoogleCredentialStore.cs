using Google.Apis.Util.Store;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Threading.Tasks;
using Raven.Abstractions.Data;

namespace MessianicChords.Common
{
    public class RavenBackedGoogleCredentialStore : IDataStore
    {
        public async Task ClearAsync()
        {
            using (var session = RavenStore.Instance.OpenAsyncSession())
            {
                session.Delete("TokenSession/MessianicChords");
                await session.SaveChangesAsync();
            }
        }

        public async Task DeleteAsync<T>(string key)
        {
            using (var session = RavenStore.Instance.OpenAsyncSession())
            {
                session.Delete(key);
                await session.SaveChangesAsync();
            }
        }

        public async Task<T> GetAsync<T>(string key)
        {
            using (var session = RavenStore.Instance.OpenAsyncSession())
            {
                return await session.LoadAsync<T>(key);
            }
        }

        public async Task StoreAsync<T>(string key, T value)
        {
            using (var session = RavenStore.Instance.OpenAsyncSession())
            {
                await session.StoreAsync(value, key);
                await session.SaveChangesAsync();
            }
        }
    }
}