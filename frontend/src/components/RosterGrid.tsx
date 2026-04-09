'use client';

import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import type { GroupInfo, Track } from '@/types/simulation';
import { getAvatarUrl } from '@/lib/avatar';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface RosterGridProps {
  groups: GroupInfo[];
  currentPhase: number;
  activeGroupId: number | null;
  speakingAgentId: string | null;
  agentNames?: Map<string, string>;
}

interface CellData {
  characterId: string;
  name: string;
  role: string;
  groupId: number;
  groupName: string;
  track: Track;
  isLeader: boolean;
  avatarUrl: string;
}

/*
 * Visual display stage — decoupled from backend currentPhase.
 * The backend Phase 0→1 transition is near-instant, so we run our own
 * staged animation sequence on the frontend regardless of how fast the
 * backend moves.
 *
 *   revealing  → flat grid with staggered card entrance
 *   revealed   → all cards visible, brief pause
 *   grouping   → FLIP animation moves cards to group slots
 *   marquee    → final: horizontal scrolling per group
 */
type DisplayStage = 'revealing' | 'revealed' | 'grouping' | 'marquee';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const ACTIVATION_DELAY_MS = 80;
const FLIP_DURATION_MS = 1200;
const PAUSE_AFTER_REVEAL_MS = 1000;

const TRACK_LABELS: Record<Track, string> = {
  software: '软件赛道',
  hardware: '硬件赛道',
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 16807 + 0) % 2147483647;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/* ------------------------------------------------------------------ */
/*  Hover overlay content (rendered inside card)                       */
/* ------------------------------------------------------------------ */

function HoverOverlay({ cell, speakingAgentId }: { cell: CellData; speakingAgentId: string | null }) {
  const isSpeaking = speakingAgentId === cell.characterId;
  return (
    <div className="hover-info-overlay">
      <div style={{ transform: 'skewX(28deg)' }}>
        <p
          className="font-display font-bold"
          style={{ fontSize: 13, color: '#fff', marginBottom: 4, lineHeight: 1.2 }}
        >
          {cell.name}
        </p>
        <p style={{ fontSize: 10, color: 'var(--tk-cyan)', marginBottom: 2 }}>
          {cell.role}
          {cell.isLeader ? ' · 队长' : ''}
        </p>
        <p style={{ fontSize: 9, color: 'var(--rs-gray-light)' }}>
          {cell.groupName} · {TRACK_LABELS[cell.track]}
        </p>
        {isSpeaking && (
          <p
            className="font-mono uppercase"
            style={{ fontSize: 8, color: 'var(--tk-cyan)', letterSpacing: 2, marginTop: 4 }}
          >
            ● 发言中
          </p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function RosterGrid({
  groups,
  currentPhase,
  activeGroupId,
  speakingAgentId,
  agentNames,
}: RosterGridProps) {
  // currentPhase is received from the store but visual layout is driven
  // by the internal displayStage state machine. currentPhase is kept in
  // props for potential future use (e.g. phase-specific labels).
  void currentPhase;

  /* ------ derived cell data ------ */
  const cells = useMemo<CellData[]>(() => {
    if (!groups.length) return [];
    const all: CellData[] = [];
    groups.forEach((g) => {
      g.members.forEach((m) => {
        const displayName = agentNames?.get(m.characterId) ?? m.characterId;
        all.push({
          characterId: m.characterId,
          name: displayName,
          role: m.role,
          groupId: g.groupId,
          groupName: `组${g.groupId}`,
          track: g.track,
          isLeader: m.isLeader,
          avatarUrl: getAvatarUrl(m.characterId),
        });
      });
    });
    return all;
  }, [groups, agentNames]);

  /* ------ Phase 0 random order (single seed for all 40) ------ */
  const randomCells = useMemo(
    () => seededShuffle(cells, 42),
    [cells],
  );

  /* ------ Grouped map for Phase 1+ ------ */
  const groupedMap = useMemo(() => {
    const byGroup = new Map<number, CellData[]>();
    cells.forEach((c) => {
      const arr = byGroup.get(c.groupId) ?? [];
      arr.push(c);
      byGroup.set(c.groupId, arr);
    });
    return byGroup;
  }, [cells]);

  /* ------ Display stage state machine ------ */
  const [displayStage, setDisplayStage] = useState<DisplayStage>('revealing');
  const [activatedCount, setActivatedCount] = useState(0);

  // Stage 1: Staggered reveal (80ms per card)
  useEffect(() => {
    if (cells.length === 0 || displayStage !== 'revealing') return;
    let count = 0;
    const timer = setInterval(() => {
      count += 1;
      setActivatedCount(count);
      if (count >= cells.length) {
        clearInterval(timer);
        setDisplayStage('revealed');
      }
    }, ACTIVATION_DELAY_MS);
    return () => clearInterval(timer);
  }, [cells.length, displayStage]);

  // Stage 2: Brief pause after all revealed, then start grouping
  useEffect(() => {
    if (displayStage !== 'revealed') return;
    const timer = setTimeout(() => {
      setDisplayStage('grouping');
    }, PAUSE_AFTER_REVEAL_MS);
    return () => clearTimeout(timer);
  }, [displayStage]);

  // Stage 4: After FLIP completes, switch to marquee
  useEffect(() => {
    if (displayStage !== 'grouping') return;
    const timer = setTimeout(() => {
      setDisplayStage('marquee');
    }, FLIP_DURATION_MS + 200);
    return () => clearTimeout(timer);
  }, [displayStage]);

  /* ------ FLIP animation for grouping stage ------ */
  const cellRefs = useRef(new Map<string, HTMLDivElement>());
  const prevPositions = useRef(new Map<string, DOMRect>());
  const [flipState, setFlipState] = useState<'idle' | 'captured' | 'done'>('idle');

  // Capture positions right before grouping layout switch
  useEffect(() => {
    if (displayStage !== 'grouping' || flipState !== 'idle') return;
    const positions = new Map<string, DOMRect>();
    cellRefs.current.forEach((el, id) => {
      positions.set(id, el.getBoundingClientRect());
    });
    prevPositions.current = positions;
    let cancelled = false;
    requestAnimationFrame(() => {
      if (!cancelled) setFlipState('captured');
    });
    return () => { cancelled = true; };
  }, [displayStage, flipState]);

  // Animate from old positions to new grouped positions
  useEffect(() => {
    if (flipState !== 'captured') return;

    const prev = prevPositions.current;
    cellRefs.current.forEach((el, id) => {
      const oldRect = prev.get(id);
      if (!oldRect) return;
      const newRect = el.getBoundingClientRect();
      const dx = oldRect.left - newRect.left;
      const dy = oldRect.top - newRect.top;
      if (dx === 0 && dy === 0) return;

      el.style.transition = 'none';
      el.style.transform = `translate(${dx}px, ${dy}px) skewX(-28deg)`;
      el.getBoundingClientRect(); // force reflow

      el.style.transition = `transform ${FLIP_DURATION_MS}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
      el.style.transform = 'skewX(-28deg)';
    });

    const timer = setTimeout(() => {
      cellRefs.current.forEach((el) => {
        el.style.transition = '';
        el.style.transform = '';
      });
      setFlipState('done');
    }, FLIP_DURATION_MS + 100);

    return () => clearTimeout(timer);
  }, [flipState]);

  /* Hover is fully CSS-driven via :hover on .grid-cell-inner / .marquee-card-inner */

  const setCellRef = useCallback(
    (id: string) => (el: HTMLDivElement | null) => {
      if (el) cellRefs.current.set(id, el);
      else cellRefs.current.delete(id);
    },
    [],
  );

  /* ------ empty state ------ */
  if (cells.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <span
          className="font-mono uppercase"
          style={{ fontSize: 11, color: 'var(--rs-gray)', letterSpacing: 3 }}
        >
          Awaiting roster data...
        </span>
      </div>
    );
  }

  /* ------ Stage: revealing / revealed — flat parallelogram grid ------ */
  if (displayStage === 'revealing' || displayStage === 'revealed') {
    return (
      <div
        className="custom-scrollbar h-full w-full overflow-y-auto overflow-x-hidden"
        style={{ background: 'var(--tk-bg)' }}
      >
        {/* Container — copied from .charaList: flex wrap, centered, max-width */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            maxWidth: 1200,
            margin: '0 auto',
            padding: '20px 40px',
          }}
        >
          {randomCells.map((cell, index) => {
            const isActivated = index < activatedCount;
            const isSpeaking = speakingAgentId === cell.characterId;

            const classNames = [
              'grid-cell',
              isActivated ? 'active' : 'dark',
              isSpeaking ? 'focus' : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <div
                key={cell.characterId}
                ref={setCellRef(cell.characterId)}
                className={classNames}
                style={
                  isActivated
                    ? { animation: `tekkenReveal 1.2s ease ${index * ACTIVATION_DELAY_MS}ms both` }
                    : undefined
                }
              >
                <div
                  className="grid-cell-inner"
                >
                  <img src={cell.avatarUrl} alt={cell.name} loading="lazy" />
                  <HoverOverlay cell={cell} speakingAgentId={speakingAgentId} />
                </div>
                <div className="name-label">
                  <span>{cell.name}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ------ Stage: grouping — intermediate grouped grid (FLIP target) ------ */
  if (displayStage === 'grouping') {
    return (
      <div
        className="custom-scrollbar h-full w-full overflow-y-auto overflow-x-hidden"
        style={{ background: 'var(--tk-bg)' }}
      >
        <div style={{ padding: '20px 40px' }}>
          {Array.from(groupedMap.entries()).map(([groupId, members]) => {
            const isActive = activeGroupId === groupId;
            return (
              <div key={groupId} style={{ marginBottom: 24 }}>
                <div
                  className="font-mono mb-2 uppercase"
                  style={{
                    fontSize: 11,
                    letterSpacing: 2,
                    color: isActive ? 'var(--tk-cyan)' : 'var(--rs-gray)',
                  }}
                >
                  组 {groupId}
                  <span style={{ marginLeft: 12, fontSize: 9, color: 'var(--rs-gray-light)', letterSpacing: 1 }}>
                    {TRACK_LABELS[members[0]?.track ?? 'software']}
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                  {members.map((cell) => {
                    const isSpeaking = speakingAgentId === cell.characterId;
                    const classNames = [
                      'grid-cell',
                      'active',
                      isSpeaking ? 'focus' : '',
                    ].filter(Boolean).join(' ');

                    return (
                      <div
                        key={cell.characterId}
                        ref={setCellRef(cell.characterId)}
                        className={classNames}
                        style={{ width: 120, height: 160, margin: '10px 5px 0' }}
                      >
                        <div className="grid-cell-inner">
                          <img src={cell.avatarUrl} alt={cell.name} loading="lazy" />
                          <HoverOverlay cell={cell} speakingAgentId={speakingAgentId} />
                        </div>
                        <div className="name-label">
                          <span>{cell.name}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ------ Stage: marquee — final horizontal scrolling per group ------ */
  return (
    <div
      className="custom-scrollbar h-full w-full overflow-y-auto overflow-x-hidden"
      style={{ background: 'var(--tk-bg)' }}
    >
      <div style={{ padding: '20px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Array.from(groupedMap.entries()).map(([groupId, members]) => {
          const isActive = activeGroupId === groupId;
          const marqueeDuration = `${members.length * 8}s`;
          const duplicated = [...members, ...members];

          return (
            <div
              key={groupId}
              style={{
                border: isActive
                  ? '1px solid var(--tk-cyan)'
                  : '1px solid var(--rs-gray-dark)',
                boxShadow: isActive ? '0 0 15px var(--tk-cyan-glow)' : 'none',
                padding: '12px 16px',
                transition: 'border-color 0.3s, box-shadow 0.3s',
              }}
            >
              <div
                className="font-mono mb-2 uppercase"
                style={{
                  fontSize: 11,
                  letterSpacing: 2,
                  color: isActive ? 'var(--tk-cyan)' : 'var(--rs-gray)',
                }}
              >
                组 {groupId}
                <span style={{ marginLeft: 12, fontSize: 9, color: 'var(--rs-gray-light)', letterSpacing: 1 }}>
                  {TRACK_LABELS[members[0]?.track ?? 'software']}
                </span>
              </div>

              <div className="group-marquee" style={{ height: 176 }}>
                <div
                  className="marquee-track"
                  style={{ '--marquee-duration': marqueeDuration } as React.CSSProperties}
                >
                  {duplicated.map((cell, i) => {
                    const isSpeaking = speakingAgentId === cell.characterId;
                    const cardClass = [
                      'marquee-card',
                      isSpeaking ? 'focus' : '',
                    ].filter(Boolean).join(' ');

                    return (
                      <div
                        key={`${cell.characterId}-${i}`}
                        ref={i < members.length ? setCellRef(cell.characterId) : undefined}
                        className={cardClass}
                      >
                        <div
                          className="marquee-card-inner"
                        >
                          <img src={cell.avatarUrl} alt={cell.name} loading="lazy" />
                          <HoverOverlay cell={cell} speakingAgentId={speakingAgentId} />
                        </div>
                        <div className="name-label">
                          <span>{cell.name}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
