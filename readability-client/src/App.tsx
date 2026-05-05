import { useState, type ChangeEvent } from 'react';
import { Upload } from 'lucide-react';
import tntLogoUrl from './assets/tnt-logo.svg';
import { calculateReadability, type ReadabilityResult } from './analysers/readability';
import { MetricCard, type MetricConfig } from './components/MetricCard';
import { StatsPanel } from './components/StatsPanel';
import { SAMPLE_TEXT } from './sampleText';

type Mode = 'input' | 'output';

// Metadata for each readability index
const METRIC_CONFIGS: Omit<MetricConfig, 'value'>[] = [
  {
    key: 'fleschReadingEase',
    label: 'Flesch-Kincaid Reading Ease',
    higherIsBetter: true,
    description:
      'Scores range from 0 to 100. The higher the score, the easier the text is to read. Most standard writing scores between 60–70. Academic and professional texts typically score below 50.',
    formula: '206.835 − 1.015 × (words/sentences) − 84.6 × (syllables/words)',
    interpretations: [
      { max: 30,  label: 'Very Confusing' },
      { max: 50,  label: 'Difficult' },
      { max: 60,  label: 'Fairly Difficult' },
      { max: 70,  label: 'Standard' },
      { max: 80,  label: 'Fairly Easy' },
      { max: 90,  label: 'Easy' },
      { max: Infinity, label: 'Very Easy' },
    ],
  },
  {
    key: 'fleschGradeLevel',
    label: 'Flesch-Kincaid Grade Level',
    higherIsBetter: false,
    description:
      'Estimates the US school grade level needed to understand the text. A score of 8 means a typical 8th-grade student can read it. Academic writing commonly falls between 12–16.',
    formula: '0.39 × (words/sentences) + 11.8 × (syllables/words) − 15.59',
    interpretations: [
      { max: 6,   label: 'Elementary' },
      { max: 9,   label: 'Middle School' },
      { max: 12,  label: 'High School' },
      { max: 16,  label: 'College' },
      { max: Infinity, label: 'Post-Graduate' },
    ],
  },
  {
    key: 'gunningFog',
    label: 'Gunning Fog Score',
    higherIsBetter: false,
    description:
      'Estimates the years of formal education needed to understand the text on first reading. Uses sentence length and the proportion of complex words (3+ syllables). Scores above 17 are considered unreadable by most readers.',
    formula: '0.4 × (words/sentences + 100 × complex words/words)',
    interpretations: [
      { max: 6,   label: 'Elementary' },
      { max: 9,   label: 'Middle School' },
      { max: 12,  label: 'High School' },
      { max: 16,  label: 'College' },
      { max: Infinity, label: 'Post-Graduate' },
    ],
  },
  {
    key: 'smog',
    label: 'SMOG Index',
    higherIsBetter: false,
    description:
      'The Simplified Measure of Gobbledygook (SMOG) estimates the grade level needed to understand a text, based entirely on the count of polysyllabic words. It is widely used for health and public information texts and is considered reliable for texts of 30+ sentences.',
    formula: '1.043 × √(30 × complex words / sentences) + 3.1291',
    interpretations: [
      { max: 6,   label: 'Elementary' },
      { max: 9,   label: 'Middle School' },
      { max: 12,  label: 'High School' },
      { max: 16,  label: 'College' },
      { max: Infinity, label: 'Post-Graduate' },
    ],
  },
  {
    key: 'colemanLiau',
    label: 'Coleman-Liau Index',
    higherIsBetter: false,
    description:
      'Unlike other indices, this formula uses characters per word rather than syllables — making it more robust to syllable-counting variation. It was designed for use with computerised text analysis. Scores correspond to US grade levels.',
    formula: '5.89 × (characters/words) − 0.3 × (sentences/words) − 15.8',
    interpretations: [
      { max: 6,   label: 'Elementary' },
      { max: 9,   label: 'Middle School' },
      { max: 12,  label: 'High School' },
      { max: 16,  label: 'College' },
      { max: Infinity, label: 'Post-Graduate' },
    ],
  },
  {
    key: 'ari',
    label: 'Automated Readability Index',
    higherIsBetter: false,
    description:
      'The ARI uses characters per word and words per sentence. It tends to agree closely with the Flesch-Kincaid Grade Level and was originally developed for US military technical manuals. It is well-suited to automated processing.',
    formula: '4.71 × (characters/words) + 0.5 × (words/sentences) − 21.43',
    interpretations: [
      { max: 6,   label: 'Elementary' },
      { max: 9,   label: 'Middle School' },
      { max: 12,  label: 'High School' },
      { max: 16,  label: 'College' },
      { max: Infinity, label: 'Post-Graduate' },
    ],
  },
];

const INDEX_DESCRIPTIONS: Record<string, string> = {
  'Flesch-Kincaid Reading Ease': 'Score 0–100, higher = easier',
  'Flesch-Kincaid Grade Level':  'US grade level',
  'Gunning Fog Score':           'Years of education needed',
  'SMOG Index':                  'Grade level (polysyllabic words)',
  'Coleman-Liau Index':          'Grade level (character-based)',
  'Automated Readability Index': 'Grade level (ARI)',
};

function buildMetrics(result: ReadabilityResult): MetricConfig[] {
  const valueMap: Record<string, number> = {
    fleschReadingEase: result.indices.fleschReadingEase,
    fleschGradeLevel:  result.indices.fleschGradeLevel,
    gunningFog:        result.indices.gunningFog,
    smog:              result.indices.smog,
    colemanLiau:       result.indices.colemanLiau,
    ari:               result.indices.ari,
  };
  return METRIC_CONFIGS.map((cfg) => ({ ...cfg, value: valueMap[cfg.key] }));
}

export default function App() {
  const [mode, setMode]     = useState<Mode>('input');
  const [text, setText]     = useState('');
  const [result, setResult] = useState<ReadabilityResult | null>(null);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'text/plain') return;
    const reader = new FileReader();
    reader.onload = (ev) => setText(ev.target?.result as string);
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleAnalyse = () => {
    if (!text.trim()) return;
    setResult(calculateReadability(text));
    setMode('output');
  };

  // ── Input mode ─────────────────────────────────────────────────────────────
  if (mode === 'input') {
    return (
      <div className="min-h-full flex items-start justify-center bg-gray-50 p-3 sm:p-6 overflow-y-auto">
        <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg p-5 sm:p-8 my-4">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <img src={tntLogoUrl} alt="TNT Lab" className="w-11 h-11 shrink-0" />
            <div>
              <h1 className="text-2xl font-bold leading-tight text-gray-900">
                Readability Analyser
              </h1>
              <p className="text-sm text-gray-500">
                Measure the reading level and complexity of any English text
              </p>
            </div>
          </div>

          {/* Text controls */}
          <div className="flex gap-2 flex-wrap mb-3">
            <label className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white text-sm rounded-lg cursor-pointer hover:bg-blue-600 transition">
              <Upload size={15} />
              Upload .txt
              <input
                type="file"
                accept=".txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <button
              onClick={() => setText(SAMPLE_TEXT)}
              className="px-3 py-2 bg-purple-100 text-purple-700 text-sm rounded-lg hover:bg-purple-200 transition"
            >
              Load sample
            </button>
            <button
              onClick={() => setText('')}
              className="px-3 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200 transition"
            >
              Clear
            </button>
          </div>

          {/* Textarea */}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your text here, upload a .txt file, or click 'Load sample'…"
            rows={12}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none text-base font-serif leading-relaxed"
          />

          {/* Word count hint */}
          {text.trim() && (
            <p className="text-xs text-gray-400 mt-1 text-right">
              {text.trim().split(/\s+/).length} words
            </p>
          )}

          {/* Analyse button */}
          <button
            onClick={handleAnalyse}
            disabled={!text.trim()}
            className="mt-3 w-full py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition text-base"
          >
            Analyse Text
          </button>

          {/* What will be calculated */}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Indices that will be calculated
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
              {METRIC_CONFIGS.map((cfg) => (
                <div
                  key={cfg.key}
                  className="flex items-start gap-2 pl-2 py-1 border-l-2 border-blue-200"
                >
                  <div>
                    <p className="font-semibold text-gray-800">{cfg.label}</p>
                    <p className="text-gray-400">{INDEX_DESCRIPTIONS[cfg.label]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-5 pt-4 border-t border-gray-100 text-center text-xs text-gray-400">
            John Blake, Aston University. Version 2.0.
          </div>
        </div>
      </div>
    );
  }

  // ── Output mode ────────────────────────────────────────────────────────────
  const metrics = result ? buildMetrics(result) : [];

  return (
    <div className="h-full flex flex-col bg-gray-50">

      {/* Header bar */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 shrink-0">
        <div className="flex items-center justify-between max-w-screen-xl mx-auto gap-3 flex-wrap">
          <div className="flex items-center gap-2 shrink-0">
            <img src={tntLogoUrl} alt="TNT Lab" className="w-8 h-8" />
            <span className="font-semibold text-gray-900 hidden sm:block text-sm">
              Readability Analyser
            </span>
          </div>
          <button
            onClick={() => setMode('input')}
            className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition"
          >
            Analyse another text
          </button>
        </div>
      </header>

      {/* Results */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-screen-xl mx-auto space-y-4">

          {/* Readability indices grid */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Readability Indices
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {metrics.map((m) => (
                <MetricCard key={m.key} metric={m} />
              ))}
            </div>
          </div>

          {/* Text statistics */}
          {result && <StatsPanel stats={result.stats} />}

          {/* Interpretation guide */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              How to read these results
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-green-200 shrink-0" />
                <span><strong>Green</strong> — Easy / Elementary level</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-yellow-200 shrink-0" />
                <span><strong>Yellow</strong> — Standard / High School level</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-amber-200 shrink-0" />
                <span><strong>Amber</strong> — Difficult / College level</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-red-200 shrink-0" />
                <span><strong>Red</strong> — Very difficult / Post-Graduate level</span>
              </div>
              <div className="col-span-full mt-1 text-gray-400">
                Click <em>"What is this?"</em> on any card to see the formula and an explanation of the index.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 px-4 py-2 text-center text-xs text-gray-400 shrink-0">
        John Blake, Aston University. Version 2.0.
      </footer>
    </div>
  );
}
