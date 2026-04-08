'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useSimulationStore } from '@/stores/simulation-store';
import type { SimulationMessage } from '@/types/simulation';

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  产品经理: { bg: '#7C3AED', text: '#FFFFFF' },
  前端工程师: { bg: '#3B82F6', text: '#FFFFFF' },
  后端工程师: { bg: '#10B981', text: '#FFFFFF' },
  设计师: { bg: '#F43F5E', text: '#FFFFFF' },
  运营: { bg: '#F59E0B', text: '#1A1A2E' },
  评委: { bg: '#D4A017', text: '#1A1A2E' },
};

function getRoleStyle(role: string) {
  return ROLE_COLORS[role] ?? { bg: '#4B5563', text: '#FFFFFF' };
}

function getAvatarUrl(agentId: string): string {
  // agentId format may contain a character number; extract digits
  const match = agentId.match(/(\d+)/);
  const num = match ? parseInt(match[1], 10) : 1;
  return `/avatars/oc-${num}.jpeg`;
}

function isJudgeMessage(msg: SimulationMessage): boolean {
  return msg.agent?.role === '评委';
}

function isLeaderMessage(msg: SimulationMessage): boolean {
  return msg.agent?.role === '产品经理';
}

interface MessageItemProps {
  msg: SimulationMessage;
}

function MessageItem({ msg }: MessageItemProps) {
  const agent = msg.agent;
  if (!agent || !msg.content) return null;

  const roleStyle = getRoleStyle(agent.role);
  const isJudge = isJudgeMessage(msg);
  const isLeader = isLeaderMessage(msg);

  return (
    <div
      className="flex gap-3 px-3 py-3 border-b transition-colors"
      style={{
        borderColor: 'rgba(124, 58, 237, 0.15)',
        backgroundColor: isJudge
          ? 'rgba(212, 160, 23, 0.08)'
          : 'transparent',
      }}
    >
      {/* Avatar */}
      <div
        className="h-8 w-8 shrink-0 overflow-hidden"
        style={{
          border: isLeader
            ? '2px solid #F59E0B'
            : isJudge
              ? '2px solid #D4A017'
              : '2px solid #7C3AED',
          imageRendering: 'pixelated',
        }}
      >
        <img
          src={agent.avatar || getAvatarUrl(agent.id)}
          alt={agent.name}
          className="h-full w-full object-cover"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          {/* Name */}
          <span
            className="text-base font-bold truncate"
            style={{
              fontFamily: 'var(--font-pixel-body)',
              color: isLeader ? '#F59E0B' : isJudge ? '#D4A017' : '#E2E8F0',
            }}
          >
            {agent.name}
          </span>

          {/* Role badge */}
          <span
            className="shrink-0 px-1.5 py-0.5 text-xs"
            style={{
              fontFamily: 'var(--font-pixel-body)',
              backgroundColor: roleStyle.bg,
              color: roleStyle.text,
              fontSize: '0.65rem',
            }}
          >
            {agent.role}
          </span>
        </div>

        {/* Message text */}
        <p
          className="text-base leading-relaxed break-words"
          style={{
            fontFamily: 'var(--font-pixel-body)',
            color: '#CBD5E1',
          }}
        >
          {msg.content}
        </p>
      </div>
    </div>
  );
}

export function ChatSidebar() {
  const activeGroupTab = useSimulationStore((s) => s.activeGroupTab);
  const setActiveGroupTab = useSimulationStore((s) => s.setActiveGroupTab);
  const messages = useSimulationStore((s) => s.messages);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Track last seen message count per tab for unread badges
  const [lastSeenCounts, setLastSeenCounts] = useState<Record<number, number>>(
    {}
  );

  const getMessagesForGroup = useCallback(
    (groupId: number): SimulationMessage[] => {
      return messages.get(groupId) ?? [];
    },
    [messages]
  );

  const currentMessages = getMessagesForGroup(activeGroupTab);

  // Last-seen count is updated in handleTabClick when switching tabs

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages.length]);

  function getUnreadCount(groupId: number): number {
    if (groupId === activeGroupTab) return 0;
    const total = getMessagesForGroup(groupId).length;
    const lastSeen = lastSeenCounts[groupId] ?? 0;
    return Math.max(0, total - lastSeen);
  }

  function handleTabClick(groupId: number) {
    // Save current tab's seen count before switching
    setLastSeenCounts((prev) => ({
      ...prev,
      [activeGroupTab]: currentMessages.length,
    }));
    setActiveGroupTab(groupId);
  }

  return (
    <div
      className="flex h-full flex-col"
      style={{ backgroundColor: '#0F0F23' }}
    >
      {/* Group Tabs */}
      <div
        className="flex shrink-0 border-b"
        style={{ borderColor: 'rgba(124, 58, 237, 0.3)' }}
      >
        {[1, 2, 3, 4].map((groupId) => {
          const isActive = groupId === activeGroupTab;
          const unread = getUnreadCount(groupId);

          return (
            <button
              key={groupId}
              type="button"
              onClick={() => handleTabClick(groupId)}
              className="relative flex-1 cursor-pointer px-2 py-2.5 text-center transition-all duration-200"
              style={{
                fontFamily: 'var(--font-pixel-body)',
                fontSize: '1rem',
                backgroundColor: isActive ? '#7C3AED' : '#1A1A35',
                color: isActive ? '#FFFFFF' : '#94A3B8',
                boxShadow: isActive
                  ? '0 0 12px rgba(124, 58, 237, 0.5), inset 0 0 8px rgba(124, 58, 237, 0.2)'
                  : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#252547';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#1A1A35';
                }
              }}
            >
              组 {groupId}
              {/* Unread badge */}
              {unread > 0 && (
                <span
                  className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center text-xs"
                  style={{
                    fontFamily: 'var(--font-pixel-body)',
                    backgroundColor: '#F43F5E',
                    color: '#FFFFFF',
                    fontSize: '0.6rem',
                    borderRadius: '2px',
                    minWidth: '1.25rem',
                  }}
                >
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto">
        {currentMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p
                className="text-lg pixel-blink"
                style={{
                  fontFamily: 'var(--font-pixel-body)',
                  color: '#64748B',
                }}
              >
                等待讨论开始...
              </p>
              <div className="mt-4 flex justify-center gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-2 w-2"
                    style={{
                      backgroundColor: '#7C3AED',
                      opacity: 0.4,
                      animation: `blink 1.5s step-end infinite`,
                      animationDelay: `${i * 0.5}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {currentMessages
              .filter((m) => m.type === 'message' && m.content)
              .map((msg, idx) => (
                <MessageItem key={idx} msg={msg} />
              ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
    </div>
  );
}
