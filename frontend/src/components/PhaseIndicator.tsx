'use client';

const PHASE_LABELS: Record<number, string> = {
  0: '阶段 0 — 分组中...',
  1: '阶段 1 — 自由讨论',
  2: '阶段 2 — 创造产品',
  3: '阶段 3 — 评审答辩',
};

interface PhaseIndicatorProps {
  currentPhase: number;
}

export function PhaseIndicator({ currentPhase }: PhaseIndicatorProps) {
  const label = PHASE_LABELS[currentPhase] ?? `阶段 ${currentPhase}`;

  return (
    <div
      className="relative w-full overflow-hidden border-b-2"
      style={{
        backgroundColor: '#0F0F23',
        borderColor: '#7C3AED',
        boxShadow: '0 2px 12px rgba(124, 58, 237, 0.3)',
      }}
    >
      {/* Scanline animation overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(124, 58, 237, 0.04) 2px, rgba(124, 58, 237, 0.04) 4px)',
        }}
      />

      <div className="relative flex items-center gap-4 px-6 py-3">
        {/* Pulsing dot */}
        <span className="relative flex h-3 w-3">
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
            style={{ backgroundColor: '#7C3AED' }}
          />
          <span
            className="relative inline-flex h-3 w-3 rounded-full"
            style={{ backgroundColor: '#A78BFA' }}
          />
        </span>

        {/* Phase number */}
        <span
          className="neon-glow-purple text-sm"
          style={{
            fontFamily: 'var(--font-pixel-display)',
            color: '#A78BFA',
          }}
        >
          {currentPhase}
        </span>

        {/* Phase label */}
        <span
          className="text-xl tracking-wide"
          style={{
            fontFamily: 'var(--font-pixel-body)',
            color: '#E2E8F0',
          }}
        >
          {label}
        </span>

        {/* Decorative pixel dots on the right */}
        <div className="ml-auto flex gap-1">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-2 w-2 transition-colors duration-300"
              style={{
                backgroundColor:
                  i <= currentPhase ? '#7C3AED' : '#1E1E3A',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
