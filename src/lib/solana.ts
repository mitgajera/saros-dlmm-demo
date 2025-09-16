
import { Connection, PublicKey } from "@solana/web3.js";

export function getConnection(): Connection {
  const endpoint = process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com";
  return new Connection(endpoint, "confirmed");
}

export function toPk(s: string): PublicKey {
  return new PublicKey(s);
}
