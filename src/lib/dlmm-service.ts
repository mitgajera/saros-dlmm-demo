import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import { 
  getConnection, 
  SarosError, 
  handleSarosError,
  formatTokenAmount,
  formatUSD,
  TOKEN_ADDRESSES,
  TRADING_PAIRS
} from './saros-config';

export interface PositionData {
  position: PublicKey;
  pair: string;
  totalShares: string;
  totalX: string;
  totalY: string;
  totalValueUSD: number;
  feesEarned: number;
  bins: BinPosition[];
}

export interface BinPosition {
  binId: number;
  price: string;
  liquidity: string;
  feeRate: number;
  active: boolean;
}

export interface CreatePositionParams {
  pair: string;
  amountX: number;
  amountY: number;
  distribution: Array<{ binRelativeId: number; bpsX: number; bpsY: number }>;
  user: PublicKey;
}

export interface RebalanceParams {
  position: PublicKey;
  withdrawPercent: number;
  newDistribution: Array<{ binRelativeId: number; bpsX: number; bpsY: number }>;
  user: PublicKey;
}

// Minimal pair type used in this service to avoid tight SDK typing
type LbPairLite = {
  tokenXMint: PublicKey;
  tokenYMint: PublicKey;
  pubkey: PublicKey;
};

export class DLMMService {
  private client: any | null = null;
  private connection = getConnection();

  async initialize(): Promise<void> {
    // SDK wiring happens here at runtime. Using dynamic import keeps build types happy.
    if (this.client) return;
    try {
      const sdk: any = await import('@saros-finance/dlmm-sdk');
      const Candidate = (sdk as any).DLMM || (sdk as any).default || (sdk as any).Client;
      this.client = Candidate ? new Candidate(this.connection) : {};
    } catch (error) {
      // Defer real initialization errors to runtime usage sites
      this.client = {} as any;
      console.warn('DLMM SDK not initialized. Using placeholder client.');
    }
  }

  async getClient(): Promise<any> {
    if (!this.client) {
      await this.initialize();
    }
    return this.client!;
  }

  // Get all available trading pairs
  async getTradingPairs(): Promise<typeof TRADING_PAIRS> {
    return TRADING_PAIRS;
  }

  // Get pair information
  async getPairInfo(pairAddress: string): Promise<LbPairLite | null> {
    try {
      const client = await this.getClient();
      const pair = new PublicKey(pairAddress);
      return await client.getLbPair(pair);
    } catch (error) {
      throw handleSarosError(error);
    }
  }

  // Get user positions
  async getUserPositions(user: PublicKey): Promise<PositionData[]> {
    try {
      const client = await this.getClient();
      const positions = await client.getUserPositions(user);
      
      const positionData: PositionData[] = [];
      
      for (const position of positions) {
        const pairInfo = await this.getPairInfo(position.lbPair.toBase58());
        if (!pairInfo) continue;

        const totalValueUSD = this.calculatePositionValue(position, pairInfo);
        const feesEarned = this.calculateFeesEarned(position, pairInfo);
        
        positionData.push({
          position: position.pubkey,
          pair: this.getPairName(pairInfo.tokenXMint, pairInfo.tokenYMint),
          totalShares: position.totalShares.toString(),
          totalX: position.totalXAmount.toString(),
          totalY: position.totalYAmount.toString(),
          totalValueUSD,
          feesEarned,
          bins: await this.getBinPositions(position.pubkey, pairInfo)
        });
      }
      
      return positionData;
    } catch (error) {
      throw handleSarosError(error);
    }
  }

  // Create new position
  async createPosition(params: CreatePositionParams): Promise<Transaction> {
    try {
      const client = await this.getClient();
      const pairInfo = TRADING_PAIRS[params.pair as keyof typeof TRADING_PAIRS];
      
      if (!pairInfo) {
        throw new SarosError(`Unknown trading pair: ${params.pair}`);
      }

      const pairAddress = await this.findPairAddress(pairInfo.base, pairInfo.quote);
      if (!pairAddress) {
        throw new SarosError(`Pair not found: ${params.pair}`);
      }

      const createParams: any = {
        pair: new PublicKey(pairAddress),
        amountX: BigInt(params.amountX),
        amountY: BigInt(params.amountY),
        distribution: params.distribution,
        user: params.user
      };

      return await client.createPosition(createParams);
    } catch (error) {
      throw handleSarosError(error);
    }
  }

  // Rebalance existing position
  async rebalancePosition(params: RebalanceParams): Promise<Transaction> {
    try {
      const client = await this.getClient();
      
      // First, decrease position by withdrawPercent
      const decreaseTx = await client.decreasePosition({
        position: params.position,
        shares: BigInt(Math.floor(parseInt(params.withdrawPercent.toString()) * 100)), // Convert to basis points
        user: params.user
      });

      // Then, increase position with new distribution
      const increaseTx = await client.increasePosition({
        position: params.position,
        amountX: BigInt(0), // Will be calculated from current balance
        amountY: BigInt(0), // Will be calculated from current balance
        distribution: params.newDistribution,
        user: params.user
      });

      // Combine transactions
      const combinedTx = new Transaction();
      combinedTx.add(...decreaseTx.instructions);
      combinedTx.add(...increaseTx.instructions);
      
      return combinedTx;
    } catch (error) {
      throw handleSarosError(error);
    }
  }

  // Get bin positions for a specific position
  private async getBinPositions(position: PublicKey, pairInfo: LbPairLite): Promise<BinPosition[]> {
    try {
      const client = await this.getClient();
      const bins = await client.getPositionBins(position);
      
      return (bins as any[]).map((bin: any) => ({
        binId: bin.binId,
        price: bin.price.toString(),
        liquidity: bin.liquidity.toString(),
        feeRate: bin.feeRate,
        active: bin.active
      }));
    } catch (error) {
      console.error('Error fetching bin positions:', error);
      return [];
    }
  }

  // Calculate position value in USD
  private calculatePositionValue(position: any, pairInfo: LbPairLite): number {
    // This is a simplified calculation - in production, you'd use real price feeds
    const basePrice = 100; // Mock price for demonstration
    const quotePrice = 1; // Mock price for USDC
    
    const totalXValue = (Number(position.totalXAmount) / Math.pow(10, 9)) * basePrice; // SOL
    const totalYValue = (Number(position.totalYAmount) / Math.pow(10, 6)) * quotePrice; // USDC
    
    return totalXValue + totalYValue;
  }

  // Calculate fees earned
  private calculateFeesEarned(position: any, pairInfo: LbPairLite): number {
    // Simplified calculation - in production, you'd track actual fees
    return Number(position.totalShares) * 0.001; // Mock fee calculation
  }

  // Get pair name from token mints
  private getPairName(tokenX: PublicKey, tokenY: PublicKey): string {
    const tokenXStr = tokenX.toBase58();
    const tokenYStr = tokenY.toBase58();
    try {
      // Try SPL token registry for real symbols
      // Dynamic import to avoid bloating bundle if not needed
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { TokenListProvider } = require('@solana/spl-token-registry');
      const provider = new TokenListProvider();
      return provider.resolve().then((tokens: any) => {
        const list = tokens.getList();
        const x = list.find((t: any) => t.address === tokenXStr);
        const y = list.find((t: any) => t.address === tokenYStr);
        if (x && y) return `${x.symbol}/${y.symbol}`;
        for (const [name, pair] of Object.entries(TRADING_PAIRS)) {
          if (pair.base === tokenXStr && pair.quote === tokenYStr) {
            return name;
          }
        }
        return `${tokenXStr.slice(0, 4)}/${tokenYStr.slice(0, 4)}`;
      });
    } catch {
      for (const [name, pair] of Object.entries(TRADING_PAIRS)) {
        if (pair.base === tokenXStr && pair.quote === tokenYStr) {
          return name;
        }
      }
      return `${tokenXStr.slice(0, 4)}/${tokenYStr.slice(0, 4)}`;
    }
  }

  // Find pair address by token mints
  private async findPairAddress(tokenX: string, tokenY: string): Promise<string | null> {
    try {
      const client = await this.getClient();
      const pairs = await client.getAllLbPairs();
      
      for (const pair of pairs) {
        if (pair.tokenXMint.toBase58() === tokenX && pair.tokenYMint.toBase58() === tokenY) {
          return pair.pubkey.toBase58();
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error finding pair address:', error);
      return null;
    }
  }

  // Get market data for a pair
  async getMarketData(pairAddress: string): Promise<{
    price: string;
    volume24h: string;
    liquidity: string;
    feeRate: number;
  }> {
    try {
      const client = await this.getClient();
      const info = await client.getLbPair(new PublicKey(pairAddress));
      const bins = await client.getActiveBins(new PublicKey(pairAddress));
      const mid = bins && bins.length ? Number(bins[0].price) : 0;
      const liquidity = bins.reduce((acc: number, b: any) => acc + Number(b.liquidity || 0), 0);
      return {
        price: mid ? mid.toFixed(4) : '0',
        volume24h: '0',
        liquidity: liquidity.toString(),
        feeRate: info?.feeRate || 0.003
      };
    } catch (error) {
      throw handleSarosError(error);
    }
  }
}

// Export singleton instance
export const dlmmService = new DLMMService();
