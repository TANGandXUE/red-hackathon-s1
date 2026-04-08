'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Award } from 'lucide-react';
import type { GroupResult } from '@/types/simulation';
import BPDocument from './BPDocument';

interface ResultCardProps {
  result: GroupResult;
  rank: number;
}

const RANK_COLORS: Record<number, { accent: string; bg: string; label: string }> = {
  1: { accent: '#FFD700', bg: 'rgba(255, 215, 0, 0.08)', label: '1st' },
  2: { accent: '#C0C0C0', bg: 'rgba(192, 192, 192, 0.06)', label: '2nd' },
  3: { accent: '#CD7F32', bg: 'rgba(205, 127, 50, 0.06)', label: '3rd' },
};

const DIMENSION_LABELS: { key: string; label: string }[] = [
  { key: 'innovation', label: '创新' },
  { key: 'presentation', label: '讲述' },
  { key: 'completeness', label: '完成' },
  { key: 'businessPotential', label: '商业' },
  { key: 'techDifficulty', label: '技术' },
];

function getScoreColor(score: number): string {
  if (score >= 8) return '#22c55e';
  if (score >= 5) return '#eab308';
  return '#ef4444';
}

export default function ResultCard({ result, rank }: ResultCardProps) {
  const [expanded, setExpanded] = useState(rank === 1);

  const rankStyle = RANK_COLORS[rank] || {
    accent: '#7C3AED',
    bg: 'rgba(124, 58, 237, 0.06)',
    label: `${rank}th`,
  };

  return (
    <div
      className="overflow-hidden transition-all duration-200"
      style={{
        backgroundColor: '#161633',
        border: `3px solid ${rankStyle.accent}`,
        boxShadow: `0 0 0 3px #0f0f23, inset 0 0 12px ${rankStyle.bg}`,
      }}
    >
      {/* Header — always visible */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full cursor-pointer items-center gap-4 px-5 py-4 text-left transition-colors duration-200"
        style={{ backgroundColor: rankStyle.bg }}
      >
        {/* Rank badge */}
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center"
          style={{
            fontFamily: 'var(--font-pixel-display)',
            fontSize: '14px',
            color: rankStyle.accent,
            border: `2px solid ${rankStyle.accent}`,
            backgroundColor: '#0f0f23',
          }}
        >
          {rank <= 3 ? (
            <Award size={20} style={{ color: rankStyle.accent }} />
          ) : (
            rank
          )}
        </div>

        {/* Project name & rank label */}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span
              className="text-xs"
              style={{
                fontFamily: 'var(--font-pixel-display)',
                color: rankStyle.accent,
              }}
            >
              {`第${rank}名`}
            </span>
            <span
              className="truncate text-lg"
              style={{
                fontFamily: 'var(--font-pixel-body)',
                color: '#E2E8F0',
              }}
            >
              {result.bpDocument.projectName || `小组 ${result.groupId}`}
            </span>
          </div>
        </div>

        {/* Total score */}
        <div
          className="flex-shrink-0 text-right"
          style={{
            fontFamily: 'var(--font-pixel-display)',
            fontSize: '14px',
            color: rankStyle.accent,
          }}
        >
          {result.totalScore.toFixed(1)}
        </div>

        {/* Expand toggle */}
        <div style={{ color: '#64748b' }} className="flex-shrink-0">
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>

      {/* Expandable content — grid-template-rows transition */}
      <div
        className="transition-[grid-template-rows] duration-200"
        style={{
          display: 'grid',
          gridTemplateRows: expanded ? '1fr' : '0fr',
        }}
      >
        <div className="overflow-hidden">
          <div className="space-y-4 px-5 py-4">
            {/* BP Document */}
            <div>
              <h3
                className="mb-2 text-xs"
                style={{
                  fontFamily: 'var(--font-pixel-display)',
                  color: '#A78BFA',
                }}
              >
                BP 文档
              </h3>
              <BPDocument bp={result.bpDocument} />
            </div>

            {/* Judge scores */}
            <div>
              <h3
                className="mb-3 text-xs"
                style={{
                  fontFamily: 'var(--font-pixel-display)',
                  color: '#A78BFA',
                }}
              >
                评委评分
              </h3>

              <div className="space-y-3">
                {result.scores.map((judge) => (
                  <div
                    key={judge.judgeId}
                    className="px-4 py-3"
                    style={{
                      backgroundColor: '#12122a',
                      border: '2px solid #2a2a4a',
                    }}
                  >
                    {/* Judge name */}
                    <div
                      className="mb-2 text-sm"
                      style={{
                        fontFamily: 'var(--font-pixel-body)',
                        color: '#F43F5E',
                      }}
                    >
                      {judge.judgeName}
                    </div>

                    {/* Dimension scores row */}
                    <div className="mb-3 flex flex-wrap gap-2">
                      {DIMENSION_LABELS.map((dim) => {
                        const score = judge[
                          dim.key as keyof typeof judge
                        ] as number;
                        return (
                          <div
                            key={dim.key}
                            className="flex items-center gap-1"
                          >
                            <span
                              className="text-xs"
                              style={{
                                fontFamily: 'var(--font-pixel-body)',
                                color: '#94a3b8',
                              }}
                            >
                              {dim.label}
                            </span>
                            <span
                              className="inline-flex h-6 w-6 items-center justify-center text-xs font-bold"
                              style={{
                                fontFamily: 'var(--font-pixel-body)',
                                backgroundColor: '#0f0f23',
                                color: getScoreColor(score),
                                border: `1px solid ${getScoreColor(score)}`,
                              }}
                            >
                              {score}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Comment */}
                    {judge.comment && (
                      <p
                        className="mb-2 text-base leading-relaxed whitespace-pre-wrap"
                        style={{
                          fontFamily: 'var(--font-pixel-body)',
                          color: '#cbd5e1',
                        }}
                      >
                        {judge.comment}
                      </p>
                    )}

                    {/* Suggestion */}
                    {judge.suggestion && (
                      <p
                        className="text-base leading-relaxed whitespace-pre-wrap"
                        style={{
                          fontFamily: 'var(--font-pixel-body)',
                          color: '#A78BFA',
                          borderLeft: '2px solid #7C3AED',
                          paddingLeft: '12px',
                        }}
                      >
                        {judge.suggestion}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
