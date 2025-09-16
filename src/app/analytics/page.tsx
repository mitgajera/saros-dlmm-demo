"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { MetricCard } from "@/components/MetricCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatUSD, formatPercentage } from "@/lib/saros-config";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  Target,
  Shield,
  Zap
} from "lucide-react";

interface PortfolioMetrics {
  totalValue: number;
  totalFees: number;
  totalPositions: number;
  activePositions: number;
  pnl24h: number;
  pnl7d: number;
  pnl30d: number;
  apy: number;
  riskScore: number;
}

interface PositionAnalytics {
  position: {
    position: string;
    pair: string;
    totalShares: string;
    totalX: string;
    totalY: string;
    totalValueUSD: number;
    feesEarned: number;
  };
  metrics: {
    valueChange24h: number;
    valueChange7d: number;
    valueChange30d: number;
    feeEfficiency: number;
    concentrationRisk: number;
    impermanentLoss: number;
  };
}

export default function AnalyticsPage() {
  const { publicKey } = useWallet();
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
  const [positionAnalytics, setPositionAnalytics] = useState<PositionAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey) return;
    
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        
        // Mock data - in production, use real portfolio service
        const mockMetrics: PortfolioMetrics = {
          totalValue: 12450.67,
          totalFees: 234.89,
          totalPositions: 8,
          activePositions: 6,
          pnl24h: 125.45,
          pnl7d: 456.78,
          pnl30d: 1234.56,
          apy: 0.184,
          riskScore: 35
        };
        
        const mockPositionAnalytics: PositionAnalytics[] = [
          {
            position: {
              position: "pos1",
              pair: "SOL/USDC",
              totalShares: "1000",
              totalX: "5.5",
              totalY: "550",
              totalValueUSD: 1100,
              feesEarned: 12.34
            },
            metrics: {
              valueChange24h: 0.025,
              valueChange7d: 0.045,
              valueChange30d: 0.123,
              feeEfficiency: 0.011,
              concentrationRisk: 0.3,
              impermanentLoss: 0.02
            }
          },
          {
            position: {
              position: "pos2",
              pair: "BONK/SOL",
              totalShares: "2000",
              totalX: "1000000",
              totalY: "0.8",
              totalValueUSD: 800,
              feesEarned: 8.90
            },
            metrics: {
              valueChange24h: -0.015,
              valueChange7d: 0.032,
              valueChange30d: 0.089,
              feeEfficiency: 0.011,
              concentrationRisk: 0.6,
              impermanentLoss: 0.05
            }
          }
        ];
        
        setMetrics(mockMetrics);
        setPositionAnalytics(mockPositionAnalytics);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [publicKey]);

  if (!publicKey) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="p-4 bg-muted rounded-full">
          <BarChart3 className="h-12 w-12 text-muted-foreground" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold">Connect Your Wallet</h2>
          <p className="text-muted-foreground">Connect your wallet to view portfolio analytics</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="p-4 bg-destructive/10 rounded-full">
          <AlertTriangle className="h-12 w-12 text-destructive" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold">Error Loading Analytics</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Portfolio Analytics</h1>
        <p className="text-muted-foreground">Comprehensive analysis of your DLMM positions</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Value"
          value={formatUSD(metrics!.totalValue)}
          hint="Portfolio value"
          trend={`+${formatPercentage(metrics!.pnl24h / metrics!.totalValue)}`}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <MetricCard
          title="24h P&L"
          value={formatUSD(metrics!.pnl24h)}
          hint="Daily profit/loss"
          trend={metrics!.pnl24h >= 0 ? "+" : ""}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <MetricCard
          title="Fees Earned"
          value={formatUSD(metrics!.totalFees)}
          hint="Total fees collected"
          icon={<Activity className="h-4 w-4" />}
        />
        <MetricCard
          title="APY"
          value={formatPercentage(metrics!.apy)}
          hint="Annualized yield"
          icon={<Target className="h-4 w-4" />}
        />
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="7d P&L"
          value={formatUSD(metrics!.pnl7d)}
          hint="Weekly performance"
          trend={metrics!.pnl7d >= 0 ? "+" : ""}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <MetricCard
          title="30d P&L"
          value={formatUSD(metrics!.pnl30d)}
          hint="Monthly performance"
          trend={metrics!.pnl30d >= 0 ? "+" : ""}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <MetricCard
          title="Risk Score"
          value={`${metrics!.riskScore}/100`}
          hint="Portfolio risk level"
          icon={<Shield className="h-4 w-4" />}
        />
      </div>

      {/* Position Analytics */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Position Analytics</h2>
        <div className="grid gap-6">
          {positionAnalytics.map((pos, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Target className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{pos.position.pair}</CardTitle>
                      <CardDescription>
                        Position Value: {formatUSD(pos.position.totalValueUSD)}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">24h Change</div>
                    <div className={`text-lg font-semibold ${
                      pos.metrics.valueChange24h >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatPercentage(pos.metrics.valueChange24h)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">7d Change</div>
                    <div className={`font-semibold ${
                      pos.metrics.valueChange7d >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatPercentage(pos.metrics.valueChange7d)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">30d Change</div>
                    <div className={`font-semibold ${
                      pos.metrics.valueChange30d >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatPercentage(pos.metrics.valueChange30d)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Fee Efficiency</div>
                    <div className="font-semibold">{formatPercentage(pos.metrics.feeEfficiency)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Concentration Risk</div>
                    <div className="font-semibold">{formatPercentage(pos.metrics.concentrationRisk)}</div>
                  </div>
                </div>
              </CardContent>
              
              <div className="mt-4 pt-4 border-t">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Impermanent Loss</div>
                    <div className="font-semibold text-orange-600">
                      {formatPercentage(pos.metrics.impermanentLoss)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Fees Earned</div>
                    <div className="font-semibold">{formatUSD(pos.position.feesEarned)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Total Shares</div>
                    <div className="font-semibold">{pos.position.totalShares}</div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Risk Analysis */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Risk Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                Portfolio Risk Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Overall Risk Score</span>
                <span className="font-semibold">{metrics!.riskScore}/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Max Drawdown</span>
                <span className="font-semibold">-12.5%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Volatility</span>
                <span className="font-semibold">18.2%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sharpe Ratio</span>
                <span className="font-semibold">1.45</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-1 bg-yellow-100 dark:bg-yellow-900 rounded-full mt-1">
                  <AlertTriangle className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <div className="font-medium">High Concentration Risk</div>
                  <div className="text-sm text-muted-foreground">Consider diversifying your BONK/SOL position</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-1 bg-green-100 dark:bg-green-900 rounded-full mt-1">
                  <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="font-medium">Good Fee Efficiency</div>
                  <div className="text-sm text-muted-foreground">Your positions are generating healthy fees</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-1 bg-blue-100 dark:bg-blue-900 rounded-full mt-1">
                  <Target className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="font-medium">Consider Rebalancing</div>
                  <div className="text-sm text-muted-foreground">Some positions may benefit from rebalancing</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
