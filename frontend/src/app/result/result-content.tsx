'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useSimulationStore } from '@/stores/simulation-store';
import * as api from '@/services/api';
import ResultCard from '@/components/ResultCard';
import type { GroupResult } from '@/types/simulation';

export default function ResultContent() {
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

  const hasFetched = useRef(false);
  useEffect(() => {
    if (storeResults.length > 0 || hasFetched.current) return;
    if (!simulationId) {
      router.replace('/');
      return;
    }
    hasFetched.current = true;

    let cancelled = false;
    api
      .getSimulationResult(simulationId)
      .then((data) => {
        if (!cancelled) setResults(data.results);
      })
      .catch(() => {
        if (!cancelled) setError('无法加载结果数据');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
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
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: 'var(--rs-black)' }}
      >
        <p
          style={{
            fontFamily: 'var(--rs-font-mono)',
            color: 'var(--rs-gray)',
            letterSpacing: '3px',
            animation: 'pulse 2s ease-in-out infinite',
          }}
        >
          LOADING...
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-6"
        style={{ backgroundColor: 'var(--rs-black)' }}
      >
        <p
          className="text-sm"
          style={{
            fontFamily: 'var(--rs-font-mono)',
            color: 'var(--rs-gray-light)',
          }}
        >
          {error}
        </p>
        <button
          type="button"
          onClick={handleBackHome}
          className="cursor-pointer px-6 py-3 transition-all duration-200"
          style={{
            fontFamily: 'var(--rs-font-display)',
            backgroundColor: 'transparent',
            color: 'var(--rs-white)',
            border: '1px solid var(--rs-white)',
            borderRadius: '0px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--rs-white)';
            e.currentTarget.style.color = 'var(--rs-black)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--rs-white)';
          }}
        >
          返回首页
        </button>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen px-4 py-12"
      style={{ backgroundColor: 'var(--rs-black)' }}
    >
      <div className="mx-auto max-w-5xl">
        {/* Title */}
        <h1
          className="mb-2 text-center"
          style={{
            fontFamily: 'var(--rs-font-display)',
            fontWeight: 700,
            fontSize: '32px',
            letterSpacing: '6px',
            color: 'var(--rs-white)',
          }}
        >
          HinH
        </h1>
        <p
          className="mb-8 text-center"
          style={{
            fontFamily: 'var(--rs-font-mono)',
            fontSize: '12px',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            color: 'var(--rs-gray)',
          }}
        >
          最终排名
        </p>

        {/* Divider */}
        <div
          className="mx-auto mb-10 w-full max-w-md"
          style={{
            height: '1px',
            backgroundColor: 'var(--rs-gray-dark)',
          }}
        />

        {/* Results list */}
        {sortedResults.length === 0 ? (
          <p
            className="text-center text-sm"
            style={{
              fontFamily: 'var(--rs-font-mono)',
              color: 'var(--rs-gray)',
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

        {/* Divider */}
        <div
          className="mx-auto mt-10 mb-8 w-full max-w-md"
          style={{
            height: '1px',
            backgroundColor: 'var(--rs-gray-dark)',
          }}
        />

        {/* Back to home button */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleBackHome}
            className="flex cursor-pointer items-center gap-2 px-8 py-3 transition-all duration-200"
            style={{
              fontFamily: 'var(--rs-font-display)',
              fontSize: '12px',
              backgroundColor: 'transparent',
              color: 'var(--rs-white)',
              border: '1px solid var(--rs-white)',
              borderRadius: '0px',
              letterSpacing: '3px',
              textTransform: 'uppercase',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--rs-white)';
              e.currentTarget.style.color = 'var(--rs-black)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--rs-white)';
            }}
          >
            <ArrowLeft size={14} />
            返回首页
          </button>
        </div>
      </div>
    </div>
  );
}
