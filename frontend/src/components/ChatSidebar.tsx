'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useSimulationStore } from '@/stores/simulation-store';
import type { SimulationMessage, TypingAgent } from '@/types/simulation';
import MarkdownContent from './MarkdownContent';
import { getAvatarUrl } from '@/lib/avatar';


interface MessageItemProps {
  msg: SimulationMessage;
}

function MessageItem({ msg }: MessageItemProps) {
  const agent = msg.agent;
  if (!agent || !msg.content) return null;

  const isLeader = agent.isLeader;

  return (
    <div
      className="flex gap-3 px-3 py-3 transition-colors"
      style={{
        borderBottom: '1px solid var(--rs-gray-dark)',
        backgroundColor: 'transparent',
      }}
    >
      {/* Avatar */}
      <div
        className="h-8 w-8 shrink-0 overflow-hidden"
        style={{
          border: '1px solid var(--rs-gray-dark)',
          borderRadius: '0px',
        }}
      >
        <img
          src={agent.avatar || getAvatarUrl(agent.id)}
          alt={agent.name}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5 mb-1">
          {/* Name */}
          <span
            className="text-base font-bold truncate"
            style={{
              fontFamily: 'var(--rs-font-display)',
              color: 'var(--rs-white)',
            }}
          >
            {agent.name}
          </span>

          {/* Leader badge */}
          {isLeader && (
            <span
              className="shrink-0 px-1.5 py-0.5"
              style={{
                fontFamily: 'var(--rs-font-mono)',
                border: '1px solid var(--rs-white)',
                color: 'var(--rs-white)',
                fontSize: '0.6rem',
                letterSpacing: '1px',
                borderRadius: '0px',
              }}
            >
              队长
            </span>
          )}

          {/* Role badge */}
          <span
            className="shrink-0 px-1.5 py-0.5 text-xs"
            style={{
              fontFamily: 'var(--rs-font-mono)',
              backgroundColor: 'var(--rs-gray-dark)',
              color: 'var(--rs-gray-light)',
              fontSize: '0.65rem',
              letterSpacing: '1px',
              borderRadius: '0px',
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

  return (
    <div
      className="flex gap-3 px-3 py-3"
      style={{
        borderBottom: '1px solid var(--rs-gray-dark)',
        backgroundColor: 'transparent',
      }}
    >
      {/* Avatar with pulse */}
      <div
        className="h-8 w-8 shrink-0 overflow-hidden"
        style={{
          border: '1px solid var(--rs-gray-dark)',
          borderRadius: '0px',
        }}
      >
        <img
          src={getAvatarUrl(agent.agentId)}
          alt={agent.agentName}
          className="h-full w-full object-cover"
          style={{ opacity: 0.7 }}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          <span
            className="text-base font-bold"
            style={{
              fontFamily: 'var(--rs-font-display)',
              color: 'var(--rs-white)',
              opacity: 0.8,
            }}
          >
            {agent.agentName}
          </span>
          {agent.isLeader && (
            <span
              className="shrink-0 px-1.5 py-0.5"
              style={{
                fontFamily: 'var(--rs-font-mono)',
                border: '1px solid var(--rs-white)',
                color: 'var(--rs-white)',
                fontSize: '0.6rem',
                letterSpacing: '1px',
                borderRadius: '0px',
              }}
            >
              队长
            </span>
          )}
          <span
            className="shrink-0 px-1.5 py-0.5"
            style={{
              fontFamily: 'var(--rs-font-mono)',
              backgroundColor: 'var(--rs-gray-dark)',
              color: 'var(--rs-gray-light)',
              fontSize: '0.65rem',
              letterSpacing: '1px',
              borderRadius: '0px',
            }}
          >
            {agent.agentRole}
          </span>
          <span
            className="ml-auto text-xs tabular-nums"
            style={{
              fontFamily: 'var(--rs-font-mono)',
              color: 'var(--rs-gray)',
            }}
          >
            ({elapsed}s)
          </span>
        </div>

        {/* Animated typing dots */}
        <div className="flex items-center gap-1.5">
          <span
            style={{
              fontFamily: 'var(--rs-font-mono)',
              color: 'var(--rs-gray)',
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
                backgroundColor: 'var(--rs-gray-light)',
                animation: `blink 1.2s step-end infinite`,
                animationDelay: `${i * 0.4}s`,
                borderRadius: '0px',
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
  const groups = useSimulationStore((s) => s.groups);
  const groupIds = groups.length > 0 ? groups.map(g => g.groupId) : [];

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
      style={{ backgroundColor: 'var(--rs-black)' }}
    >
      {/* Group Tabs */}
      <div
        className="flex shrink-0 overflow-x-auto"
        style={{ borderBottom: '1px solid var(--rs-gray-dark)' }}
      >
        {groupIds.length === 0 ? (
          <div
            className="flex-1 px-2 py-2.5 text-center"
            style={{
              fontFamily: 'var(--rs-font-mono)',
              fontSize: '0.75rem',
              letterSpacing: '2px',
              color: 'var(--rs-gray)',
            }}
          >
            LOADING GROUPS...
          </div>
        ) : groupIds.map((groupId) => {
          const isActive = groupId === activeGroupTab;
          const unread = getUnreadCount(groupId);
          const isTypingInGroup = hasGroupTyping(groupId);
          const manyGroups = groupIds.length > 6;

          return (
            <button
              key={groupId}
              type="button"
              onClick={() => handleTabClick(groupId)}
              className="relative flex-1 cursor-pointer px-2 py-2.5 text-center transition-all duration-200"
              style={{
                fontFamily: 'var(--rs-font-display)',
                fontSize: manyGroups ? '0.75rem' : '1rem',
                letterSpacing: manyGroups ? '1px' : '2px',
                minWidth: manyGroups ? undefined : undefined,
                backgroundColor: 'var(--rs-black)',
                color: isActive ? 'var(--rs-white)' : 'var(--rs-gray)',
                border: '1px solid var(--rs-gray-dark)',
                borderColor: isActive ? 'var(--rs-white)' : 'var(--rs-gray-dark)',
                borderRadius: '0px',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = 'var(--rs-gray-light)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = 'var(--rs-gray-dark)';
                }
              }}
            >
              组 {groupId}
              {/* Typing indicator dot on inactive tab */}
              {isTypingInGroup && (
                <span
                  className="absolute top-0.5 right-0.5 h-2 w-2"
                  style={{
                    backgroundColor: 'var(--rs-gray-light)',
                    animation: 'pulse 1.5s ease-in-out infinite',
                    borderRadius: '0px',
                  }}
                />
              )}
              {/* Unread badge */}
              {unread > 0 && (
                <span
                  className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center text-xs"
                  style={{
                    fontFamily: 'var(--rs-font-mono)',
                    backgroundColor: 'var(--rs-white)',
                    color: 'var(--rs-black)',
                    fontSize: '0.6rem',
                    borderRadius: '0px',
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
                className="text-lg"
                style={{
                  fontFamily: 'var(--rs-font-mono)',
                  color: 'var(--rs-gray)',
                  letterSpacing: '2px',
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
                      backgroundColor: 'var(--rs-gray-light)',
                      opacity: 0.4,
                      animation: `blink 1.5s step-end infinite`,
                      animationDelay: `${i * 0.5}s`,
                      borderRadius: '0px',
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
                      fontFamily: 'var(--rs-font-mono)',
                      color: 'var(--rs-gray)',
                      backgroundColor: 'var(--rs-charcoal)',
                      borderBottom: '1px solid var(--rs-gray-dark)',
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
