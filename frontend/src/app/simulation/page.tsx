'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSimulationStore } from '@/stores/simulation-store';
import { PhaseIndicator } from '@/components/PhaseIndicator';
import { ChatSidebar } from '@/components/ChatSidebar';
import { RosterGrid } from '@/components/RosterGrid';

/* ------------------------------------------------------------------ */
/*  Phase labels                                                       */
/* ------------------------------------------------------------------ */

const PHASE_LABELS: Record<number, string> = {
  0: 'GROUPING',
  1: 'DISCUSSION',
  2: 'DEVELOPMENT',
  3: 'DEFENSE',
};

/* ------------------------------------------------------------------ */
/*  Status Bar                                                         */
/* ------------------------------------------------------------------ */

function StatusBar({
  currentPhase,
  activatedCount,
  totalCount,
}: {
  currentPhase: number;
  activatedCount: number;
  totalCount: number;
}) {
  const phaseLabel = PHASE_LABELS[currentPhase] ?? `PHASE ${currentPhase}`;
  const statusText =
    activatedCount < totalCount
      ? 'ACTIVATING AGENTS...'
      : totalCount > 0
        ? 'ALL AGENTS ONLINE'
        : 'AWAITING AGENTS';

  return (
    <div className="status-bar justify-between">
      <span>{phaseLabel}</span>
      <span>
        {activatedCount} / {totalCount} ACTIVATED
      </span>
      <span>{statusText}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Simulation Page                                                    */
/* ------------------------------------------------------------------ */

export default function SimulationPage() {
  const router = useRouter();
  const simulationId = useSimulationStore((s) => s.simulationId);
  const currentPhase = useSimulationStore((s) => s.currentPhase);
  const activeGroupTab = useSimulationStore((s) => s.activeGroupTab);
  const results = useSimulationStore((s) => s.results);
  const groups = useSimulationStore((s) => s.groups);
  const typingAgents = useSimulationStore((s) => s.typingAgents);
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

  // Derive speaking agent from typing agents for active group
  const typingAgent = typingAgents.get(activeGroupTab) ?? null;
  const speakingAgentId = typingAgent?.agentId ?? null;

  // Total member count across all groups
  const totalMembers = groups.reduce((acc, g) => acc + g.members.length, 0);

  if (!simulationId) {
    return null;
  }

  // Loading state: no groups yet
  if (groups.length === 0) {
    return (
      <div
        className="flex h-screen items-center justify-center"
        style={{ background: 'var(--rs-black)' }}
      >
        <span
          className="font-mono uppercase"
          style={{
            fontSize: 13,
            letterSpacing: 4,
            color: 'var(--rs-gray)',
          }}
        >
          INITIALIZING...
        </span>
      </div>
    );
  }

  return (
    <div
      className="flex h-screen flex-col"
      style={{ background: 'var(--rs-black)' }}
    >
      {/* Status bar */}
      <StatusBar
        currentPhase={currentPhase}
        activatedCount={totalMembers}
        totalCount={totalMembers}
      />

      {/* Phase indicator */}
      <PhaseIndicator currentPhase={currentPhase} />

      {/* Main content: roster + chat */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: Roster Grid (~60%) */}
        <div className="w-[60%] overflow-auto">
          <RosterGrid
            groups={groups}
            currentPhase={currentPhase}
            activeGroupId={activeGroupTab}
            speakingAgentId={speakingAgentId}
          />
        </div>

        {/* Right panel: Chat Sidebar (~40%) */}
        <div
          className="w-[40%] border-l"
          style={{ borderColor: 'var(--rs-gray-dark)' }}
        >
          <ChatSidebar />
        </div>
      </div>
    </div>
  );
}
