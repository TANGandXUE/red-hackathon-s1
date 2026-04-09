'use client';

const PHASES = [
  { id: 0, short: '分组', full: '分组中' },
  { id: 1, short: '讨论', full: '自由讨论' },
  { id: 2, short: '创造', full: '创造产品' },
  { id: 3, short: '答辩', full: '评审答辩' },
];

interface PhaseIndicatorProps {
  currentPhase: number;
}

export function PhaseIndicator({ currentPhase }: PhaseIndicatorProps) {
  const phase = PHASES.find((p) => p.id === currentPhase);
  const label = phase?.short ?? `阶段 ${currentPhase}`;
  const description = phase?.full ?? '';

  return (
    <div
      className="w-full"
      style={{
        backgroundColor: 'var(--rs-black)',
        borderBottom: '1px solid var(--rs-gray-dark)',
      }}
    >
      <div className="flex items-center gap-4 px-6 py-3">
        {/* Pulsing status dot */}
        <span className="relative flex h-2 w-2 shrink-0">
          <span
            className="absolute inline-flex h-full w-full"
            style={{
              backgroundColor: 'var(--rs-white)',
              animation: 'pulse 2s ease-in-out infinite',
              opacity: 0.5,
              borderRadius: '0px',
            }}
          />
          <span
            className="relative inline-flex h-2 w-2"
            style={{
              backgroundColor: 'var(--rs-white)',
              borderRadius: '0px',
            }}
          />
        </span>

        {/* Phase label */}
        <span
          className="whitespace-nowrap"
          style={{
            fontFamily: 'var(--rs-font-display)',
            fontWeight: 700,
            letterSpacing: '3px',
            textTransform: 'uppercase',
            color: 'var(--rs-white)',
            fontSize: '0.875rem',
          }}
        >
          {label}
        </span>

        {/* Phase description */}
        {description && (
          <span
            style={{
              fontFamily: 'var(--rs-font-mono)',
              color: 'var(--rs-gray)',
              fontSize: '0.75rem',
              letterSpacing: '1px',
            }}
          >
            {description}
          </span>
        )}

        {/* Step indicators — right side */}
        <div className="ml-auto flex items-center gap-2">
          {PHASES.map((p) => {
            const isDone = p.id < currentPhase;
            const isCurrent = p.id === currentPhase;
            return (
              <div
                key={p.id}
                style={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: isDone
                    ? 'var(--rs-white)'
                    : 'var(--rs-gray-dark)',
                  border: isCurrent
                    ? '1px solid var(--rs-white)'
                    : '1px solid transparent',
                  borderRadius: '0px',
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
