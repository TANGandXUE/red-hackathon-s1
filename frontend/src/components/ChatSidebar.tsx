'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useSimulationStore } from '@/stores/simulation-store';
import type { SimulationMessage, TypingAgent } from '@/types/simulation';
import MarkdownContent from './MarkdownContent';
import { getAvatarUrl } from '@/lib/avatar';

export const JUDGE_ROLE = '评委' as const;

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  产品经理: { bg: '#7C3AED', text: '#FFFFFF' },
  前端工程师: { bg: '#3B82F6', text: '#FFFFFF' },
  后端工程师: { bg: '#10B981', text: '#FFFFFF' },
  设计师: { bg: '#F43F5E', text: '#FFFFFF' },
  运营: { bg: '#F59E0B', text: '#1A1A2E' },
  [JUDGE_ROLE]: { bg: '#D4A017', text: '#1A1A2E' },
};

function getRoleStyle(role: string) {
  return ROLE_COLORS[role] ?? { bg: '#4B5563', text: '#FFFFFF' };
}

function isJudgeMessage(msg: SimulationMessage): boolean {
  return msg.agent?.role === JUDGE_ROLE;
}

interface MessageItemProps {
  msg: SimulationMessage;
}

function MessageItem({ msg }: MessageItemProps) {
  const agent = msg.agent;
  if (!agent || !msg.content) return null;

  const roleStyle = getRoleStyle(agent.role);
  const isJudge = isJudgeMessage(msg);
  const isLeader = agent.isLeader;

  return (
    <div
      className="flex gap-3 px-3 py-3 border-b transition-colors"
      style={{
        borderColor: 'rgba(124, 58, 237, 0.15)',
        backgroundColor: isJudge
          ? 'rgba(212, 160, 23, 0.08)'
          : isLeader
          ? 'rgba(124, 58, 237, 0.05)'
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
        <div className="flex flex-wrap items-center gap-1.5 mb-1">
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

          {/* Leader badge */}
          {isLeader && (
            <span
              className="shrink-0 px-1.5 py-0.5"
              style={{
                fontFamily: 'var(--font-pixel-body)',
                backgroundColor: '#F59E0B',
                color: '#1A1A2E',
                fontSize: '0.6rem',
              }}
            >
              队长
            </span>
          )}

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
        <MarkdownContent content={msg.content} />
      </div>
    </div>
  );
}

/** Typing indicator shown while an AI agent is generating */
function TypingIndicator({ agent }: { agent: TypingAgent }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - agent.startedAt) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [agent.startedAt]);

  const roleStyle = getRoleStyle(agent.agentRole);
  const avatarNum = agent.agentId.match(/\d+/)?.[0] ?? '1';

  return (
    <div
      className="flex gap-3 px-3 py-3 border-b"
      style={{
        borderColor: 'rgba(124, 58, 237, 0.15)',
        backgroundColor: agent.agentRole === '评委'
          ? 'rgba(212, 160, 23, 0.06)'
          : agent.isLeader
          ? 'rgba(124, 58, 237, 0.08)'
          : 'rgba(124, 58, 237, 0.04)',
      }}
    >
      {/* Avatar with pulse */}
      <div
        className="h-8 w-8 shrink-0 overflow-hidden"
        style={{
          border: agent.isLeader
            ? '2px solid #F59E0B'
            : agent.agentRole === '评委'
            ? '2px solid #D4A017'
            : '2px solid #7C3AED',
          imageRendering: 'pixelated',
        }}
      >
        <img
          src={`/avatars/oc-${avatarNum}.jpeg`}
          alt={agent.agentName}
          className="h-full w-full object-cover"
          style={{ imageRendering: 'pixelated', opacity: 0.7 }}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          <span
            className="text-base font-bold"
            style={{
              fontFamily: 'var(--font-pixel-body)',
              color: agent.isLeader ? '#F59E0B' : agent.agentRole === '评委' ? '#D4A017' : '#E2E8F0',
              opacity: 0.8,
            }}
          >
            {agent.agentName}
          </span>
          {agent.isLeader && (
            <span
              className="shrink-0 px-1.5 py-0.5"
              style={{
                fontFamily: 'var(--font-pixel-body)',
                backgroundColor: '#F59E0B',
                color: '#1A1A2E',
                fontSize: '0.6rem',
              }}
            >
              队长
            </span>
          )}
          <span
            className="shrink-0 px-1.5 py-0.5"
            style={{
              fontFamily: 'var(--font-pixel-body)',
              backgroundColor: roleStyle.bg,
              color: roleStyle.text,
              fontSize: '0.65rem',
            }}
          >
            {agent.agentRole}
          </span>
          <span
            className="ml-auto text-xs tabular-nums"
            style={{
              fontFamily: 'var(--font-pixel-body)',
              color: '#64748B',
            }}
          >
            ({elapsed}s)
          </span>
        </div>

        {/* Animated typing dots */}
        <div className="flex items-center gap-1.5">
          <span
            style={{
              fontFamily: 'var(--font-pixel-body)',
              color: '#64748B',
              fontSize: '0.75rem',
            }}
          >
            思考中
          </span>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-1.5 w-1.5"
              style={{
                backgroundColor: '#7C3AED',
                animation: `blink 1.2s step-end infinite`,
                animationDelay: `${i * 0.4}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ChatSidebar() {
  const activeGroupTab = useSimulationStore((s) => s.activeGroupTab);
  const setActiveGroupTab = useSimulationStore((s) => s.setActiveGroupTab);
  const messages = useSimulationStore((s) => s.messages);
  const typingAgents = useSimulationStore((s) => s.typingAgents);

  const messagesEndRef = useRef<HTMLDivElement>(null);

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
  const currentTyping = typingAgents.get(activeGroupTab) ?? null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages.length, currentTyping]);

  function getUnreadCount(groupId: number): number {
    if (groupId === activeGroupTab) return 0;
    const total = getMessagesForGroup(groupId).length;
    const lastSeen = lastSeenCounts[groupId] ?? 0;
    return Math.max(0, total - lastSeen);
  }

  function hasGroupTyping(groupId: number): boolean {
    return groupId !== activeGroupTab && (typingAgents.get(groupId) ?? null) !== null;
  }

  function handleTabClick(groupId: number) {
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
          const isTypingInGroup = hasGroupTyping(groupId);

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
              {/* Typing indicator dot on inactive tab */}
              {isTypingInGroup && (
                <span
                  className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: '#A78BFA',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }}
                />
              )}
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
        {currentMessages.length === 0 && !currentTyping ? (
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
              .filter((m) => (m.type === 'message' || m.type === 'tool_call') && m.content)
              .map((msg, idx) =>
                msg.type === 'tool_call' ? (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-3 py-2 text-xs"
                    style={{
                      fontFamily: 'var(--font-pixel-body)',
                      color: '#A78BFA',
                      backgroundColor: 'rgba(124, 58, 237, 0.06)',
                      borderBottom: '1px solid rgba(124, 58, 237, 0.1)',
                    }}
                  >
                    <span style={{ opacity: 0.7 }}>{msg.agent?.name}</span>
                    <span>{msg.content}</span>
                  </div>
                ) : (
                  <MessageItem key={idx} msg={msg} />
                ),
              )}
            {/* Typing indicator at bottom */}
            {currentTyping && <TypingIndicator agent={currentTyping} />}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
    </div>
  );
}
