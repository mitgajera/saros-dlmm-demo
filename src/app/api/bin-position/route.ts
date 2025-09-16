
import { NextRequest } from "next/server";

// TODO: Replace mock with actual Saros LB API proxy when endpoint available.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const user = url.searchParams.get("user_id") || "unknown";
  const bins = Array.from({ length: 7 }, (_, i) => ({
    bin_id: i - 3,
    token_x: (Math.random() * 1).toFixed(4),
    token_y: (Math.random() * 1).toFixed(4),
    shares: (Math.random() * 10).toFixed(3),
    in_range: Math.random() > 0.5
  }));
  return Response.json({ user_id: user, bins }, { status: 200 });
}
