"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Lock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatUSD, formatPercentage } from "@/lib/saros-config";

interface SimulationParams {
  initialCapital: number;
  strategy: 'passive' | 'active' | 'momentum' | 'mean_reversion';
  duration: number;
  rebalanceFrequency: number;
  riskTolerance: 'low' | 'medium' | 'high';
  pair: string;
}

interface SimulationResult {
  finalValue: number;
  totalReturn: number;
  annualizedReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  winRate: number;
  totalFees: number;
  netReturn: number;
  dailyReturns: number[];
  portfolioValues: number[];
  rebalanceEvents: RebalanceEvent[];
  metrics: {
    volatility: number;
    calmarRatio: number;
    sortinoRatio: number;
    var95: number;
    cvar95: number;
  };
}

interface RebalanceEvent {
  timestamp: Date;
  action: 'rebalance' | 'add_liquidity' | 'remove_liquidity';
  amount: number;
  price: number;
  reason: string;
}

export default function SimulatorPage() {
  const { publicKey } = useWallet();
  const [params, setParams] = useState<SimulationParams>({
    initialCapital: 10000,
    strategy: 'passive',
    duration: 30,
    rebalanceFrequency: 24,
    riskTolerance: 'medium',
    pair: 'SOL/USDC'
  });
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSimulation = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock simulation - in production, use real strategy simulator
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing
      
      const mockResult: SimulationResult = {
        finalValue: params.initialCapital * (1 + Math.random() * 0.3 - 0.1), // ±10-30% return
        totalReturn: Math.random() * 0.3 - 0.1,
        annualizedReturn: Math.random() * 0.4 - 0.1,
        maxDrawdown: Math.random() * 0.2,
        sharpeRatio: Math.random() * 2 + 0.5,
        winRate: Math.random() * 0.4 + 0.5,
        totalFees: params.initialCapital * 0.01,
        netReturn: Math.random() * 0.3 - 0.1,
        dailyReturns: Array.from({ length: params.duration }, () => (Math.random() - 0.5) * 0.1),
        portfolioValues: Array.from({ length: params.duration + 1 }, (_, i) => 
          params.initialCapital * (1 + (Math.random() - 0.5) * 0.1 * i / params.duration)
        ),
        rebalanceEvents: [
          {
            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            action: 'rebalance',
            amount: params.initialCapital * 0.1,
            price: 100,
            reason: 'Volatility threshold exceeded'
          },
          {
            timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            action: 'rebalance',
            amount: params.initialCapital * 0.05,
            price: 98.5,
            reason: 'Weekly rebalance'
          }
        ],
        metrics: {
          volatility: Math.random() * 0.3 + 0.1,
          calmarRatio: Math.random() * 3 + 1,
          sortinoRatio: Math.random() * 2 + 1,
          var95: -(Math.random() * 0.1 + 0.02),
          cvar95: -(Math.random() * 0.15 + 0.03)
        }
      };
      
      setResult(mockResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Simulation failed');
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
        <h2 className="text-2xl font-semibold mb-2">Connect Your Wallet</h2>
        <p className="text-muted-foreground">Connect your wallet to run simulations</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Strategy Simulator</h1>
        <p className="text-slate-600">Backtest and simulate LP strategies with historical data</p>
      </div>

      {/* Simulation Parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Simulation Parameters</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Initial Capital</label>
              <input
                type="number"
                value={params.initialCapital}
                onChange={(e) => setParams(prev => ({ ...prev, initialCapital: Number(e.target.value) }))}
                className="w-full border rounded-lg px-3 py-2"
                min="1000"
                max="1000000"
                step="1000"
                placeholder="Enter initial capital"
                aria-label="Initial capital amount"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Strategy</label>
              <select
                value={params.strategy}
                onChange={(e) => setParams(prev => ({ ...prev, strategy: e.target.value as any }))}
                className="w-full border rounded-lg px-3 py-2"
                aria-label="Select simulation strategy"
              >
                <option value="passive">Passive (Low Frequency)</option>
                <option value="active">Active (High Frequency)</option>
                <option value="momentum">Momentum (Trend Following)</option>
                <option value="mean_reversion">Mean Reversion (Counter-trend)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Duration (Days)</label>
              <input
                type="number"
                value={params.duration}
                onChange={(e) => setParams(prev => ({ ...prev, duration: Number(e.target.value) }))}
                className="w-full border rounded-lg px-3 py-2"
                min="7"
                max="365"
                placeholder="Enter duration in days"
                aria-label="Simulation duration in days"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Rebalance Frequency (Hours)</label>
              <input
                type="number"
                value={params.rebalanceFrequency}
                onChange={(e) => setParams(prev => ({ ...prev, rebalanceFrequency: Number(e.target.value) }))}
                className="w-full border rounded-lg px-3 py-2"
                min="1"
                max="168"
                placeholder="Enter rebalance frequency"
                aria-label="Rebalance frequency in hours"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Risk Tolerance</label>
              <select
                value={params.riskTolerance}
                onChange={(e) => setParams(prev => ({ ...prev, riskTolerance: e.target.value as any }))}
                className="w-full border rounded-lg px-3 py-2"
                aria-label="Select risk tolerance level"
              >
                <option value="low">Low (Conservative)</option>
                <option value="medium">Medium (Balanced)</option>
                <option value="high">High (Aggressive)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Trading Pair</label>
              <select
                value={params.pair}
                onChange={(e) => setParams(prev => ({ ...prev, pair: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2"
                aria-label="Select trading pair"
              >
                <option value="SOL/USDC">SOL/USDC</option>
                <option value="BONK/SOL">BONK/SOL</option>
                <option value="USDC/USDT">USDC/USDT</option>
              </select>
            </div>
            
            <Button
              onClick={runSimulation}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Running Simulation...' : 'Run Simulation'}
            </Button>
          </div>
        </div>

        {/* Strategy Description */}
        <div className="border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Strategy Description</h2>
          <div className="space-y-4">
            {params.strategy === 'passive' && (
              <div>
                <h3 className="font-medium text-green-600 mb-2">Passive Strategy</h3>
                <p className="text-sm text-slate-600">
                  Minimal rebalancing with weekly adjustments. Low fees, stable returns, 
                  suitable for long-term investors who prefer a hands-off approach.
                </p>
                <ul className="text-xs text-slate-500 mt-2 space-y-1">
                  <li>• Rebalances weekly or on high volatility</li>
                  <li>• Low transaction costs</li>
                  <li>• Stable, predictable returns</li>
                </ul>
              </div>
            )}
            
            {params.strategy === 'active' && (
              <div>
                <h3 className="font-medium text-blue-600 mb-2">Active Strategy</h3>
                <p className="text-sm text-slate-600">
                  Frequent rebalancing based on volatility thresholds. Higher fees but 
                  potentially better risk-adjusted returns for active traders.
                </p>
                <ul className="text-xs text-slate-500 mt-2 space-y-1">
                  <li>• Rebalances on volatility spikes</li>
                  <li>• Higher transaction costs</li>
                  <li>• Better risk management</li>
                </ul>
              </div>
            )}
            
            {params.strategy === 'momentum' && (
              <div>
                <h3 className="font-medium text-purple-600 mb-2">Momentum Strategy</h3>
                <p className="text-sm text-slate-600">
                  Follows price trends by shifting liquidity in the direction of momentum. 
                  Best in trending markets, can underperform in sideways markets.
                </p>
                <ul className="text-xs text-slate-500 mt-2 space-y-1">
                  <li>• Shifts liquidity with trends</li>
                  <li>• Good in trending markets</li>
                  <li>• Can underperform in sideways markets</li>
                </ul>
              </div>
            )}
            
            {params.strategy === 'mean_reversion' && (
              <div>
                <h3 className="font-medium text-orange-600 mb-2">Mean Reversion Strategy</h3>
                <p className="text-sm text-slate-600">
                  Counter-trend strategy that shifts liquidity opposite to recent price movements. 
                  Best in ranging markets, can struggle in strong trends.
                </p>
                <ul className="text-xs text-slate-500 mt-2 space-y-1">
                  <li>• Counter-trend positioning</li>
                  <li>• Good in ranging markets</li>
                  <li>• Can struggle in strong trends</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Simulation Results */}
      {result && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Simulation Results</h2>
          
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatUSD(result.finalValue)}
              </div>
              <div className="text-sm text-slate-600">Final Value</div>
            </div>
            <div className="border rounded-xl p-4 text-center">
              <div className={`text-2xl font-bold ${
                result.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatPercentage(result.totalReturn)}
              </div>
              <div className="text-sm text-slate-600">Total Return</div>
            </div>
            <div className="border rounded-xl p-4 text-center">
              <div className={`text-2xl font-bold ${
                result.annualizedReturn >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatPercentage(result.annualizedReturn)}
              </div>
              <div className="text-sm text-slate-600">Annualized Return</div>
            </div>
            <div className="border rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                -{formatPercentage(result.maxDrawdown)}
              </div>
              <div className="text-sm text-slate-600">Max Drawdown</div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {result.sharpeRatio.toFixed(2)}
              </div>
              <div className="text-sm text-slate-600">Sharpe Ratio</div>
            </div>
            <div className="border rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatPercentage(result.winRate)}
              </div>
              <div className="text-sm text-slate-600">Win Rate</div>
            </div>
            <div className="border rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {formatUSD(result.totalFees)}
              </div>
              <div className="text-sm text-slate-600">Total Fees</div>
            </div>
            <div className="border rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatPercentage(result.metrics.volatility)}
              </div>
              <div className="text-sm text-slate-600">Volatility</div>
            </div>
          </div>

          {/* Advanced Metrics */}
          <div className="border rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Advanced Risk Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-slate-600">Calmar Ratio</div>
                <div className="font-semibold">{result.metrics.calmarRatio.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-slate-600">Sortino Ratio</div>
                <div className="font-semibold">{result.metrics.sortinoRatio.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-slate-600">VaR 95%</div>
                <div className="font-semibold text-red-600">
                  {formatPercentage(result.metrics.var95)}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-600">CVaR 95%</div>
                <div className="font-semibold text-red-600">
                  {formatPercentage(result.metrics.cvar95)}
                </div>
              </div>
            </div>
          </div>

          {/* Rebalance Events */}
          <div className="border rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Rebalance Events</h3>
            <div className="space-y-2">
              {result.rebalanceEvents.map((event, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <div className="font-medium">{event.action.replace('_', ' ').toUpperCase()}</div>
                      <div className="text-sm text-slate-600">{event.reason}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{formatUSD(event.amount)}</div>
                    <div className="text-xs text-slate-500">
                      {event.timestamp.toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="text-center py-12 space-y-2">
          <div className="mx-auto w-12 h-12 rounded bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Simulation Error</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      )}
    </div>
  );
}
