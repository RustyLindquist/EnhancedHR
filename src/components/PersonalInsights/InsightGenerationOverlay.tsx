'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, Check } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface InsightGenerationOverlayProps {
  isGenerating: boolean;
  compact?: boolean;
  sourceCounts?: {
    conversations?: number;
    courses?: number;
    contextItems?: number;
    notes?: number;
    aiInteractions?: number;
  };
}

// ── Step Definitions ─────────────────────────────────────────────────────────

interface StepDef {
  baseLabel: string;
  sourceKey?: keyof NonNullable<InsightGenerationOverlayProps['sourceCounts']>;
  labelWithCount: (count: number) => string;
}

const STEPS: StepDef[] = [
  {
    baseLabel: 'Reviewing conversations',
    sourceKey: 'conversations',
    labelWithCount: (n) => `Reviewing ${n} conversations`,
  },
  {
    baseLabel: 'Analyzing courses and progress',
    sourceKey: 'courses',
    labelWithCount: (n) => `Analyzing ${n} courses in progress`,
  },
  {
    baseLabel: 'Examining personal context',
    sourceKey: 'contextItems',
    labelWithCount: (n) => `Examining ${n} context items`,
  },
  {
    baseLabel: 'Identifying patterns and connections',
    sourceKey: undefined,
    labelWithCount: () => 'Identifying patterns and connections',
  },
  {
    baseLabel: 'Generating insights',
    sourceKey: undefined,
    labelWithCount: () => 'Generating insights',
  },
];

// ── Orbital Dots ─────────────────────────────────────────────────────────────

const ORBITAL_DOTS = [0, 1, 2, 3, 4, 5];

function OrbitalDots() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {ORBITAL_DOTS.map((i) => (
        <div
          key={i}
          className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full animate-insight-orbit"
          style={{
            animationDuration: `${3 + i * 0.4}s`,
            animationDelay: `${i * -0.5}s`,
            background: i % 2 === 0 ? 'rgba(168, 85, 247, 0.6)' : 'rgba(139, 92, 246, 0.4)',
          }}
        />
      ))}
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

const InsightGenerationOverlay: React.FC<InsightGenerationOverlayProps> = ({
  isGenerating,
  compact = false,
  sourceCounts,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isDone, setIsDone] = useState(false);

  // ── Step advancement timer ─────────────────────────────────────────────

  useEffect(() => {
    if (!isGenerating) return;

    setCurrentStep(0);
    setIsDone(false);

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= STEPS.length - 1) return prev;
        return prev + 1;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isGenerating]);

  // ── Completion handler ─────────────────────────────────────────────────

  useEffect(() => {
    if (!isGenerating && currentStep > 0) {
      setCurrentStep(STEPS.length);
      const doneTimer = setTimeout(() => setIsDone(true), 300);
      return () => clearTimeout(doneTimer);
    }
  }, [isGenerating, currentStep]);

  // ── Step label builder ─────────────────────────────────────────────────

  const getStepLabel = useCallback(
    (step: StepDef): string => {
      if (step.sourceKey && sourceCounts?.[step.sourceKey]) {
        return step.labelWithCount(sourceCounts[step.sourceKey]!);
      }
      return step.baseLabel;
    },
    [sourceCounts]
  );

  // ── Progress calculation ───────────────────────────────────────────────

  const progressPercent = isDone
    ? 100
    : Math.min(Math.round((currentStep / STEPS.length) * 100), 95);

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div
      className={`bg-white/[0.02] border border-white/[0.06] rounded-2xl flex flex-col items-center justify-center animate-insight-glow ${
        compact ? 'p-8 min-h-[240px]' : 'p-12 min-h-[400px]'
      }`}
    >
      {/* Orbiting icon */}
      <div className={`relative ${compact ? 'mb-6' : 'mb-8'}`}>
        <div className="relative w-14 h-14 flex items-center justify-center">
          <OrbitalDots />
          <Sparkles
            size={compact ? 22 : 26}
            className={`text-purple-400 relative z-10 ${isDone ? '' : 'animate-pulse'}`}
          />
        </div>
      </div>

      {/* Title */}
      <h2
        className={`font-bold text-white text-center ${
          compact ? 'text-base mb-1' : 'text-xl mb-1'
        }`}
      >
        {isDone ? 'Insights Ready!' : 'Prometheus is generating insights'}
      </h2>
      {!isDone && (
        <p
          className={`text-slate-500 text-center ${
            compact ? 'text-xs mb-5' : 'text-sm mb-8'
          }`}
        >
          based on your platform activity
        </p>
      )}

      {/* Steps checklist — only in full mode */}
      {!compact && (
        <div className="w-full max-w-md space-y-4 mb-10">
          {STEPS.map((step, i) => {
            const isCompleted = i < currentStep;
            const isCurrent = i === currentStep && !isDone;
            const isPending = i > currentStep && !isDone;

            return (
              <div
                key={i}
                className={`flex items-center gap-3 transition-all duration-300 ${
                  isPending ? 'opacity-40' : 'opacity-100'
                }`}
              >
                {isCompleted || isDone ? (
                  <Check size={16} className="text-emerald-400 shrink-0" />
                ) : isCurrent ? (
                  <span className="inline-block w-4 h-4 shrink-0 flex items-center justify-center">
                    <span className="block w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
                  </span>
                ) : (
                  <span className="inline-block w-4 h-4 shrink-0 flex items-center justify-center">
                    <span className="block w-2.5 h-2.5 rounded-full border border-slate-600" />
                  </span>
                )}

                <span
                  className={`text-sm ${
                    isCompleted || isDone
                      ? 'text-emerald-400'
                      : isCurrent
                      ? 'text-purple-400'
                      : 'text-slate-600'
                  }`}
                >
                  {getStepLabel(step)}
                  {isCurrent && '...'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Progress bar */}
      <div className={`w-full ${compact ? 'max-w-xs' : 'max-w-md'}`}>
        <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              isDone ? 'bg-emerald-500' : 'bg-gradient-to-r from-purple-600 via-purple-400 to-violet-400'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {!compact && (
          <p className="text-xs text-slate-500 text-right mt-2">{progressPercent}%</p>
        )}
      </div>

      {/* Done flash */}
      {isDone && (
        <div className="mt-4 flex items-center gap-2 text-emerald-400 animate-pulse">
          <Check size={18} />
          <span className="text-sm font-medium">Done!</span>
        </div>
      )}
    </div>
  );
};

export default InsightGenerationOverlay;
