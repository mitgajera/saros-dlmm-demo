
// Client-side fetchers for Next API routes (proxy/mocks).
// Replace with real Saros LB endpoints as needed.

export async function fetchPoolPositions(user: string, pairId?: string) {
  const params = new URLSearchParams({ user_id: user, page_num: "1", page_size: "100" });
  if (pairId) params.append("pair_id", pairId);
  const res = await fetch(`/api/pool-position?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch pool positions");
  return res.json();
}

export async function fetchBinPositions(user: string, pairId?: string) {
  const params = new URLSearchParams({ user_id: user, page_num: "1", page_size: "100" });
  if (pairId) params.append("pair_id", pairId);
  const res = await fetch(`/api/bin-position?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch bin positions");
  return res.json();
}
