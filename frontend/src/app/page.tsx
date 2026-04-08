'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, Swords, Loader2 } from 'lucide-react';
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
    <div className="crt-overlay pixel-grid-bg relative flex min-h-screen flex-col items-center justify-center px-4 py-12"
      style={{ backgroundColor: '#0F0F23' }}
    >
      {/* Title area */}
      <div className="mb-4 text-center">
        <h1
          className="neon-glow-purple text-xl leading-relaxed sm:text-2xl md:text-3xl"
          style={{
            fontFamily: 'var(--font-pixel-display)',
            color: '#A78BFA',
          }}
        >
          欢迎来到 HinH
        </h1>
      </div>

      {/* Subtitle */}
      <p
        className="mb-12 max-w-lg text-center text-xl leading-relaxed sm:text-2xl"
        style={{
          fontFamily: 'var(--font-pixel-body)',
          color: '#E2E8F0',
        }}
      >
        在像素酒馆中，让 AI 角色为你的想法而战
      </p>

      {/* Decorative top border */}
      <div
        className="mb-8 h-1 w-full max-w-xl"
        style={{
          background: 'linear-gradient(90deg, transparent, #7C3AED, #A78BFA, #7C3AED, transparent)',
        }}
      />

      {/* Idea input section */}
      <div className="w-full max-w-xl space-y-4">
        {ideas.map((idea, index) => (
          <div key={idea.id} className="relative">
            <textarea
              value={idea.text}
              onChange={(e) => updateIdea(idea.id, e.target.value)}
              placeholder={PLACEHOLDERS[index]}
              rows={2}
              className="pixel-border pixel-input neon-box-glow w-full resize-none px-4 py-3 text-lg transition-all duration-200"
              style={{
                fontFamily: 'var(--font-pixel-body)',
                backgroundColor: '#1a1a35',
                color: '#E2E8F0',
                borderColor: '#7C3AED',
              }}
            />
            {canRemove && (
              <button
                type="button"
                onClick={() => removeIdea(idea.id)}
                className="absolute right-2 top-2 cursor-pointer p-1 transition-colors duration-200"
                style={{ color: '#64748b' }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = '#F43F5E')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = '#64748b')
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
            className="pixel-border neon-box-glow flex w-full cursor-pointer items-center justify-center gap-2 px-4 py-3 text-lg transition-all duration-200"
            style={{
              fontFamily: 'var(--font-pixel-body)',
              backgroundColor: '#1a1a35',
              color: '#A78BFA',
              borderColor: '#7C3AED',
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
          className="mt-4 text-lg"
          style={{
            fontFamily: 'var(--font-pixel-body)',
            color: '#F43F5E',
          }}
        >
          {error}
        </p>
      )}

      {/* Decorative bottom border */}
      <div
        className="mt-8 mb-8 h-1 w-full max-w-xl"
        style={{
          background: 'linear-gradient(90deg, transparent, #7C3AED, #A78BFA, #7C3AED, transparent)',
        }}
      />

      {/* Start button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isLoading}
        className="pixel-border-rose cursor-pointer px-10 py-4 text-lg transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
        style={{
          fontFamily: 'var(--font-pixel-display)',
          backgroundColor: '#F43F5E',
          color: '#FFFFFF',
          borderColor: '#F43F5E',
        }}
        onMouseEnter={(e) => {
          if (!isLoading) {
            e.currentTarget.style.boxShadow =
              '0 0 12px #f43f5e, 0 0 24px rgba(244, 63, 94, 0.4), inset 0 0 12px rgba(244, 63, 94, 0.15)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '';
        }}
      >
        {isLoading ? (
          <span className="flex items-center gap-3">
            <Loader2 size={20} className="animate-spin" />
            启动中...
          </span>
        ) : (
          <span className="flex items-center gap-3">
            <Swords size={20} />
            开始模拟
          </span>
        )}
      </button>

      {/* Bottom decorative pixel row */}
      <div className="mt-16 flex gap-2">
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
  );
}
