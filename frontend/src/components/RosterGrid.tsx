'use client';

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { createPortal } from 'react-dom';
import type { GroupInfo } from '@/types/simulation';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface RosterGridProps {
  groups: GroupInfo[];
  currentPhase: number;
  activeGroupId: number | null;
  speakingAgentId: string | null;
}

interface CellData {
  characterId: string;
  name: string;
  role: string;
  groupId: number;
  groupName: string;
  isLeader: boolean;
  track: 'SW' | 'HW';
  initial: string;
}

interface DetailPopup {
  cell: CellData;
  x: number;
  y: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const TOTAL_CELLS = 40;
const BREATHING_RATIO = 0.08;
const ACTIVATION_DELAY_MS = 80;
const HOVER_DELAY_MS = 200;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Stable shuffle using a seed derived from characterId */
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
}: RosterGridProps) {
  /* ------ derived cell data ------ */
  const cells = useMemo<CellData[]>(() => {
    if (!groups.length) return [];
    const all: CellData[] = [];
    groups.forEach((g, gi) => {
      const track: 'SW' | 'HW' = gi % 2 === 0 ? 'SW' : 'HW';
      g.members.forEach((m) => {
        all.push({
          characterId: m.characterId,
          name: m.characterId, // fallback; overridden below if possible
          role: m.role,
          groupId: g.groupId,
          groupName: `组${g.groupId}`,
          isLeader: m.isLeader,
          track,
          initial: getInitial(m.characterId),
        });
      });
    });
    return all;
  }, [groups]);

  /* ------ ordering: random in phase 0, grouped from phase 1 ------ */
  const randomOrder = useMemo(
    () => (cells.length ? seededShuffle(cells, 42) : []),
    [cells],
  );

  const groupedOrder = useMemo(() => {
    // group by groupId, preserve intra-group order
    const byGroup = new Map<number, CellData[]>();
    cells.forEach((c) => {
      const arr = byGroup.get(c.groupId) ?? [];
      arr.push(c);
      byGroup.set(c.groupId, arr);
    });
    return Array.from(byGroup.values()).flat();
  }, [cells]);

  const displayOrder = currentPhase === 0 ? randomOrder : groupedOrder;

  /* ------ activation stagger (phase 0 reveal) ------ */
  const [activatedCount, setActivatedCount] = useState(0);
  const activationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (cells.length === 0) return;
    // reset
    setActivatedCount(0);
    // stagger activation
    let count = 0;
    activationTimerRef.current = setInterval(() => {
      count += 1;
      setActivatedCount(count);
      if (count >= cells.length) {
        if (activationTimerRef.current) clearInterval(activationTimerRef.current);
      }
    }, ACTIVATION_DELAY_MS);
    return () => {
      if (activationTimerRef.current) clearInterval(activationTimerRef.current);
    };
  }, [cells.length]);

  /* ------ breathing mask for dark cells ------ */
  const breathingSet = useMemo(() => {
    const set = new Set<number>();
    const total = TOTAL_CELLS;
    const count = Math.ceil(total * BREATHING_RATIO);
    let s = 7;
    while (set.size < count) {
      s = (s * 16807) % 2147483647;
      set.add(s % total);
    }
    return set;
  }, []);

  /* ------ FLIP animation for shuffle ------ */
  const cellRefs = useRef(new Map<string, HTMLDivElement>());
  const prevPositions = useRef(new Map<string, DOMRect>());
  const [shufflePhase, setShufflePhase] = useState<number>(-1);

  // Capture positions before reorder
  useEffect(() => {
    if (currentPhase === 1 && shufflePhase < 1) {
      // snapshot current positions
      const positions = new Map<string, DOMRect>();
      cellRefs.current.forEach((el, id) => {
        positions.set(id, el.getBoundingClientRect());
      });
      prevPositions.current = positions;
      // trigger the reorder in next frame
      requestAnimationFrame(() => {
        setShufflePhase(1);
      });
    }
  }, [currentPhase, shufflePhase]);

  // Apply FLIP after reorder
  useEffect(() => {
    if (shufflePhase !== 1) return;
    const prev = prevPositions.current;
    cellRefs.current.forEach((el, id) => {
      const oldRect = prev.get(id);
      if (!oldRect) return;
      const newRect = el.getBoundingClientRect();
      const dx = oldRect.left - newRect.left;
      const dy = oldRect.top - newRect.top;
      if (dx === 0 && dy === 0) return;
      // set initial offset (no transition)
      el.style.transition = 'none';
      el.style.transform = `translate(${dx}px, ${dy}px)`;
      // force reflow
      el.getBoundingClientRect();
      // animate to final position
      el.style.transition = 'transform 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      el.style.transform = 'translate(0, 0)';
    });
    // cleanup after animation
    const timer = setTimeout(() => {
      cellRefs.current.forEach((el) => {
        el.style.transition = '';
        el.style.transform = '';
      });
      setShufflePhase(2);
    }, 1300);
    return () => clearTimeout(timer);
  }, [shufflePhase]);

  /* ------ hover detail card ------ */
  const [detail, setDetail] = useState<DetailPopup | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [flippedId, setFlippedId] = useState<string | null>(null);

  const handleMouseEnter = useCallback(
    (cell: CellData, e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      hoverTimer.current = setTimeout(() => {
        // Position: try right, then left, then bottom
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const popupW = 280;
        const popupH = 140;
        let x = rect.right + 8;
        let y = rect.top;
        if (x + popupW > vw) {
          x = rect.left - popupW - 8;
        }
        if (x < 0) {
          x = rect.left;
          y = rect.bottom + 8;
        }
        if (y + popupH > vh) {
          y = vh - popupH - 8;
        }
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

  const handleCellClick = useCallback((id: string) => {
    setFlippedId((prev) => (prev === id ? null : id));
  }, []);

  /* ------ register cell ref ------ */
  const setCellRef = useCallback(
    (id: string) => (el: HTMLDivElement | null) => {
      if (el) cellRefs.current.set(id, el);
      else cellRefs.current.delete(id);
    },
    [],
  );

  /* ------ split cells into SW / HW tracks ------ */
  const swCells = useMemo(
    () => displayOrder.filter((c) => c.track === 'SW'),
    [displayOrder],
  );
  const hwCells = useMemo(
    () => displayOrder.filter((c) => c.track === 'HW'),
    [displayOrder],
  );

  /* ------ render ------ */
  const renderCell = (cell: CellData, index: number) => {
    const isActivated = index < activatedCount;
    const isSpeaking = speakingAgentId === cell.characterId;
    const isActiveGroup = activeGroupId === cell.groupId;
    const isFlipped = flippedId === cell.characterId;

    const classNames = [
      'grid-cell',
      isActivated ? 'active' : 'dark',
      !isActivated && breathingSet.has(index) ? 'breathing' : '',
      isSpeaking ? 'focus' : '',
      isActiveGroup && currentPhase >= 1 ? 'group-highlight' : '',
      isFlipped ? 'flipped' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div
        key={cell.characterId}
        ref={setCellRef(cell.characterId)}
        className={classNames}
        style={
          isActivated && activatedCount <= cells.length
            ? { animation: `activateRitual 1.2s ease forwards` }
            : undefined
        }
        onMouseEnter={(e) => handleMouseEnter(cell, e)}
        onMouseLeave={handleMouseLeave}
        onClick={() => handleCellClick(cell.characterId)}
      >
        <div className="card-inner">
          {/* Front */}
          <div className="card-front flex flex-col items-center justify-center p-1">
            <div
              className="flex items-center justify-center rounded-sm font-mono text-lg"
              style={{
                width: 32,
                height: 32,
                background: 'var(--rs-charcoal)',
                color: 'var(--rs-gray)',
                fontWeight: 700,
              }}
            >
              {cell.initial}
            </div>
            <span
              className="mt-1 truncate text-center"
              style={{
                fontSize: 10,
                color: 'var(--rs-white)',
                maxWidth: '100%',
              }}
            >
              {cell.name}
            </span>
            <span
              className="font-mono uppercase"
              style={{
                fontSize: 7,
                color: 'var(--rs-gray)',
                letterSpacing: 1,
              }}
            >
              {cell.role}
            </span>
            <span className="track-badge">{cell.track}</span>
          </div>

          {/* Back */}
          <div
            className="card-back flex flex-col justify-center gap-0.5 p-2"
            style={{ background: 'var(--rs-charcoal)' }}
          >
            <span
              className="font-display font-bold"
              style={{ fontSize: 12, color: 'var(--rs-white)' }}
            >
              {cell.name}
            </span>
            <span
              className="font-mono uppercase"
              style={{ fontSize: 8, color: 'var(--rs-gray)' }}
            >
              {cell.role} &middot; {cell.characterId}
            </span>
            <span style={{ fontSize: 8, color: 'var(--rs-gray-light)' }}>
              {cell.isLeader ? '★ Leader' : 'Member'}
            </span>
            <span style={{ fontSize: 8, color: 'var(--rs-gray)' }}>
              {cell.groupName}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderDarkCell = (index: number) => {
    const isBreathing = breathingSet.has(index);
    return (
      <div
        key={`empty-${index}`}
        className={`grid-cell dark${isBreathing ? ' breathing' : ''}`}
      />
    );
  };

  // When no groups data yet, show all-dark grid
  if (cells.length === 0) {
    return (
      <div className="flex h-full w-full gap-6 p-4">
        <TrackColumn label="SOFTWARE">
          {Array.from({ length: TOTAL_CELLS / 2 }, (_, i) => renderDarkCell(i))}
        </TrackColumn>
        <TrackColumn label="HARDWARE">
          {Array.from({ length: TOTAL_CELLS / 2 }, (_, i) =>
            renderDarkCell(i + TOTAL_CELLS / 2),
          )}
        </TrackColumn>
      </div>
    );
  }

  // Fill remaining slots with dark cells
  const swPadCount = Math.max(0, TOTAL_CELLS / 2 - swCells.length);
  const hwPadCount = Math.max(0, TOTAL_CELLS / 2 - hwCells.length);

  return (
    <div className="flex h-full w-full gap-6 overflow-auto p-4">
      <TrackColumn label="SOFTWARE">
        {swCells.map((c, i) => renderCell(c, i))}
        {Array.from({ length: swPadCount }, (_, i) =>
          renderDarkCell(swCells.length + i),
        )}
      </TrackColumn>
      <TrackColumn label="HARDWARE">
        {hwCells.map((c, i) => renderCell(c, i + swCells.length))}
        {Array.from({ length: hwPadCount }, (_, i) =>
          renderDarkCell(TOTAL_CELLS / 2 + hwCells.length + i),
        )}
      </TrackColumn>

      {/* Hover detail portal */}
      {detail &&
        typeof document !== 'undefined' &&
        createPortal(
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
              {detail.cell.isLeader ? ' · Leader' : ''}
            </p>
            <p style={{ fontSize: 11, color: 'var(--rs-gray)' }}>
              {detail.cell.groupName}
            </p>
            {speakingAgentId === detail.cell.characterId && (
              <p
                className="font-mono mt-2 uppercase"
                style={{
                  fontSize: 9,
                  color: 'var(--rs-white)',
                  letterSpacing: 2,
                }}
              >
                ● Speaking
              </p>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Track Column                                                       */
/* ------------------------------------------------------------------ */

function TrackColumn({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <div
        className="font-mono mb-3 uppercase"
        style={{
          fontSize: 11,
          letterSpacing: 3,
          color: 'var(--rs-gray)',
        }}
      >
        {label}
      </div>
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
        }}
      >
        {children}
      </div>
    </div>
  );
}
