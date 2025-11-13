using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace ProcesoAnulacionMasiva.Helpers
{
    public static class LinqBatchExtensions
    {
        public static IEnumerable<List<T>> Batch<T>(this IEnumerable<T> src, int size)
        {
            var bucket = new List<T>(size);
            foreach (var x in src)
            {
                bucket.Add(x);
                if (bucket.Count == size) { yield return bucket; bucket = new List<T>(size); }
            }
            if (bucket.Count > 0) yield return bucket;
        }
    }
}