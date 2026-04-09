'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { GroupResult } from '@/types/simulation';
import BPDocument from './BPDocument';

interface ResultCardProps {
  result: GroupResult;
  rank: number;
}

function getRankBorderColor(rank: number): string {
  if (rank === 1) return 'var(--rs-white)';
  if (rank <= 3) return 'var(--rs-gray)';
  return 'var(--rs-gray-dark)';
}

function getRankLabel(rank: number): string {
  if (rank === 1) return '1ST';
  if (rank === 2) return '2ND';
  if (rank === 3) return '3RD';
  return `${rank}TH`;
}

const DIMENSION_LABELS: { key: string; label: string }[] = [
  { key: 'innovation', label: '创新' },
  { key: 'presentation', label: '讲述' },
  { key: 'completeness', label: '完成' },
  { key: 'businessPotential', label: '商业' },
  { key: 'techDifficulty', label: '技术' },
];

export default function ResultCard({ result, rank }: ResultCardProps) {
  const [expanded, setExpanded] = useState(rank === 1);

  const borderColor = getRankBorderColor(rank);

  return (
    <div
      className="overflow-hidden transition-all duration-200"
      style={{
        backgroundColor: 'var(--rs-charcoal)',
        border: `1px solid ${borderColor}`,
        borderRadius: '0px',
      }}
    >
      {/* Header — always visible */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full cursor-pointer items-center gap-4 px-5 py-4 text-left transition-colors duration-200"
        style={{ backgroundColor: 'transparent' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--rs-gray-dark)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        {/* Rank badge */}
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center"
          style={{
            fontFamily: 'var(--rs-font-mono)',
            fontSize: '12px',
            fontWeight: 700,
            color: rank === 1 ? 'var(--rs-black)' : 'var(--rs-white)',
            backgroundColor: rank === 1 ? 'var(--rs-white)' : 'transparent',
            border: `1px solid ${borderColor}`,
            letterSpacing: '1px',
            borderRadius: '0px',
          }}
        >
          {getRankLabel(rank)}
        </div>

        {/* Project name & rank label */}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span
              className="text-xs"
              style={{
                fontFamily: 'var(--rs-font-mono)',
                color: 'var(--rs-gray)',
                letterSpacing: '1px',
              }}
            >
              {`第${rank}名`}
            </span>
            <span
              className="truncate text-lg"
              style={{
                fontFamily: 'var(--rs-font-display)',
                color: 'var(--rs-white)',
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
            fontFamily: 'var(--rs-font-mono)',
            fontSize: '16px',
            fontWeight: 700,
            color: 'var(--rs-white)',
          }}
        >
          {result.totalScore.toFixed(1)}
        </div>

        {/* Expand toggle */}
        <div style={{ color: 'var(--rs-gray)' }} className="flex-shrink-0">
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>

      {/* Expandable content */}
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
                className="mb-2 text-xs uppercase"
                style={{
                  fontFamily: 'var(--rs-font-display)',
                  color: 'var(--rs-gray)',
                  letterSpacing: '2px',
                }}
              >
                BP 文档
              </h3>
              <BPDocument bp={result.bpDocument} />
            </div>

            {/* Judge scores */}
            <div>
              <h3
                className="mb-3 text-xs uppercase"
                style={{
                  fontFamily: 'var(--rs-font-display)',
                  color: 'var(--rs-gray)',
                  letterSpacing: '2px',
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
                      backgroundColor: 'var(--rs-black)',
                      border: '1px solid var(--rs-gray-dark)',
                      borderRadius: '0px',
                    }}
                  >
                    {/* Judge name */}
                    <div
                      className="mb-2 text-sm"
                      style={{
                        fontFamily: 'var(--rs-font-display)',
                        color: 'var(--rs-white)',
                        letterSpacing: '1px',
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
                                fontFamily: 'var(--rs-font-mono)',
                                color: 'var(--rs-gray)',
                              }}
                            >
                              {dim.label}
                            </span>
                            <span
                              className="inline-flex h-6 w-6 items-center justify-center text-xs font-bold"
                              style={{
                                fontFamily: 'var(--rs-font-mono)',
                                backgroundColor: 'var(--rs-gray-dark)',
                                color: 'var(--rs-white)',
                                border: '1px solid var(--rs-gray-dark)',
                                borderRadius: '0px',
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
                        className="mb-2 text-sm leading-relaxed whitespace-pre-wrap"
                        style={{
                          fontFamily: 'var(--rs-font-mono)',
                          color: 'var(--rs-gray-light)',
                        }}
                      >
                        {judge.comment}
                      </p>
                    )}

                    {/* Suggestion */}
                    {judge.suggestion && (
                      <p
                        className="text-sm leading-relaxed whitespace-pre-wrap"
                        style={{
                          fontFamily: 'var(--rs-font-mono)',
                          color: 'var(--rs-gray)',
                          borderLeft: '2px solid var(--rs-gray-dark)',
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
