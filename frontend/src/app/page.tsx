'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, Swords } from 'lucide-react';
import { useSimulationStore } from '@/stores/simulation-store';

const MAX_IDEAS = 4;

const PLACEHOLDERS = [
  '输入你的第一个想法...',
  '输入你的第二个想法...',
  '输入你的第三个想法...',
  '输入你的第四个想法...',
];

export default function Home() {
  const router = useRouter();
  const startSimulation = useSimulationStore((s) => s.startSimulation);

  const nextId = useRef(1);
  const [ideas, setIdeas] = useState<{ id: number; text: string }[]>([{ id: 0, text: '' }]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAddMore = ideas.length < MAX_IDEAS;
  const canRemove = ideas.length > 1;

  function addIdea() {
    if (canAddMore) {
      setIdeas((prev) => [...prev, { id: nextId.current++, text: '' }]);
    }
  }

  function removeIdea(id: number) {
    if (canRemove) {
      setIdeas((prev) => prev.filter((idea) => idea.id !== id));
    }
  }

  function updateIdea(id: number, value: string) {
    setIdeas((prev) => prev.map((idea) => (idea.id === id ? { ...idea, text: value } : idea)));
  }

  async function handleSubmit() {
    const nonEmpty = ideas.map((i) => i.text.trim()).filter(Boolean);
    if (nonEmpty.length === 0) {
      setError('请至少输入一个想法');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await startSimulation(nonEmpty);
      router.push('/simulation');
    } catch {
      setError('启动模拟失败，请重试');
      setIsLoading(false);
    }
  }

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12"
      style={{ backgroundColor: 'var(--rs-black)' }}
    >
      {/* Title */}
      <div className="mb-4 text-center">
        <h1
          style={{
            fontFamily: 'var(--rs-font-display)',
            fontWeight: 700,
            fontSize: '48px',
            letterSpacing: '8px',
            color: 'var(--rs-white)',
          }}
        >
          HinH
        </h1>
      </div>

      {/* Subtitle */}
      <p
        className="mb-12 max-w-lg text-center"
        style={{
          fontFamily: 'var(--rs-font-mono)',
          fontSize: '12px',
          letterSpacing: '3px',
          textTransform: 'uppercase',
          color: 'var(--rs-gray)',
        }}
      >
        AI-DRIVEN HACKATHON SIMULATION PLATFORM
      </p>

      {/* Divider */}
      <div
        className="mb-8 w-full max-w-xl"
        style={{
          height: '1px',
          backgroundColor: 'var(--rs-gray-dark)',
        }}
      />

      {/* Idea input section */}
      <div className="w-full max-w-xl space-y-4">
        {ideas.map((idea, index) => (
          <div key={idea.id} className="relative">
            {/* Numbered badge */}
            <span
              className="absolute left-3 top-3 flex h-5 w-5 items-center justify-center text-xs"
              style={{
                fontFamily: 'var(--rs-font-mono)',
                backgroundColor: 'var(--rs-gray-dark)',
                color: 'var(--rs-gray-light)',
                fontSize: '0.65rem',
                borderRadius: '0px',
              }}
            >
              {index + 1}
            </span>
            <textarea
              value={idea.text}
              onChange={(e) => updateIdea(idea.id, e.target.value)}
              placeholder={PLACEHOLDERS[index]}
              rows={2}
              className="w-full resize-none pl-10 pr-8 py-3 text-sm transition-all duration-200"
              style={{
                fontFamily: 'var(--rs-font-mono)',
                backgroundColor: 'var(--rs-charcoal)',
                border: '1px solid var(--rs-gray-dark)',
                color: 'var(--rs-white)',
                borderRadius: '0px',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--rs-white)';
                e.currentTarget.style.boxShadow = '0 0 10px rgba(240,237,230,0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--rs-gray-dark)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            {canRemove && (
              <button
                type="button"
                onClick={() => removeIdea(idea.id)}
                className="absolute right-2 top-2 cursor-pointer p-1 transition-colors duration-200"
                style={{ color: 'var(--rs-gray)' }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = 'var(--rs-white)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = 'var(--rs-gray)')
                }
                aria-label="移除这个想法"
              >
                <X size={18} />
              </button>
            )}
          </div>
        ))}

        {/* Add more button */}
        {canAddMore && (
          <button
            type="button"
            onClick={addIdea}
            className="flex w-full cursor-pointer items-center justify-center gap-2 px-4 py-3 text-sm transition-all duration-200"
            style={{
              fontFamily: 'var(--rs-font-mono)',
              backgroundColor: 'transparent',
              color: 'var(--rs-gray)',
              border: '1px solid var(--rs-gray-dark)',
              borderRadius: '0px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--rs-white)';
              e.currentTarget.style.color = 'var(--rs-white)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--rs-gray-dark)';
              e.currentTarget.style.color = 'var(--rs-gray)';
            }}
          >
            <Plus size={18} />
            添加更多想法
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p
          className="mt-4 text-sm"
          style={{
            fontFamily: 'var(--rs-font-mono)',
            color: 'var(--rs-gray-light)',
          }}
        >
          {error}
        </p>
      )}

      {/* Divider */}
      <div
        className="mt-8 mb-8 w-full max-w-xl"
        style={{
          height: '1px',
          backgroundColor: 'var(--rs-gray-dark)',
        }}
      />

      {/* Start button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isLoading}
        className="cursor-pointer px-10 py-4 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
        style={{
          fontFamily: 'var(--rs-font-display)',
          fontSize: '14px',
          backgroundColor: 'transparent',
          color: 'var(--rs-white)',
          border: '1px solid var(--rs-white)',
          borderRadius: '0px',
          textTransform: 'uppercase',
          letterSpacing: '3px',
        }}
        onMouseEnter={(e) => {
          if (!isLoading) {
            e.currentTarget.style.backgroundColor = 'var(--rs-white)';
            e.currentTarget.style.color = 'var(--rs-black)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = 'var(--rs-white)';
        }}
      >
        {isLoading ? (
          <span
            className="flex items-center gap-3"
            style={{
              fontFamily: 'var(--rs-font-mono)',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          >
            INITIALIZING...
          </span>
        ) : (
          <span className="flex items-center gap-3">
            <Swords size={18} />
            开始模拟
          </span>
        )}
      </button>
    </div>
  );
}
