using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MessianicChords.Models
{
    public class PagedResults<T>
    {
        public int Skip { get; init; }
        public int Take { get; init; }
        public List<T> Results { get; init; } = new List<T>();
        public int TotalCount { get; init; }
    }
}
