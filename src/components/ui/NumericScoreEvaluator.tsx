"use client";

import { useState } from "react";

interface NumericScoreEvaluatorProps {
  title: string;
  maxScore: number;
  weight: number;
  initialValue?: number;
  onChange?: (value: number) => void;
}

export function NumericScoreEvaluator({
  title,
  maxScore,
  weight,
  initialValue = 0,
  onChange,
}: NumericScoreEvaluatorProps) {
  const [value, setValue] = useState(initialValue);

  const updateValue = (newValue: number) => {
    const clamped = Math.max(0, Math.min(newValue, maxScore));
    setValue(clamped);
    onChange?.(clamped);
  };

  return (
    <div className="flex items-center justify-between p-4 bg-[var(--bg-panel)] border-l-2 border-[var(--accent-judge)]">
      <div>
        <h4 className="text-sm font-mono font-bold text-[var(--text-primary)]">{title}</h4>
        <p className="text-xs text-[var(--text-muted)]">
          Max Score: {maxScore} | Weight: {weight}%
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => updateValue(value - 0.5)}
          className="w-8 h-8 bg-[var(--bg-input)] hover:bg-[var(--border-muted)] text-[var(--accent-judge)] font-mono font-bold flex items-center justify-center"
        >
          -
        </button>
        <input
          type="number"
          min="0"
          max={maxScore}
          step="0.5"
          className="w-16 text-center py-1.5 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--accent-judge)] font-mono font-bold text-lg focus:outline-none focus:border-[var(--accent-judge)]"
          value={value}
          onChange={(e) => updateValue(parseFloat(e.target.value) || 0)}
        />
        <button
          type="button"
          onClick={() => updateValue(value + 0.5)}
          className="w-8 h-8 bg-[var(--bg-input)] hover:bg-[var(--border-muted)] text-[var(--accent-judge)] font-mono font-bold flex items-center justify-center"
        >
          +
        </button>
      </div>
    </div>
  );
}
