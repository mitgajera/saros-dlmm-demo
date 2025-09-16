
"use client";
import { useWallet } from "@solana/wallet-adapter-react";
import { useState, useEffect } from "react";
import { RebalanceForm } from "@/components/RebalanceForm";
import { 
  makeCenteredDistribution, 
  makeSingleSidedX, 
  makeSingleSidedY,
  makeMomentumDistribution,
  makeMeanReversionDistribution,
  makeVolatilityAdjustedDistribution,
  makeConservativeDistribution,
  makeAggressiveDistribution,
  validateDistribution,
  getDistributionMetrics
} from "@/lib/dlmm";
import { formatUSD, formatPercentage, getConnection } from "@/lib/saros-config";
import { dlmmService } from "@/lib/dlmm-service";
import { Button } from "@/components/ui/button";
import { Lock, AlertTriangle } from "lucide-react";

interface RebalancePlan {
  withdraw_percent_bps: number;
  distribution_bps_sum: number;
  bins: Array<{ binRelativeId: number; bpsX: number; bpsY: number }>;
  strategy: string;
  riskScore: number;
  expectedFees: number;
  gasEstimate: number;
}

interface Position {
  id: string;
  pair: string;
  value: number;
  fees: number;
  risk: number;
}

export default function RebalancePage() {
  const { publicKey } = useWallet();
  const [plan, setPlan] = useState<RebalancePlan | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey) return;
    
    // Mock positions data - in production, fetch from DLMM service
    const mockPositions: Position[] = [
      { id: 'pos1', pair: 'SOL/USDC', value: 1100, fees: 12.34, risk: 0.3 },
      { id: 'pos2', pair: 'BONK/SOL', value: 800, fees: 8.90, risk: 0.6 },
      { id: 'pos3', pair: 'USDC/USDT', value: 500, fees: 2.15, risk: 0.1 }
    ];
    
    setPositions(mockPositions);
  }, [publicKey]);

  async function onSubmit({ 
    shape, 
    percent, 
    width, 
    strategy, 
    riskTolerance 
  }: { 
    shape: any; 
    percent: number; 
    width: number;
    strategy?: string;
    riskTolerance?: string;
  }) {
    try {
      setLoading(true);
      setError(null);

      let dist;
      const strategyName = strategy || 'centered';
      
      switch (shape) {
        case "SINGLE_SIDED_X":
          dist = makeSingleSidedX(width);
          break;
        case "SINGLE_SIDED_Y":
          dist = makeSingleSidedY(width);
          break;
        case "MOMENTUM":
          dist = makeMomentumDistribution(width, 0.05); // 5% momentum
          break;
        case "MEAN_REVERSION":
          dist = makeMeanReversionDistribution(width, 0.03); // 3% deviation
          break;
        case "VOLATILITY_ADJUSTED":
          dist = makeVolatilityAdjustedDistribution(width, 0.02); // 2% volatility
          break;
        case "CONSERVATIVE":
          dist = makeConservativeDistribution(width);
          break;
        case "AGGRESSIVE":
          dist = makeAggressiveDistribution(width);
          break;
        default:
          dist = makeCenteredDistribution(width);
      }

      // Validate distribution
      if (!validateDistribution(dist)) {
        throw new Error('Invalid distribution: total BPS must equal 10000');
      }

      // Get distribution metrics
      const metrics = getDistributionMetrics(dist);
      
      // Calculate expected fees (0.3% of position value)
      const positionValue = selectedPosition ? 
        positions.find(p => p.id === selectedPosition)?.value || 0 : 1000;
      const expectedFees = positionValue * 0.003;
      
      // Estimate gas costs
      const gasEstimate = 0.005; // 0.005 SOL

      const summary: RebalancePlan = {
        withdraw_percent_bps: percent * 100,
        distribution_bps_sum: dist.reduce((s, d) => s + d.bpsX + d.bpsY, 0),
        bins: dist,
        strategy: strategyName,
        riskScore: metrics.concentration * 100,
        expectedFees,
        gasEstimate
      };
      
      setPlan(summary);

      // TODO: In production, execute the rebalance transaction
      // 1) compute sharesToRemove from current position (percent)
      // 2) call decrease_position(sharesToRemove)
      // 3) call increase_position(amountX, amountY, distribution)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rebalance failed');
    } finally {
      setLoading(false);
    }
  }

  const executeRebalance = async () => {
    if (!plan) return;
    if (!publicKey) return;
    if (!selectedPosition) {
      setError('Please select a position first');
      return;
    }
    try {
      setLoading(true);
      await dlmmService.initialize();
      const tx = await dlmmService.rebalancePosition({
        position: new (await import('@solana/web3.js')).PublicKey(selectedPosition),
        withdrawPercent: plan.withdraw_percent_bps / 10000,
        newDistribution: plan.bins,
        user: publicKey
      });
      const signature = await (async () => {
        // Prefer wallet adapter's sendTransaction if available
        // @ts-ignore
        if (typeof (window as any).solana?.signAndSendTransaction === 'function') {
          const connection = getConnection();
          // @ts-ignore
          return await (window as any).solana.signAndSendTransaction(tx);
        }
        const { sendTransaction } = useWallet();
        const connection = getConnection();
        // @ts-ignore
        return await sendTransaction(tx, connection);
      })();
      console.log('Rebalance tx sent:', signature);
      setPlan(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Execution failed');
    } finally {
      setLoading(false);
    }
  };

  if (!publicKey) {
    return (
      <div className="text-center py-12 space-y-2">
        <div className="mx-auto w-12 h-12 rounded bg-muted flex items-center justify-center">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-semibold">Connect Your Wallet</h2>
        <p className="text-muted-foreground">Connect your wallet to rebalance positions</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Smart Rebalancing</h1>
        <p className="text-slate-600">Automated rebalancing with multiple strategies and risk management</p>
      </div>

      {/* Position Selection */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Select Position to Rebalance</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {positions.map((position) => (
            <div
              key={position.id}
              className={`p-4 border rounded-xl cursor-pointer transition-colors ${
                selectedPosition === position.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedPosition(position.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{position.pair}</h3>
                <div className={`w-3 h-3 rounded-full ${
                  position.risk < 0.3 ? 'bg-green-500' :
                  position.risk < 0.6 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}></div>
              </div>
              <div className="space-y-1 text-sm text-slate-600">
                <div>Value: {formatUSD(position.value)}</div>
                <div>Fees: {formatUSD(position.fees)}</div>
                <div>Risk: {formatPercentage(position.risk)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rebalance Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Rebalance Configuration</h2>
          <RebalanceForm onSubmit={onSubmit} />
        </div>

        {/* Strategy Information */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Strategy Information</h2>
          <div className="space-y-4">
            <div className="border rounded-xl p-4">
              <h3 className="font-semibold text-green-600 mb-2">Centered Strategy</h3>
              <p className="text-sm text-slate-600 mb-2">
                Distributes liquidity evenly around the current price. Best for stable markets.
              </p>
              <ul className="text-xs text-slate-500 space-y-1">
                <li>• Low risk, stable returns</li>
                <li>• Good for beginners</li>
                <li>• Minimal rebalancing needed</li>
              </ul>
            </div>

            <div className="border rounded-xl p-4">
              <h3 className="font-semibold text-blue-600 mb-2">Momentum Strategy</h3>
              <p className="text-sm text-slate-600 mb-2">
                Shifts liquidity in the direction of price momentum. Best in trending markets.
              </p>
              <ul className="text-xs text-slate-500 space-y-1">
                <li>• Higher risk, higher returns</li>
                <li>• Good in trending markets</li>
                <li>• Requires active monitoring</li>
              </ul>
            </div>

            <div className="border rounded-xl p-4">
              <h3 className="font-semibold text-purple-600 mb-2">Mean Reversion Strategy</h3>
              <p className="text-sm text-slate-600 mb-2">
                Counter-trend strategy that profits from price reversals. Best in ranging markets.
              </p>
              <ul className="text-xs text-slate-500 space-y-1">
                <li>• Medium risk, steady returns</li>
                <li>• Good in ranging markets</li>
                <li>• Requires patience</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Rebalance Plan */}
      {plan && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Rebalance Plan</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatPercentage(plan.withdraw_percent_bps / 10000)}
              </div>
              <div className="text-sm text-slate-600">Withdraw %</div>
            </div>
            <div className="border rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {plan.bins.length}
              </div>
              <div className="text-sm text-slate-600">Active Bins</div>
            </div>
            <div className="border rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {plan.riskScore.toFixed(1)}
              </div>
              <div className="text-sm text-slate-600">Risk Score</div>
            </div>
            <div className="border rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {formatUSD(plan.expectedFees)}
              </div>
              <div className="text-sm text-slate-600">Expected Fees</div>
            </div>
          </div>

          <div className="border rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Distribution Details</h3>
            <div className="space-y-2">
              {plan.bins.map((bin, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium">
                      {bin.binRelativeId}
                    </div>
                    <div>
                      <div className="font-medium">Bin {bin.binRelativeId}</div>
                      <div className="text-sm text-slate-600">
                        {bin.bpsX > 0 && `X: ${formatPercentage(bin.bpsX / 10000)}`}
                        {bin.bpsX > 0 && bin.bpsY > 0 && ' | '}
                        {bin.bpsY > 0 && `Y: ${formatPercentage(bin.bpsY / 10000)}`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {formatPercentage((bin.bpsX + bin.bpsY) / 10000)}
                    </div>
                    <div className="text-sm text-slate-500">Total</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={executeRebalance}
              disabled={loading}
              className="px-8"
            >
              {loading ? 'Executing...' : 'Execute Rebalance'}
            </Button>
            <Button
              onClick={() => setPlan(null)}
              variant="outline"
              className="px-8"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="text-center py-12 space-y-2">
          <div className="mx-auto w-12 h-12 rounded bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <h2 className="text-2xl font-semibold">Rebalance Error</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      )}
    </div>
  );
}
