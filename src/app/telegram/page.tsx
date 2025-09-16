"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Smartphone, Lock, AlertTriangle, BarChart3, Scale, TrendingUp } from "lucide-react";
import { formatUSD, formatPercentage } from "@/lib/saros-config";

interface TelegramBot {
  id: string;
  name: string;
  username: string;
  status: 'connected' | 'disconnected' | 'error';
  lastActivity: Date;
  features: string[];
}

interface BotCommand {
  command: string;
  description: string;
  usage: string;
  example: string;
}

interface Alert {
  id: string;
  type: 'price' | 'rebalance' | 'fee' | 'risk';
  message: string;
  timestamp: Date;
  read: boolean;
}

export default function TelegramPage() {
  const { publicKey } = useWallet();
  const [bot, setBot] = useState<TelegramBot | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSetup, setShowSetup] = useState(false);

  const commands: BotCommand[] = [
    {
      command: '/portfolio',
      description: 'View your portfolio summary',
      usage: '/portfolio',
      example: '/portfolio'
    },
    {
      command: '/positions',
      description: 'List all your LP positions',
      usage: '/positions [pair]',
      example: '/positions SOL/USDC'
    },
    {
      command: '/rebalance',
      description: 'Trigger position rebalancing',
      usage: '/rebalance [position_id] [strategy]',
      example: '/rebalance pos1 momentum'
    },
    {
      command: '/orders',
      description: 'View active limit orders',
      usage: '/orders',
      example: '/orders'
    },
    {
      command: '/create_order',
      description: 'Create a new limit order',
      usage: '/create_order [pair] [side] [amount] [price]',
      example: '/create_order SOL/USDC buy 10 95.50'
    },
    {
      command: '/cancel_order',
      description: 'Cancel an active order',
      usage: '/cancel_order [order_id]',
      example: '/cancel_order order123'
    },
    {
      command: '/analytics',
      description: 'View portfolio analytics',
      usage: '/analytics [period]',
      example: '/analytics 7d'
    },
    {
      command: '/alerts',
      description: 'Manage price alerts',
      usage: '/alerts [action] [pair] [price]',
      example: '/alerts add SOL/USDC 100.00'
    },
    {
      command: '/help',
      description: 'Show all available commands',
      usage: '/help',
      example: '/help'
    }
  ];

  useEffect(() => {
    if (!publicKey) return;
    
    // Mock bot data - in production, fetch from API
    const mockBot: TelegramBot = {
      id: 'bot123',
      name: 'Saros DLMM Bot',
      username: '@saros_dlmm_bot',
      status: 'connected',
      lastActivity: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      features: ['Portfolio Management', 'Order Management', 'Price Alerts', 'Rebalancing']
    };
    
    const mockAlerts: Alert[] = [
      {
        id: 'alert1',
        type: 'price',
        message: 'SOL/USDC price reached $102.50',
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        read: false
      },
      {
        id: 'alert2',
        type: 'rebalance',
        message: 'Position rebalanced successfully',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        read: true
      },
      {
        id: 'alert3',
        type: 'fee',
        message: 'Fees earned: $12.34 in the last 24h',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        read: true
      },
      {
        id: 'alert4',
        type: 'risk',
        message: 'High concentration risk detected in BONK/SOL position',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        read: false
      }
    ];
    
    setBot(mockBot);
    setAlerts(mockAlerts);
  }, [publicKey]);

  const connectBot = async () => {
    try {
      setLoading(true);
      // Mock bot connection - in production, integrate with Telegram API
      await new Promise(resolve => setTimeout(resolve, 2000));
      setShowSetup(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect bot');
    } finally {
      setLoading(false);
    }
  };

  const disconnectBot = async () => {
    try {
      setLoading(true);
      // Mock bot disconnection
      await new Promise(resolve => setTimeout(resolve, 1000));
      setBot(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect bot');
    } finally {
      setLoading(false);
    }
  };

  const markAlertAsRead = (alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, read: true } : alert
      )
    );
  };

  if (!publicKey) {
    return (
      <div className="text-center py-12 space-y-2">
        <div className="mx-auto w-12 h-12 rounded bg-muted flex items-center justify-center">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Connect Your Wallet</h2>
        <p className="text-muted-foreground">Connect your wallet to manage Telegram bot</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Telegram Bot Integration</h1>
        <p className="text-slate-600">Manage your DLMM positions and get real-time alerts via Telegram</p>
      </div>

      {/* Bot Status */}
      {bot ? (
        <div className="border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Smartphone className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{bot.name}</h2>
                <p className="text-slate-600">{bot.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1 rounded-full text-sm ${
                bot.status === 'connected' ? 'bg-green-100 text-green-800' :
                bot.status === 'disconnected' ? 'bg-gray-100 text-gray-800' :
                'bg-red-100 text-red-800'
              }`}>
                {bot.status.toUpperCase()}
              </div>
              <Button
                onClick={disconnectBot}
                disabled={loading}
                variant="outline"
              >
                Disconnect
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-slate-600">Last Activity</div>
              <div className="font-medium">{bot.lastActivity.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-slate-600">Features</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {bot.features.map((feature, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 border rounded-xl">
          <div className="mx-auto w-12 h-12 rounded bg-muted flex items-center justify-center mb-4">
            <Smartphone className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">No Bot Connected</h2>
          <p className="text-slate-600 mb-6">Connect a Telegram bot to manage your positions remotely</p>
          <Button
            onClick={() => setShowSetup(true)}
            className="px-6"
          >
            Connect Bot
          </Button>
        </div>
      )}

      {/* Bot Setup */}
      {showSetup && (
        <div className="border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Bot Setup</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Bot Token</label>
              <input
                type="text"
                placeholder="Enter your bot token from @BotFather"
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Chat ID</label>
              <input
                type="text"
                placeholder="Enter your Telegram chat ID"
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={connectBot}
                disabled={loading}
                className="px-6"
              >
                {loading ? 'Connecting...' : 'Connect Bot'}
              </Button>
              <Button
                onClick={() => setShowSetup(false)}
                variant="outline"
                className="px-6"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Commands Reference */}
      {bot && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Available Commands</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {commands.map((cmd, index) => (
              <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <code className="bg-slate-100 px-2 py-1 rounded text-sm font-mono">
                    {cmd.command}
                  </code>
                </div>
                <p className="text-sm text-slate-600 mb-2">{cmd.description}</p>
                <div className="text-xs text-slate-500">
                  <div><strong>Usage:</strong> {cmd.usage}</div>
                  <div><strong>Example:</strong> {cmd.example}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alerts */}
      {bot && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Recent Alerts</h2>
            <div className="text-sm text-slate-600">
              {alerts.filter(a => !a.read).length} unread
            </div>
          </div>
          
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${
                  alert.read ? 'bg-slate-50' : 'bg-blue-50 border-blue-200'
                }`}
                onClick={() => markAlertAsRead(alert.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      alert.type === 'price' ? 'bg-green-500' :
                      alert.type === 'rebalance' ? 'bg-blue-500' :
                      alert.type === 'fee' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}></div>
                    <div>
                      <div className="font-medium">{alert.message}</div>
                      <div className="text-sm text-slate-500">
                        {alert.timestamp.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  {!alert.read && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {bot && (
        <div className="bg-gradient-to-r from-primary/10 to-blue-600/10 p-6 rounded-xl border">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="p-4 h-auto justify-start text-left">
              <div className="mr-3 p-2 rounded bg-blue-500/10"><BarChart3 className="h-4 w-4 text-blue-600" /></div>
              <div>
                <div className="font-medium">View Portfolio</div>
                <div className="text-sm text-muted-foreground">Send /portfolio to bot</div>
              </div>
            </Button>
            <Button variant="outline" className="p-4 h-auto justify-start text-left">
              <div className="mr-3 p-2 rounded bg-purple-500/10"><Scale className="h-4 w-4 text-purple-600" /></div>
              <div>
                <div className="font-medium">Rebalance Positions</div>
                <div className="text-sm text-muted-foreground">Send /rebalance to bot</div>
              </div>
            </Button>
            <Button variant="outline" className="p-4 h-auto justify-start text-left">
              <div className="mr-3 p-2 rounded bg-green-500/10"><TrendingUp className="h-4 w-4 text-green-600" /></div>
              <div>
                <div className="font-medium">Create Order</div>
                <div className="text-sm text-muted-foreground">Send /create_order to bot</div>
              </div>
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="text-center py-12 space-y-2">
          <div className="mx-auto w-12 h-12 rounded bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Error</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      )}
    </div>
  );
}
