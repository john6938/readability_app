import nlp from 'compromise';

export interface ReadabilityIndices {
  fleschReadingEase: number;
  fleschGradeLevel: number;
  gunningFog: number;
  smog: number;
  colemanLiau: number;
  ari: number;
}

export interface TextStats {
  nbSentences: number;
  nbWords: number;
  nbSyllables: number;
  nbComplexWords: number;
  pctComplexWords: number;
  avgWordsPerSent: number;
  avgSyllPerWord: number;
}

export interface ReadabilityResult {
  indices: ReadabilityIndices;
  stats: TextStats;
}

/**
 * Syllable counter — faithful TypeScript port of the Python fallback in the
 * original readability tool (vowel-after-consonant transition counting).
 */
function countSyllables(word: string): number {
  const letters = word.toLowerCase().split('').filter((c) => /[a-z]/.test(c));
  if (!letters.length) return 1;

  let count = 0;
  let lastWasVowel = false;

  for (const char of letters) {
    const isVowel = 'aeiouy'.includes(char);
    if (!lastWasVowel && isVowel) count++;
    lastWasVowel = isVowel;
  }

  return Math.max(count, 1);
}

export function calculateReadability(text: string): ReadabilityResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = (nlp as any)(text);

  // Sentence count via compromise sentence splitter
  const sentences: string[] = doc.sentences().out('array');
  const nbSentences = Math.max(sentences.length, 1);

  // Word tokens — compromise strips punctuation from .terms()
  const allTerms: string[] = doc.terms().out('array');

  // Filter out pure numbers; keep anything with at least one letter
  const words = allTerms.filter(
    (t: string) => /[a-zA-Z]/.test(t) && !/^\d+(\.\d+)?$/.test(t.trim())
  );

  const nbWords = words.length;

  // Syllable counts using the ported Python algorithm
  const syllableCounts = words.map((w: string) => countSyllables(w));
  const nbSyllables = syllableCounts.reduce((a: number, b: number) => a + b, 0);
  const nbComplexWords = syllableCounts.filter((s: number) => s >= 3).length;

  // Character count: letters only (matches Python: char in "abcdefghijklmnopqrstuvwxyz")
  const nbCharacters = (text.match(/[a-zA-Z]/g) ?? []).length;

  // Averages
  const avgWordsPerSent = nbWords / nbSentences;
  const avgSyllPerWord = nbWords > 0 ? nbSyllables / nbWords : 0;

  // ── Readability formulae (identical to the Python source) ────────────────
  const fleschReadingEase =
    206.835 - 1.015 * avgWordsPerSent - 84.6 * avgSyllPerWord;

  const fleschGradeLevel =
    0.39 * avgWordsPerSent + 11.8 * avgSyllPerWord - 15.59;

  const gunningFog =
    nbWords > 0
      ? 0.4 * (avgWordsPerSent + 100 * (nbComplexWords / nbWords))
      : 0;

  const smog =
    nbSentences > 0
      ? 1.043 * Math.sqrt(30 * (nbComplexWords / nbSentences)) + 3.1291
      : 0;

  const colemanLiau =
    nbWords > 0
      ? 5.89 * (nbCharacters / nbWords) -
        0.3 * (nbSentences / nbWords) -
        15.8
      : 0;

  const ari =
    nbWords > 0
      ? 4.71 * (nbCharacters / nbWords) + 0.5 * avgWordsPerSent - 21.43
      : 0;

  const pctComplexWords = nbWords > 0 ? (nbComplexWords / nbWords) * 100 : 0;

  return {
    indices: {
      fleschReadingEase,
      fleschGradeLevel,
      gunningFog,
      smog,
      colemanLiau,
      ari,
    },
    stats: {
      nbSentences,
      nbWords,
      nbSyllables,
      nbComplexWords,
      pctComplexWords,
      avgWordsPerSent,
      avgSyllPerWord,
    },
  };
}
