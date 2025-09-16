
import { NextRequest } from "next/server";

// TODO: Replace mock with actual Saros LB API proxy when endpoint available.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const user = url.searchParams.get("user_id") || "unknown";
  const data = {
    user_id: user,
    positions: [
      { pair_id: "SOL/USDC", tvl_usd: 1234.56, est_fees_usd: 12.34, bins: 13 },
      { pair_id: "BONK/SOL", tvl_usd: 456.78, est_fees_usd: 2.1, bins: 7 }
    ]
  };
  return Response.json(data, { status: 200 });
}
