'use client';

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { createPortal } from 'react-dom';
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
  initial: string;
  avatarUrl: string;
}

interface DetailPopup {
  cell: CellData;
  x: number;
  y: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const ACTIVATION_DELAY_MS = 80;
const HOVER_DELAY_MS = 200;
const FLIP_DURATION_MS = 1200;

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

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
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
          initial: getInitial(displayName),
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

  /* ------ staggered reveal (Phase 0 entrance) ------ */
  const [activatedCount, setActivatedCount] = useState(0);

  useEffect(() => {
    if (cells.length === 0) return;
    let count = 0;
    const timer = setInterval(() => {
      count += 1;
      setActivatedCount(count);
      if (count >= cells.length) clearInterval(timer);
    }, ACTIVATION_DELAY_MS);
    return () => {
      clearInterval(timer);
      setActivatedCount(0);
    };
  }, [cells.length]);

  /* ------ FLIP animation for Phase 0 -> 1 ------ */
  const cellRefs = useRef(new Map<string, HTMLDivElement>());
  const prevPositions = useRef(new Map<string, DOMRect>());
  const [flipState, setFlipState] = useState<'idle' | 'captured' | 'animating' | 'done'>('idle');

  // Step 1: When phase changes to 1, capture current positions
  useEffect(() => {
    if (currentPhase === 1 && flipState === 'idle') {
      const positions = new Map<string, DOMRect>();
      cellRefs.current.forEach((el, id) => {
        positions.set(id, el.getBoundingClientRect());
      });
      prevPositions.current = positions;
      // Use rAF to let the DOM update to grouped layout before measuring new positions
      requestAnimationFrame(() => setFlipState('captured'));
    }
  }, [currentPhase, flipState]);

  // Step 2: After layout switch, calculate deltas and animate
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

      // Start at old position with skew included
      el.style.transition = 'none';
      el.style.transform = `translate(${dx}px, ${dy}px) skewX(-28deg)`;
      el.getBoundingClientRect(); // force reflow

      // Animate to new position
      el.style.transition = `transform ${FLIP_DURATION_MS}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
      el.style.transform = 'skewX(-28deg)';
    });

    setFlipState('animating');

    const timer = setTimeout(() => {
      cellRefs.current.forEach((el) => {
        el.style.transition = '';
        el.style.transform = '';
      });
      setFlipState('done');
    }, FLIP_DURATION_MS + 100);

    return () => clearTimeout(timer);
  }, [flipState]);

  /* ------ hover & detail popup ------ */
  const [detail, setDetail] = useState<DetailPopup | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback(
    (cell: CellData, e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      hoverTimer.current = setTimeout(() => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const popupW = 280;
        const popupH = 140;
        let x = rect.right + 8;
        let y = rect.top;
        if (x + popupW > vw) x = rect.left - popupW - 8;
        if (x < 0) { x = rect.left; y = rect.bottom + 8; }
        if (y + popupH > vh) y = vh - popupH - 8;
        setDetail({ cell, x, y });
      }, HOVER_DELAY_MS);
    },
    [],
  );

  const handleMouseLeave = useCallback(() => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    setDetail(null);
  }, []);

  const setCellRef = useCallback(
    (id: string) => (el: HTMLDivElement | null) => {
      if (el) cellRefs.current.set(id, el);
      else cellRefs.current.delete(id);
    },
    [],
  );

  /* ------ detail portal ------ */
  function renderDetailPortal() {
    if (!detail || typeof document === 'undefined') return null;
    return createPortal(
      <div
        className="detail-card visible"
        style={{ left: detail.x, top: detail.y }}
      >
        <p
          className="font-display font-bold"
          style={{ fontSize: 14, color: 'var(--rs-white)', marginBottom: 8 }}
        >
          {detail.cell.name}
        </p>
        <p style={{ fontSize: 11, color: 'var(--rs-gray-light)', marginBottom: 4 }}>
          {detail.cell.role}
          {detail.cell.isLeader ? ' \u00B7 Leader' : ''}
        </p>
        <p style={{ fontSize: 11, color: 'var(--rs-gray)' }}>
          {detail.cell.groupName} &middot; {TRACK_LABELS[detail.cell.track]}
        </p>
        {speakingAgentId === detail.cell.characterId && (
          <p
            className="font-mono mt-2 uppercase"
            style={{ fontSize: 9, color: 'var(--rs-white)', letterSpacing: 2 }}
          >
            ● Speaking
          </p>
        )}
      </div>,
      document.body,
    );
  }

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

  /* ------ Phase 0: Unified parallelogram grid ------ */
  if (currentPhase === 0) {
    return (
      <div className="custom-scrollbar flex h-full w-full flex-col overflow-y-auto p-4">
        <div
          className="flex flex-wrap justify-center gap-3"
          style={{ perspective: '1000px' }}
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
                style={{
                  width: 140,
                  height: 180,
                  animation: isActivated
                    ? `tekkenReveal 1.2s ease ${index * ACTIVATION_DELAY_MS}ms both`
                    : undefined,
                }}
                onMouseEnter={(e) => handleMouseEnter(cell, e)}
                onMouseLeave={handleMouseLeave}
              >
                <img
                  src={cell.avatarUrl}
                  alt={cell.name}
                  loading="lazy"
                />
                <div className="name-label">
                  <span>{cell.name}</span>
                </div>
              </div>
            );
          })}
        </div>
        {renderDetailPortal()}
      </div>
    );
  }

  /* ------ Phase 1+: Group marquee scrolling ------ */
  return (
    <div className="custom-scrollbar flex h-full w-full flex-col gap-4 overflow-y-auto p-4">
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
            {/* Group label */}
            <div
              className="font-mono mb-2 uppercase"
              style={{
                fontSize: 11,
                letterSpacing: 2,
                color: isActive ? 'var(--tk-cyan)' : 'var(--rs-gray)',
              }}
            >
              组 {groupId}
              <span
                style={{
                  marginLeft: 12,
                  fontSize: 9,
                  color: 'var(--rs-gray-light)',
                  letterSpacing: 1,
                }}
              >
                {TRACK_LABELS[members[0]?.track ?? 'software']}
              </span>
            </div>

            {/* Marquee container */}
            <div className="group-marquee" style={{ height: 176 }}>
              <div
                className="marquee-track"
                style={
                  { '--marquee-duration': marqueeDuration } as React.CSSProperties
                }
              >
                {duplicated.map((cell, i) => {
                  const isSpeaking = speakingAgentId === cell.characterId;
                  const cardClass = [
                    'marquee-card',
                    isSpeaking ? 'focus' : '',
                  ]
                    .filter(Boolean)
                    .join(' ');

                  return (
                    <div
                      key={`${cell.characterId}-${i}`}
                      ref={
                        i < members.length
                          ? setCellRef(cell.characterId)
                          : undefined
                      }
                      className={cardClass}
                      onMouseEnter={(e) => handleMouseEnter(cell, e)}
                      onMouseLeave={handleMouseLeave}
                    >
                      <img
                        src={cell.avatarUrl}
                        alt={cell.name}
                        loading="lazy"
                      />
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
      {renderDetailPortal()}
    </div>
  );
}
