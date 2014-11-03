using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MessianicChords.Common
{
    public static class Extensions
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

        public static IEnumerable<T> Except<T>(this IEnumerable<T> items, Func<T, bool> predicate)
        {
            return items.Where(i => !predicate(i));
        }
    }
}