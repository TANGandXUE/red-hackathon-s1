import { create } from 'zustand';
import type {
  SimulationMessage,
  GroupInfo,
  GroupResult,
  TypingAgent,
} from '@/types/simulation';
import * as api from '@/services/api';
import { API_URL } from '@/services/api';
import { getAvatarUrl } from '@/lib/avatar';

interface SimulationState {
  simulationId: string | null;
  currentPhase: number;
  groups: GroupInfo[];
  messages: Map<number, SimulationMessage[]>;
  results: GroupResult[];
  activeGroupTab: number;
  isRunning: boolean;
  eventSource: EventSource | null;
  /** Per-group currently-typing agent (null = no one typing) */
  typingAgents: Map<number, TypingAgent | null>;

  startSimulation: (ideas: string[]) => Promise<void>;
  addMessage: (msg: SimulationMessage) => void;
  setPhase: (phase: number) => void;
  setResults: (results: GroupResult[]) => void;
  setActiveGroupTab: (tab: number) => void;
  setTypingAgent: (groupId: number, agent: TypingAgent | null) => void;
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
  typingAgents: new Map(),

  startSimulation: async (ideas: string[]) => {
    const { simulationId } = await api.startSimulation(ideas);
    set({ simulationId, isRunning: true, messages: new Map(), results: [], currentPhase: 1, activeGroupTab: 1, typingAgents: new Map() });
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

  setTypingAgent: (groupId: number, agent: TypingAgent | null) => {
    const current = get().typingAgents.get(groupId) ?? null;
    if (current?.agentId === agent?.agentId && !current === !agent) return;
    set((state) => {
      const next = new Map(state.typingAgents);
      next.set(groupId, agent);
      return { typingAgents: next };
    });
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
            // Note: typing indicator is cleared by the agent_typing(isTyping:false) event,
            // which fires before the message event. No need to clear here.

            const msg: SimulationMessage = {
              type: 'message',
              groupId: raw.groupId,
              phase: raw.phase,
              content: raw.content,
              agent: {
                id: raw.agentId ?? raw.agent?.id ?? '',
                name: raw.agentName ?? raw.agent?.name ?? '',
                avatar: getAvatarUrl(raw.agentId ?? ''),
                role: raw.agentRole ?? raw.agent?.role ?? '',
                isLeader: raw.isLeader ?? false,
              },
            };
            get().addMessage(msg);
            break;
          }
          case 'agent_typing': {
            const groupId = raw.groupId as number;
            if (raw.isTyping) {
              get().setTypingAgent(groupId, {
                groupId,
                agentId: raw.agentId ?? '',
                agentName: raw.agentName ?? '',
                agentRole: raw.agentRole ?? '',
                isLeader: raw.isLeader ?? false,
                startedAt: Date.now(),
              });
            } else {
              get().setTypingAgent(groupId, null);
            }
            break;
          }
          case 'tool_call': {
            const gid = raw.groupId as number;
            const toolMsg: SimulationMessage = {
              type: 'tool_call',
              groupId: gid,
              content: raw.status === 'calling'
                ? `🔍 正在搜索：${raw.toolInput}...`
                : `✅ 搜索完成：${raw.toolInput}`,
              agent: {
                id: raw.agentId ?? '',
                name: raw.agentName ?? '',
                avatar: getAvatarUrl(raw.agentId ?? ''),
                role: '',
                isLeader: false,
              },
            };
            if (raw.status === 'completed') {
              // Replace the 'calling' entry instead of appending
              set((state) => {
                const msgs = new Map(state.messages);
                const arr = [...(msgs.get(gid) ?? [])];
                const idx = arr.findLastIndex((m) => m.type === 'tool_call');
                if (idx >= 0) arr[idx] = toolMsg;
                else arr.push(toolMsg);
                msgs.set(gid, arr);
                return { messages: msgs };
              });
            } else {
              get().addMessage(toolMsg);
            }
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
      typingAgents: new Map(),
    });
  },
}));
