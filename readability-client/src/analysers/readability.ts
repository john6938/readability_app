import nlp from 'compromise';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import syllables from 'compromise-syllables';

// Register the syllables plugin once
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(nlp as any).plugin(syllables);

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

interface SyllableEntry {
  text: string;
  syllables: string[];
}

export function calculateReadability(text: string): ReadabilityResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = (nlp as any)(text);

  // Sentence count — compromise sentence splitter
  const sentences: string[] = doc.sentences().out('array');
  const nbSentences = Math.max(sentences.length, 1);

  // Syllable data for all terms in the document
  const syllableData: SyllableEntry[] = doc.syllables();

  // Filter to real words: must contain at least one letter, not purely numeric
  const wordData = syllableData.filter(
    (item) => /[a-zA-Z]/.test(item.text) && !/^\d+(\.\d+)?$/.test(item.text.trim())
  );

  const nbWords = wordData.length;

  const syllableCounts = wordData.map((item) =>
    Math.max(item.syllables ? item.syllables.length : 1, 1)
  );

  const nbSyllables = syllableCounts.reduce((a, b) => a + b, 0);
  const nbComplexWords = syllableCounts.filter((s) => s >= 3).length;

  // Character count: lowercase + uppercase letters only (matches Python logic)
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
