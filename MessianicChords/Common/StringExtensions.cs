using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MessianicChords.Common
{
    /// <summary>
    /// String extension methods.
    /// </summary>
    public static class StringExtensions
    {
        /// <summary>
        /// Takes a string that starts with English but may end in Hebrew.
        /// Input: "Adonai Li אדוני לי"
        /// Output: (english: Adonai Li, hebrew: אדוני לי)
        /// </summary>
        /// <param name="input">The input, which may contain English and Hebrew letters.</param>
        /// <returns></returns>
        public static (string english, string hebrew) GetEnglishAndHebrew(this string input)
        {
            const int aleph = 1488;
            const int tav = 1514;
            var isHebrewLetter = new Func<char, bool>(c => c >= aleph && c <= tav);
            var firstHebrewLetterIndex = input.IndexWhere(isHebrewLetter);
            if (firstHebrewLetterIndex == -1)
            {
                return (english: input, hebrew: string.Empty);
            }

            var english = input[..firstHebrewLetterIndex].Trim();
            var hebrew = input[firstHebrewLetterIndex..].Trim();
            return (english, hebrew);
        }

        /// <summary>
        /// Finds the index of the character matching the specified predicate.
        /// </summary>
        /// <param name="input">The string to check.</param>
        /// <param name="predicate">The predicate determining what character is a match.</param>
        /// <returns>The index of the character matching the <paramref name="predicate"/>.</returns>
        public static int IndexWhere(this string input, Func<char, bool> predicate)
        {
            for (var i = 0; i < input.Length; i++)
            {
                if (predicate(input[i]))
                {
                    return i;
                }
            }

            return -1;
        }
    }
}
