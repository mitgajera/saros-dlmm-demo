import { Connection, PublicKey } from '@solana/web3.js';

// Network configuration
export const NETWORKS = {
  devnet: {
    rpc: process.env.NEXT_PUBLIC_RPC_URL || 'https://devnet.helius-rpc.com/?api-key=64b0059a-d3be-45fc-9dcd-089702a15a3f',
    name: 'Devnet',
    active: true
  },
  mainnet: {
    rpc: 'https://api.mainnet-beta.solana.com',
    name: 'Mainnet',
    active: false
  }
} as const;

export type Network = keyof typeof NETWORKS;

// Default configuration
export const DEFAULT_CONFIG = {
  network: 'devnet' as Network,
  commitment: 'confirmed' as const,
  timeout: 30000,
  retries: 3
};

// Cached connection instance
let connection: Connection | null = null;

export function getConnection(network: Network = DEFAULT_CONFIG.network): Connection {
  if (!connection || connection.rpcEndpoint !== NETWORKS[network].rpc) {
    connection = new Connection(NETWORKS[network].rpc, {
      commitment: DEFAULT_CONFIG.commitment,
      confirmTransactionInitialTimeout: DEFAULT_CONFIG.timeout
    });
  }
  return connection;
}

// Note: DLMM and Saros higher-level clients are instantiated in their respective services.

// Common token addresses (Devnet)
export const TOKEN_ADDRESSES = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'
} as const;

// Popular trading pairs
export const TRADING_PAIRS = {
  'SOL/USDC': {
    base: TOKEN_ADDRESSES.SOL,
    quote: TOKEN_ADDRESSES.USDC,
    name: 'SOL/USDC',
    active: true
  },
  'BONK/SOL': {
    base: TOKEN_ADDRESSES.BONK,
    quote: TOKEN_ADDRESSES.SOL,
    name: 'BONK/SOL',
    active: true
  },
  'USDC/USDT': {
    base: TOKEN_ADDRESSES.USDC,
    quote: TOKEN_ADDRESSES.USDT,
    name: 'USDC/USDT',
    active: true
  }
} as const;

// Error handling utilities
export class SarosError extends Error {
  constructor(
    message: string,
    public code?: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'SarosError';
  }
}

export function handleSarosError(error: unknown): SarosError {
  if (error instanceof SarosError) {
    return error;
  }
  
  if (error instanceof Error) {
    return new SarosError(
      `Saros operation failed: ${error.message}`,
      'UNKNOWN_ERROR',
      error
    );
  }
  
  return new SarosError(
    'An unknown error occurred',
    'UNKNOWN_ERROR'
  );
}

// Utility functions
export function formatTokenAmount(amount: number, decimals: number = 6): string {
  return (amount / Math.pow(10, decimals)).toFixed(6);
}

export function parseTokenAmount(amount: string, decimals: number = 6): number {
  return Math.floor(parseFloat(amount) * Math.pow(10, decimals));
}

export function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}
