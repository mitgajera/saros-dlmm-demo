
import { MetricCard } from "@/components/MetricCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { 
  BarChart3, 
  Scale, 
  TrendingUp, 
  Target, 
  TestTube, 
  MessageSquare,
  ArrowRight,
  Activity,
  DollarSign,
  TrendingDown,
  CheckCircle,
  Clock,
  Plus
} from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center space-y-6 py-12">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl gradient-text">
            Saros DLMM Demo
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Build the future of DeFi with Saros DLMM SDKs. A comprehensive demo showcasing 
            real-world usage of position management, automated rebalancing, limit orders, 
            and advanced analytics.
          </p>
        </div>
        <div className="flex justify-center gap-2">
          <Badge variant="secondary" className="px-3 py-1">
            @saros-finance/dlmm-sdk
          </Badge>
          <Badge variant="secondary" className="px-3 py-1">
            @saros-finance/sdk
          </Badge>
          <Badge variant="success" className="px-3 py-1">
            Production Ready
          </Badge>
        </div>
      </section>

      {/* Key Metrics */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Total Value Locked" 
          value="$12,450.67" 
          hint="Real-time portfolio value"
          trend="+5.2%"
          icon={<DollarSign className="h-4 w-4" />}
        />
        <MetricCard 
          title="Fees Earned" 
          value="$234.89" 
          hint="24h fee collection"
          trend="+12.1%"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <MetricCard 
          title="Active Positions" 
          value="8" 
          hint="Across 3 trading pairs"
          icon={<Target className="h-4 w-4" />}
        />
        <MetricCard 
          title="APY" 
          value="18.4%" 
          hint="Annualized yield"
          trend="+2.3%"
          icon={<Activity className="h-4 w-4" />}
        />
      </section>

      {/* Feature Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="group hover:shadow-lg transition-all duration-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-lg">Portfolio Analytics</CardTitle>
            </div>
            <CardDescription>
              Real-time position tracking, PnL analysis, and risk metrics.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground">
              <Link href="/analytics" className="flex items-center gap-2">
                View Analytics
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Scale className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle className="text-lg">Smart Rebalancing</CardTitle>
            </div>
            <CardDescription>
              Automated rebalancing with multiple strategies and risk management.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground">
              <Link href="/rebalance" className="flex items-center gap-2">
                Rebalance Now
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-lg">Limit Orders</CardTitle>
            </div>
            <CardDescription>
              Advanced order types including stop-loss using DLMM bins.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground">
              <Link href="/orders" className="flex items-center gap-2">
                Manage Orders
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Target className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <CardTitle className="text-lg">Position Management</CardTitle>
            </div>
            <CardDescription>
              Create, modify, and close LP positions with advanced strategies.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground">
              <Link href="/positions" className="flex items-center gap-2">
                View Positions
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-100 dark:bg-cyan-900 rounded-lg">
                <TestTube className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <CardTitle className="text-lg">Strategy Simulator</CardTitle>
            </div>
            <CardDescription>
              Backtest and simulate LP strategies with historical data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground">
              <Link href="/simulator" className="flex items-center gap-2">
                Run Simulation
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-100 dark:bg-pink-900 rounded-lg">
                <MessageSquare className="h-5 w-5 text-pink-600 dark:text-pink-400" />
              </div>
              <CardTitle className="text-lg">Telegram Bot</CardTitle>
            </div>
            <CardDescription>
              Manage positions and get alerts via Telegram integration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground">
              <Link href="/telegram" className="flex items-center gap-2">
                Connect Bot
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Quick Actions */}
      <section className="bg-gradient-to-r from-primary/10 to-blue-600/10 p-8 rounded-xl border">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Quick Actions</h2>
          <p className="text-muted-foreground">Get started with these common tasks</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/positions" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                View All Positions
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/rebalance" className="flex items-center gap-2">
                <Scale className="h-4 w-4" />
                Smart Rebalance
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Portfolio Analytics
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/simulator" className="flex items-center gap-2">
                <TestTube className="h-4 w-4" />
                Strategy Simulator
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Recent Activity</h2>
          <Button variant="ghost" size="sm">
            View All
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
        <div className="space-y-3">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-1 bg-green-100 dark:bg-green-900 rounded-full">
                    <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm font-medium">Position rebalanced successfully</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  2 minutes ago
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-1 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <TrendingUp className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm font-medium">Limit order filled at $102.45</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  15 minutes ago
                </div>
      </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-1 bg-purple-100 dark:bg-purple-900 rounded-full">
                    <Plus className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-sm font-medium">New position created: SOL/USDC</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  1 hour ago
                </div>
              </div>
            </CardContent>
          </Card>
      </div>
      </section>
    </div>
  );
}
