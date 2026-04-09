/** Derive avatar image URL from an agent ID like "oc-5" or "judge-1" */
export function getAvatarUrl(agentId: string): string {
  const match = agentId.match(/(\d+)/);
  const num = match ? parseInt(match[1], 10) : 1;
  return `/avatars/oc-${num}.webp`;
}
