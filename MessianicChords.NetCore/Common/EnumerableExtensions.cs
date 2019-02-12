using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MessianicChords.Common
{
    public static class EnumerableExtensions
    {
        public static IEnumerable<IEnumerable<TResult>> Chunk<TSource, TResult>(this IEnumerable<TSource> source, Func<TSource, TResult> selector, int chunkSize)
        {
            IEnumerator<TSource> enumerator = source.GetEnumerator();
            while (true)
            {
                if (!enumerator.MoveNext())
                    break;
                var resultArray = new TResult[chunkSize];
                for (int i = 0; i < chunkSize; i++)
                {
                    resultArray[i] = selector(enumerator.Current);
                    if (i == chunkSize - 1 || !enumerator.MoveNext())
                        break;
                }
                yield return resultArray;
            }
        }
    }
}