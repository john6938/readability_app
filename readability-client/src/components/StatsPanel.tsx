import type { TextStats } from '../analysers/readability';

interface StatRowProps {
  label: string;
  value: string;
  hint?: string;
}

function StatRow({ label, value, hint }: StatRowProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div>
        <span className="text-sm text-gray-700">{label}</span>
        {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
      </div>
      <span className="text-sm font-semibold text-gray-900 tabular-nums">{value}</span>
    </div>
  );
}

export function StatsPanel({ stats }: { stats: TextStats }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
        Text Statistics
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
        <div>
          <StatRow
            label="Sentences"
            value={stats.nbSentences.toString()}
          />
          <StatRow
            label="Words"
            value={stats.nbWords.toString()}
          />
          <StatRow
            label="Syllables"
            value={stats.nbSyllables.toString()}
          />
          <StatRow
            label="Complex words"
            value={stats.nbComplexWords.toString()}
            hint="Words with 3 or more syllables"
          />
        </div>
        <div>
          <StatRow
            label="% complex words"
            value={`${stats.pctComplexWords.toFixed(1)}%`}
          />
          <StatRow
            label="Avg words per sentence"
            value={stats.avgWordsPerSent.toFixed(1)}
          />
          <StatRow
            label="Avg syllables per word"
            value={stats.avgSyllPerWord.toFixed(2)}
          />
        </div>
      </div>
    </div>
  );
}
