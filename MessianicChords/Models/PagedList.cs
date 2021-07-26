using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Components;

namespace MessianicChords.Models
{
    public class PagedList<T>
    {
        private readonly List<T> items = new List<T>();
        private readonly Func<int, int, Task<PagedResults<T>>> nextChunkFetcher;
        private readonly Action? stateHasChanged;

        public PagedList(Func<int, int, Task<PagedResults<T>>> nextChunkFetcher, Action stateHasChanged = null)
        {
            this.nextChunkFetcher = nextChunkFetcher;
            this.stateHasChanged = stateHasChanged;
        }

        public int? TotalCount { get; set; }
        public IReadOnlyList<T> Items => this.items;
        public bool IsLoading { get; set; }
        public int Take { get; set; } = 25;
        public int Skip { get; private set; }
        public bool HasMoreItems { get; private set; }

        public async Task<PagedResults<T>> GetNextChunk()
        {
            if (this.IsLoading)
            {
                return new PagedResults<T>();
            }

            this.IsLoading = true;
            try
            {
                var chunk = await this.nextChunkFetcher(Skip, Take);
                this.items.AddRange(chunk.Results);
                this.Skip += chunk.Results.Count;
                this.HasMoreItems = this.Items.Count < chunk.TotalCount;
                this.stateHasChanged?.Invoke();
                return chunk;
            }
            finally
            {
                this.IsLoading = false;
            }
        }
    }
}
