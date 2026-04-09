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
          groupName: `\u7EC4${g.groupId}`,
          isLeader: m.isLeader,
          initial: getInitial(displayName),
          avatarUrl: getAvatarUrl(m.characterId),
        });
      });
    });
    return all;
  }, [groups, agentNames]);

  /* ------ ordering: random in phase 0, grouped from phase 1 ------ */
  const randomOrder = useMemo(
    () => (cells.length ? seededShuffle(cells, 42) : []),
    [cells],
  );

  const groupedMap = useMemo(() => {
    const byGroup = new Map<number, CellData[]>();
    cells.forEach((c) => {
      const arr = byGroup.get(c.groupId) ?? [];
      arr.push(c);
      byGroup.set(c.groupId, arr);
    });
    return byGroup;
  }, [cells]);

  const groupedOrder = useMemo(() => {
    return Array.from(groupedMap.values()).flat();
  }, [groupedMap]);

  /** O(1) index lookup for grouped cells (avoids indexOf O(n) per cell) */
  const groupedIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    groupedOrder.forEach((c, i) => map.set(c.characterId, i));
    return map;
  }, [groupedOrder]);

  const displayOrder = currentPhase === 0 ? randomOrder : groupedOrder;

  /* ------ activation stagger (phase 0 reveal) ------ */
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

  /* ------ FLIP animation for shuffle ------ */
  const cellRefs = useRef(new Map<string, HTMLDivElement>());
  const prevPositions = useRef(new Map<string, DOMRect>());
  const [shufflePhase, setShufflePhase] = useState<number>(-1);

  // Capture positions before reorder
  useEffect(() => {
    if (currentPhase === 1 && shufflePhase < 1) {
      const positions = new Map<string, DOMRect>();
      cellRefs.current.forEach((el, id) => {
        positions.set(id, el.getBoundingClientRect());
      });
      prevPositions.current = positions;
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
      el.style.transition = 'none';
      el.style.transform = `translate(${dx}px, ${dy}px)`;
      el.getBoundingClientRect();
      el.style.transition = 'transform 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      el.style.transform = 'translate(0, 0)';
    });
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

  /* ------ render a single cell ------ */
  const renderCell = (cell: CellData, index: number) => {
    const isActivated = index < activatedCount;
    const isSpeaking = speakingAgentId === cell.characterId;
    const isActiveGroup = activeGroupId === cell.groupId;
    const isFlipped = flippedId === cell.characterId;

    const classNames = [
      'grid-cell',
      isActivated ? 'active' : 'dark',
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
          {/* Front — card art image with gradient overlay */}
          <div className="card-front" style={{ overflow: 'hidden' }}>
            <img
              src={cell.avatarUrl}
              alt={cell.name}
              loading="lazy"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            {/* Bottom gradient overlay with name and role */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '24px 6px 6px',
                background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
              }}
            >
              <span
                className="font-display truncate font-bold"
                style={{
                  fontSize: 11,
                  color: 'var(--rs-white)',
                  lineHeight: 1.2,
                }}
              >
                {cell.name}
              </span>
              <span
                className="font-mono truncate uppercase"
                style={{
                  fontSize: 8,
                  color: 'var(--rs-gray-light)',
                  letterSpacing: 1,
                }}
              >
                {cell.role}
              </span>
            </div>
          </div>

          {/* Back — blurred card art with info overlay */}
          <div className="card-back" style={{ overflow: 'hidden' }}>
            <img
              src={cell.avatarUrl}
              alt=""
              loading="lazy"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'blur(8px) brightness(0.4)',
                transform: 'scale(1.1)',
              }}
            />
            <div
              style={{
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                height: '100%',
                padding: 8,
                gap: 3,
              }}
            >
              <span
                className="font-display font-bold"
                style={{ fontSize: 12, color: 'var(--rs-white)' }}
              >
                {cell.name}
              </span>
              <span
                className="font-mono uppercase"
                style={{ fontSize: 8, color: 'var(--rs-gray-light)' }}
              >
                {cell.role} &middot; {cell.characterId}
              </span>
              <span style={{ fontSize: 8, color: 'var(--rs-white)' }}>
                {cell.isLeader ? '\u2605 Leader' : 'Member'}
              </span>
              <span style={{ fontSize: 8, color: 'var(--rs-gray-light)' }}>
                {cell.groupName}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

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

  /* ------ Phase 0: single flat grid ------ */
  if (currentPhase === 0) {
    return (
      <div className="h-full w-full overflow-auto p-3">
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
          }}
        >
          {displayOrder.map((c, i) => renderCell(c, i))}
        </div>

        {/* Hover detail portal */}
        {renderDetailPortal()}
      </div>
    );
  }

  /* ------ Phase >= 1: grouped layout ------ */
  const groupEntries = Array.from(groupedMap.entries());

  return (
    <div className="h-full w-full overflow-auto p-3">
      <div className="flex flex-col gap-6">
        {groupEntries.map(([groupId, members]) => {
          const isActive = activeGroupId === groupId;
          return (
            <div key={groupId}>
              {/* Group label */}
              <div
                className="font-mono mb-2 uppercase"
                style={{
                  fontSize: 11,
                  letterSpacing: 3,
                  color: isActive ? 'var(--rs-white)' : 'var(--rs-gray)',
                }}
              >
                {`\u7EC4 ${groupId}`}
              </div>
              {/* Group grid */}
              <div
                className="grid gap-1"
                style={{
                  gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                  border: isActive ? '1px solid var(--rs-gray)' : '1px solid transparent',
                  borderRadius: 4,
                  padding: isActive ? 4 : 4,
                }}
              >
                {members.map((c) => {
                  const globalIdx = groupedIndexMap.get(c.characterId) ?? 0;
                  return renderCell(c, globalIdx);
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Hover detail portal */}
      {renderDetailPortal()}
    </div>
  );

  /* ------ detail portal helper ------ */
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
            \u25CF Speaking
          </p>
        )}
      </div>,
      document.body,
    );
  }
}
