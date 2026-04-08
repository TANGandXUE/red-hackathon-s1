import { create } from 'zustand';
import type {
  SimulationMessage,
  GroupInfo,
  GroupResult,
} from '@/types/simulation';
import * as api from '@/services/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface SimulationState {
  simulationId: string | null;
  currentPhase: number;
  groups: GroupInfo[];
  messages: Map<number, SimulationMessage[]>;
  results: GroupResult[];
  activeGroupTab: number;
  isRunning: boolean;
  eventSource: EventSource | null;

  startSimulation: (ideas: string[]) => Promise<void>;
  addMessage: (msg: SimulationMessage) => void;
  setPhase: (phase: number) => void;
  setResults: (results: GroupResult[]) => void;
  setActiveGroupTab: (tab: number) => void;
  connectSSE: (simulationId: string) => void;
  disconnect: () => void;
  reset: () => void;
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  simulationId: null,
  currentPhase: 0,
  groups: [],
  messages: new Map(),
  results: [],
  activeGroupTab: 1,
  isRunning: false,
  eventSource: null,

  startSimulation: async (ideas: string[]) => {
    const { simulationId } = await api.startSimulation(ideas);
    set({ simulationId, isRunning: true, messages: new Map(), results: [], currentPhase: 1, activeGroupTab: 1 });
    get().connectSSE(simulationId);
  },

  addMessage: (msg: SimulationMessage) => {
    const groupId = msg.groupId ?? 0;
    set((state) => {
      const newMessages = new Map(state.messages);
      const existing = newMessages.get(groupId) ?? [];
      newMessages.set(groupId, [...existing, msg]);
      return { messages: newMessages };
    });
  },

  setPhase: (phase: number) => {
    set({ currentPhase: phase });
  },

  setResults: (results: GroupResult[]) => {
    set({ results });
  },

  setActiveGroupTab: (tab: number) => {
    set({ activeGroupTab: tab });
  },

  connectSSE: (simulationId: string) => {
    const existing = get().eventSource;
    if (existing) {
      existing.close();
    }

    const es = new EventSource(`${API_URL}/api/simulation/${simulationId}/stream`);

    es.onmessage = (event) => {
      try {
        const raw = JSON.parse(event.data);

        switch (raw.type) {
          case 'message': {
            // Transform backend flat format to frontend SimulationMessage
            const msg: SimulationMessage = {
              type: 'message',
              groupId: raw.groupId,
              phase: raw.phase,
              content: raw.content,
              agent: {
                id: raw.agentId ?? raw.agent?.id ?? '',
                name: raw.agentName ?? raw.agent?.name ?? '',
                avatar: (raw.agentId ?? '').startsWith('judge')
                  ? `/avatars/oc-1.jpeg`
                  : `/avatars/oc-${(raw.agentId ?? '').match(/\d+/)?.[0] ?? '1'}.jpeg`,
                role: raw.agentRole ?? raw.agent?.role ?? '',
              },
            };
            get().addMessage(msg);
            break;
          }
          case 'phase_change':
            if (raw.phase !== undefined) {
              get().setPhase(raw.phase);
            }
            break;
          case 'complete':
            api.getSimulationResult(simulationId).then((result) => {
              get().setResults(result.results);
              set({ isRunning: false });
            });
            get().disconnect();
            break;
        }
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      get().disconnect();
      set({ isRunning: false });
    };

    set({ eventSource: es });
  },

  disconnect: () => {
    const es = get().eventSource;
    if (es) {
      es.close();
      set({ eventSource: null });
    }
  },

  reset: () => {
    get().disconnect();
    set({
      simulationId: null,
      currentPhase: 0,
      groups: [],
      messages: new Map(),
      results: [],
      activeGroupTab: 1,
      isRunning: false,
      eventSource: null,
    });
  },
}));
