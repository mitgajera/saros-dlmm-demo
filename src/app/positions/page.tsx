
"use client";
import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { formatUSD, formatPercentage } from "@/lib/saros-config";
import { dlmmService } from "@/lib/dlmm-service";
import { Button } from "@/components/ui/button";
import { Target, Scale, BarChart3, Lock, AlertTriangle } from "lucide-react";

interface Position {
  id: string;
  pair: string;
  totalShares: string;
  totalX: string;
  totalY: string;
  totalValueUSD: number;
  feesEarned: number;
  bins: BinPosition[];
  risk: number;
  apy: number;
  impermanentLoss: number;
}

interface BinPosition {
  binId: number;
  price: string;
  liquidity: string;
  feeRate: number;
  active: boolean;
}

export default function PositionsPage() {
  const { publicKey } = useWallet();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey) return;
    
    const fetchPositions = async () => {
      try {
        setLoading(true);
        await dlmmService.initialize();
        const data = await dlmmService.getUserPositions(publicKey);
        const mapped: Position[] = data.map((p) => ({
          id: p.position.toBase58(),
          pair: p.pair,
          totalShares: p.totalShares,
          totalX: p.totalX,
          totalY: p.totalY,
          totalValueUSD: p.totalValueUSD,
          feesEarned: p.feesEarned,
          bins: p.bins,
          // Simple derived metrics from real data
          risk: Math.min(0.99, p.bins.length > 0 ? 1 / Math.sqrt(p.bins.length) : 0.5),
          apy: 0, // Will be computed in analytics; not faked here
          impermanentLoss: 0 // Requires historical price; omitted here
        }));

        setPositions(mapped);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch positions');
      } finally {
        setLoading(false);
      }
    };

    fetchPositions();
  }, [publicKey]);

  if (!publicKey) {
    return (
      <div className="text-center py-12 space-y-2">
        <div className="mx-auto w-12 h-12 rounded bg-muted flex items-center justify-center">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-semibold">Connect Your Wallet</h2>
        <p className="text-muted-foreground">Connect your wallet to view positions</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12 space-y-2">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground">Loading positions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 space-y-2">
        <div className="mx-auto w-12 h-12 rounded bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <h2 className="text-2xl font-semibold">Error Loading Positions</h2>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Position Management</h1>
        <p className="text-slate-600">Manage your LP positions across multiple trading pairs</p>
      </div>

      {/* Position Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{positions.length}</div>
          <div className="text-sm text-slate-600">Total Positions</div>
        </div>
        <div className="border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {formatUSD(positions.reduce((sum, pos) => sum + pos.totalValueUSD, 0))}
          </div>
          <div className="text-sm text-slate-600">Total Value</div>
        </div>
        <div className="border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {formatUSD(positions.reduce((sum, pos) => sum + pos.feesEarned, 0))}
          </div>
          <div className="text-sm text-slate-600">Fees Earned</div>
        </div>
        <div className="border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {formatPercentage(positions.reduce((sum, pos) => sum + pos.apy, 0) / positions.length)}
          </div>
          <div className="text-sm text-slate-600">Avg APY</div>
        </div>
      </div>

      {/* Positions List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Your Positions</h2>
        <div className="space-y-4">
          {positions.map((position) => (
            <div key={position.id} className="border rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-lg font-semibold">{position.pair.split('/')[0][0]}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{position.pair}</h3>
                    <p className="text-sm text-slate-600">Position ID: {position.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-full text-sm ${
                    position.risk < 0.3 ? 'bg-green-100 text-green-800' :
                    position.risk < 0.6 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    Risk: {formatPercentage(position.risk)}
                  </div>
                  <button
                    onClick={() => setSelectedPosition(
                      selectedPosition === position.id ? null : position.id
                    )}
                    className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    {selectedPosition === position.id ? 'Hide Details' : 'View Details'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-slate-600">Total Value</div>
                  <div className="font-semibold">{formatUSD(position.totalValueUSD)}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600">Fees Earned</div>
                  <div className="font-semibold text-green-600">{formatUSD(position.feesEarned)}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600">APY</div>
                  <div className="font-semibold text-blue-600">{formatPercentage(position.apy)}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600">Impermanent Loss</div>
                  <div className="font-semibold text-orange-600">{formatPercentage(position.impermanentLoss)}</div>
                </div>
              </div>

              {/* Position Details */}
              {selectedPosition === position.id && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-semibold mb-4">Position Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-medium mb-2">Token Holdings</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Total Shares</span>
                          <span className="font-medium">{position.totalShares}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Token X</span>
                          <span className="font-medium">{position.totalX}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Token Y</span>
                          <span className="font-medium">{position.totalY}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium mb-2">Bin Distribution</h5>
                      <div className="space-y-1">
                        {position.bins.map((bin, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-slate-600">Bin {bin.binId}</span>
                            <span className="font-medium">
                              {formatUSD(parseFloat(bin.price))} - {bin.liquidity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-primary/10 to-blue-600/10 p-6 rounded-xl border">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="outline" className="p-4 h-auto justify-start text-left">
            <div className="mr-3 p-2 rounded bg-primary/10"><Target className="h-4 w-4 text-primary" /></div>
            <div>
              <div className="font-medium">Create New Position</div>
              <div className="text-sm text-muted-foreground">Add liquidity to a new trading pair</div>
            </div>
          </Button>
          <Button variant="outline" className="p-4 h-auto justify-start text-left">
            <div className="mr-3 p-2 rounded bg-purple-500/10"><Scale className="h-4 w-4 text-purple-600" /></div>
            <div>
              <div className="font-medium">Rebalance Positions</div>
              <div className="text-sm text-muted-foreground">Optimize your liquidity distribution</div>
            </div>
          </Button>
          <Button variant="outline" className="p-4 h-auto justify-start text-left">
            <div className="mr-3 p-2 rounded bg-blue-500/10"><BarChart3 className="h-4 w-4 text-blue-600" /></div>
            <div>
              <div className="font-medium">View Analytics</div>
              <div className="text-sm text-muted-foreground">Analyze performance and risk</div>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}
