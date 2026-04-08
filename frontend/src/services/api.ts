import type { SimulationResult, GroupInfo } from '@/types/simulation';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function startSimulation(ideas: string[]): Promise<{ simulationId: string }> {
  const res = await fetch(`${API_URL}/api/simulation/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ideas }),
  });
  if (!res.ok) throw new Error('Failed to start simulation');
  return res.json();
}

export async function getSimulationStatus(id: string): Promise<{ id: string; phase: number; status: string; groups: GroupInfo[] }> {
  const res = await fetch(`${API_URL}/api/simulation/${id}/status`);
  if (!res.ok) throw new Error('Failed to get status');
  return res.json();
}

export async function getSimulationResult(id: string): Promise<SimulationResult> {
  const res = await fetch(`${API_URL}/api/simulation/${id}/result`);
  if (!res.ok) throw new Error('Failed to get result');
  return res.json();
}
