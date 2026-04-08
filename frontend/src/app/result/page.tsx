'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Trophy, ArrowLeft, Loader2 } from 'lucide-react';
import { useSimulationStore } from '@/stores/simulation-store';
import * as api from '@/services/api';
import ResultCard from '@/components/ResultCard';
import type { GroupResult } from '@/types/simulation';

function ResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const storeResults = useSimulationStore((s) => s.results);
  const storeSimulationId = useSimulationStore((s) => s.simulationId);
  const setResults = useSimulationStore((s) => s.setResults);
  const reset = useSimulationStore((s) => s.reset);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine the simulation ID from URL query or store
  const simulationId = searchParams.get('id') || storeSimulationId;

  useEffect(() => {
    // If we already have results, no need to fetch
    if (storeResults.length > 0) return;

    // If no simulation ID at all, redirect home
    if (!simulationId) {
      router.replace('/');
      return;
    }

    // Fetch results from API
    setLoading(true);
    api
      .getSimulationResult(simulationId)
      .then((data) => {
        setResults(data.results);
      })
      .catch(() => {
        setError('无法加载结果数据');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [simulationId, storeResults.length, setResults, router]);

  // Sort results by total score descending
  const sortedResults: GroupResult[] = useMemo(
    () => [...storeResults].sort((a, b) => b.totalScore - a.totalScore),
    [storeResults],
  );

  function handleBackHome() {
    reset();
    router.push('/');
  }

  // Loading state
  if (loading) {
    return (
      <div
        className="crt-overlay pixel-grid-bg flex min-h-screen items-center justify-center"
        style={{ backgroundColor: '#0F0F23' }}
      >
        <div className="flex flex-col items-center gap-4">
          <Loader2
            size={32}
            className="animate-spin"
            style={{ color: '#A78BFA' }}
          />
          <p
            className="text-lg"
            style={{
              fontFamily: 'var(--font-pixel-body)',
              color: '#E2E8F0',
            }}
          >
            加载结果中...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className="crt-overlay pixel-grid-bg flex min-h-screen flex-col items-center justify-center gap-6"
        style={{ backgroundColor: '#0F0F23' }}
      >
        <p
          className="text-lg"
          style={{
            fontFamily: 'var(--font-pixel-body)',
            color: '#F43F5E',
          }}
        >
          {error}
        </p>
        <button
          type="button"
          onClick={handleBackHome}
          className="pixel-border cursor-pointer px-6 py-3 transition-all duration-200"
          style={{
            fontFamily: 'var(--font-pixel-body)',
            backgroundColor: '#1a1a35',
            color: '#A78BFA',
            borderColor: '#7C3AED',
          }}
        >
          返回首页
        </button>
      </div>
    );
  }

  return (
    <div
      className="crt-overlay pixel-grid-bg min-h-screen px-4 py-12"
      style={{ backgroundColor: '#0F0F23' }}
    >
      <div className="mx-auto max-w-3xl">
        {/* Title */}
        <div className="mb-2 flex items-center justify-center gap-3">
          <Trophy size={28} style={{ color: '#FFD700' }} />
          <h1
            className="neon-glow-purple text-center text-lg leading-relaxed sm:text-xl"
            style={{
              fontFamily: 'var(--font-pixel-display)',
              color: '#A78BFA',
            }}
          >
            HinH 黑客松
          </h1>
          <Trophy size={28} style={{ color: '#FFD700' }} />
        </div>
        <p
          className="mb-8 text-center text-2xl"
          style={{
            fontFamily: 'var(--font-pixel-body)',
            color: '#E2E8F0',
          }}
        >
          最终排名
        </p>

        {/* Decorative divider */}
        <div
          className="mx-auto mb-10 h-1 w-full max-w-md"
          style={{
            background:
              'linear-gradient(90deg, transparent, #7C3AED, #A78BFA, #7C3AED, transparent)',
          }}
        />

        {/* Results list */}
        {sortedResults.length === 0 ? (
          <p
            className="text-center text-lg"
            style={{
              fontFamily: 'var(--font-pixel-body)',
              color: '#64748b',
            }}
          >
            暂无结果数据
          </p>
        ) : (
          <div className="space-y-4">
            {sortedResults.map((result, index) => (
              <ResultCard
                key={result.groupId}
                result={result}
                rank={index + 1}
              />
            ))}
          </div>
        )}

        {/* Decorative divider */}
        <div
          className="mx-auto mt-10 mb-8 h-1 w-full max-w-md"
          style={{
            background:
              'linear-gradient(90deg, transparent, #7C3AED, #A78BFA, #7C3AED, transparent)',
          }}
        />

        {/* Back to home button */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleBackHome}
            className="pixel-border neon-box-glow flex cursor-pointer items-center gap-2 px-8 py-3 transition-all duration-200"
            style={{
              fontFamily: 'var(--font-pixel-display)',
              fontSize: '12px',
              backgroundColor: '#1a1a35',
              color: '#A78BFA',
              borderColor: '#7C3AED',
            }}
          >
            <ArrowLeft size={16} />
            返回首页
          </button>
        </div>

        {/* Bottom decorative pixel row */}
        <div className="mt-12 flex justify-center gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="h-2 w-2"
              style={{
                backgroundColor: i % 2 === 0 ? '#7C3AED' : '#A78BFA',
                opacity: 0.6,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ResultFallback() {
  return (
    <div
      className="crt-overlay pixel-grid-bg flex min-h-screen items-center justify-center"
      style={{ backgroundColor: '#0F0F23' }}
    >
      <div className="flex flex-col items-center gap-4">
        <Loader2
          size={32}
          className="animate-spin"
          style={{ color: '#A78BFA' }}
        />
        <p
          className="text-lg"
          style={{
            fontFamily: 'var(--font-pixel-body)',
            color: '#E2E8F0',
          }}
        >
          加载中...
        </p>
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<ResultFallback />}>
      <ResultContent />
    </Suspense>
  );
}
