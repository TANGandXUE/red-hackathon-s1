'use client';

const PHASES = [
  { id: 0, label: '分组' },
  { id: 1, label: '讨论' },
  { id: 2, label: '创造' },
  { id: 3, label: '答辩' },
];

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
      <div className="relative flex items-center gap-4 px-6 py-3">
        {/* Pulsing dot */}
        <span className="relative flex h-3 w-3 shrink-0">
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
            style={{ backgroundColor: '#7C3AED' }}
          />
          <span
            className="relative inline-flex h-3 w-3 rounded-full"
            style={{ backgroundColor: '#A78BFA' }}
          />
        </span>

        {/* Phase label */}
        <span
          className="text-lg tracking-wide whitespace-nowrap"
          style={{
            fontFamily: 'var(--font-pixel-body)',
            color: '#E2E8F0',
          }}
        >
          {label}
        </span>

        {/* Step progress — right side */}
        <div className="ml-auto flex items-center gap-1">
          {PHASES.map((phase, idx) => {
            const isDone = phase.id < currentPhase;
            const isCurrent = phase.id === currentPhase;
            return (
              <div key={phase.id} className="flex items-center">
                {/* Step pill */}
                <div
                  className="flex items-center gap-1 px-2 py-1"
                  style={{
                    backgroundColor: isCurrent
                      ? 'rgba(124, 58, 237, 0.3)'
                      : isDone
                      ? 'rgba(167, 139, 250, 0.15)'
                      : 'transparent',
                    border: isCurrent
                      ? '1px solid #7C3AED'
                      : '1px solid transparent',
                  }}
                >
                  {/* Number circle */}
                  <span
                    className="flex h-4 w-4 items-center justify-center text-xs"
                    style={{
                      fontFamily: 'var(--font-pixel-body)',
                      fontSize: '0.6rem',
                      backgroundColor: isDone
                        ? '#A78BFA'
                        : isCurrent
                        ? '#7C3AED'
                        : '#2D2D4A',
                      color: isDone || isCurrent ? '#FFFFFF' : '#64748B',
                    }}
                  >
                    {isDone ? '✓' : phase.id}
                  </span>
                  {/* Label */}
                  <span
                    className="text-xs hidden sm:inline"
                    style={{
                      fontFamily: 'var(--font-pixel-body)',
                      fontSize: '0.6rem',
                      color: isCurrent
                        ? '#E2E8F0'
                        : isDone
                        ? '#A78BFA'
                        : '#4A4A6A',
                    }}
                  >
                    {phase.label}
                  </span>
                </div>
                {/* Connector line */}
                {idx < PHASES.length - 1 && (
                  <div
                    className="h-px w-3 hidden sm:block"
                    style={{
                      backgroundColor:
                        phase.id < currentPhase ? '#A78BFA' : '#2D2D4A',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
