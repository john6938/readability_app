import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export interface MetricConfig {
  key: string;
  label: string;
  value: number;
  higherIsBetter: boolean;
  description: string;
  formula: string;
  interpretations: { max: number; label: string }[];
}

function getInterpretation(
  value: number,
  interpretations: MetricConfig['interpretations'],
  higherIsBetter: boolean
): { label: string; colorClass: string; borderColor: string } {
  // For Flesch Reading Ease: higher = better (easier)
  // For grade-level indices: lower = easier
  const easeColors: Record<string, { colorClass: string; borderColor: string }> = {
    'Very Easy':       { colorClass: 'bg-green-50',  borderColor: 'border-green-400' },
    'Easy':            { colorClass: 'bg-green-50',  borderColor: 'border-green-400' },
    'Fairly Easy':     { colorClass: 'bg-emerald-50', borderColor: 'border-emerald-400' },
    'Standard':        { colorClass: 'bg-yellow-50', borderColor: 'border-yellow-400' },
    'Fairly Difficult':{ colorClass: 'bg-amber-50',  borderColor: 'border-amber-400' },
    'Difficult':       { colorClass: 'bg-orange-50', borderColor: 'border-orange-400' },
    'Very Confusing':  { colorClass: 'bg-red-50',    borderColor: 'border-red-400' },
    'Elementary':      { colorClass: 'bg-green-50',  borderColor: 'border-green-400' },
    'Middle School':   { colorClass: 'bg-emerald-50', borderColor: 'border-emerald-400' },
    'High School':     { colorClass: 'bg-yellow-50', borderColor: 'border-yellow-400' },
    'College':         { colorClass: 'bg-amber-50',  borderColor: 'border-amber-400' },
    'Post-Graduate':   { colorClass: 'bg-red-50',    borderColor: 'border-red-400' },
  };

  let matched = interpretations[interpretations.length - 1].label;

  if (higherIsBetter) {
    // Iterate from easiest (highest max) down — find first band where value >= lower bound
    for (const interp of [...interpretations].reverse()) {
      if (value <= interp.max) matched = interp.label;
    }
  } else {
    for (const interp of interpretations) {
      if (value <= interp.max) {
        matched = interp.label;
        break;
      }
    }
  }

  return {
    label: matched,
    ...(easeColors[matched] ?? { colorClass: 'bg-gray-50', borderColor: 'border-gray-300' }),
  };
}

export function MetricCard({ metric }: { metric: MetricConfig }) {
  const [expanded, setExpanded] = useState(false);
  const interp = getInterpretation(
    metric.value,
    metric.interpretations,
    metric.higherIsBetter
  );

  return (
    <div
      className={`rounded-xl border-l-4 ${interp.borderColor} ${interp.colorClass} p-4 flex flex-col gap-2`}
    >
      {/* Title + score */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide leading-tight">
          {metric.label}
        </p>
        <span className="text-2xl font-bold text-gray-900 tabular-nums shrink-0">
          {metric.value.toFixed(1)}
        </span>
      </div>

      {/* Interpretation label */}
      <p className="text-sm font-semibold text-gray-700">{interp.label}</p>

      {/* Expandable explanation */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition w-fit"
        aria-expanded={expanded}
      >
        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        {expanded ? 'Hide explanation' : 'What is this?'}
      </button>

      {expanded && (
        <div className="text-xs text-gray-600 space-y-1.5 border-t border-gray-200 pt-2 mt-1">
          <p>{metric.description}</p>
          <p className="font-mono text-gray-500 bg-white/70 rounded px-2 py-1 text-[11px]">
            {metric.formula}
          </p>
        </div>
      )}
    </div>
  );
}
