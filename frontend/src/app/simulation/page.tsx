'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useSimulationStore } from '@/stores/simulation-store';
import { PhaseIndicator } from '@/components/PhaseIndicator';
import { ChatSidebar } from '@/components/ChatSidebar';

const GameCanvas = dynamic(() => import('@/components/game/GameCanvas').then((m) => m.GameCanvas), {
  ssr: false,
  loading: () => (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{ backgroundColor: '#0F0F23' }}
    >
      <p
        className="pixel-blink text-lg"
        style={{
          fontFamily: 'var(--font-pixel-body)',
          color: '#A78BFA',
        }}
      >
        加载游戏画面...
      </p>
    </div>
  ),
});

export default function SimulationPage() {
  const router = useRouter();
  const simulationId = useSimulationStore((s) => s.simulationId);
  const currentPhase = useSimulationStore((s) => s.currentPhase);
  const activeGroupTab = useSimulationStore((s) => s.activeGroupTab);
  const results = useSimulationStore((s) => s.results);
  const messages = useSimulationStore((s) => s.messages);
  const connectSSE = useSimulationStore((s) => s.connectSSE);
  const disconnect = useSimulationStore((s) => s.disconnect);

  // Redirect to home if no simulation is active
  useEffect(() => {
    if (!simulationId) {
      router.replace('/');
    }
  }, [simulationId, router]);

  // Connect SSE on mount
  useEffect(() => {
    if (simulationId) {
      connectSSE(simulationId);
    }
    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulationId]);

  // Navigate to results when simulation completes
  useEffect(() => {
    if (results.length > 0) {
      router.push('/result');
    }
  }, [results, router]);

  // Derive the speaking agent from the last message in the active group
  const activeMessages = messages.get(activeGroupTab) ?? [];
  const lastMessage = activeMessages.length > 0
    ? activeMessages[activeMessages.length - 1]
    : null;
  const speakingAgentId =
    lastMessage?.type === 'message' && lastMessage.agent
      ? lastMessage.agent.id
      : null;
  const speakingText =
    lastMessage?.type === 'message' ? lastMessage.content : undefined;

  if (!simulationId) {
    return null;
  }

  return (
    <div
      className="crt-overlay flex h-screen flex-col"
      style={{ backgroundColor: '#0F0F23' }}
    >
      {/* Phase indicator top bar */}
      <PhaseIndicator currentPhase={currentPhase} />

      {/* Main content: game + chat */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: Game Canvas (~60%) */}
        <div
          className="flex w-[60%] items-center justify-center p-4"
          style={{ backgroundColor: '#0F0F23' }}
        >
          <GameCanvas
            currentPhase={currentPhase}
            activeGroupId={activeGroupTab}
            speakingAgentId={speakingAgentId}
            speakingText={speakingText}
          />
        </div>

        {/* Right panel: Chat Sidebar (~40%) */}
        <div
          className="w-[40%] border-l"
          style={{ borderColor: 'rgba(124, 58, 237, 0.3)' }}
        >
          <ChatSidebar />
        </div>
      </div>
    </div>
  );
}
