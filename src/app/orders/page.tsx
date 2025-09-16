"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { formatUSD, formatPercentage } from "@/lib/saros-config";

interface LimitOrder {
  id: string;
  pair: string;
  side: 'buy' | 'sell';
  amount: number;
  price: number;
  binId: number;
  status: 'pending' | 'filled' | 'cancelled' | 'expired';
  createdAt: Date;
  expiresAt?: Date;
  filledAt?: Date;
  filledAmount?: number;
  filledPrice?: number;
}

interface StopLossOrder {
  id: string;
  position: string;
  triggerPrice: number;
  amount: number;
  status: 'active' | 'triggered' | 'cancelled';
  createdAt: Date;
  triggeredAt?: Date;
}

interface OrderBookEntry {
  price: number;
  amount: number;
  binId: number;
  side: 'buy' | 'sell';
}

export default function OrdersPage() {
  const { publicKey } = useWallet();
  const [limitOrders, setLimitOrders] = useState<LimitOrder[]>([]);
  const [stopLossOrders, setStopLossOrders] = useState<StopLossOrder[]>([]);
  const [orderBook, setOrderBook] = useState<{ bids: OrderBookEntry[]; asks: OrderBookEntry[] }>({ bids: [], asks: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [selectedPair, setSelectedPair] = useState('SOL/USDC');

  useEffect(() => {
    if (!publicKey) return;
    
    const fetchOrders = async () => {
      try {
        setLoading(true);
        
        // Mock data - in production, use real limit order service
        const mockLimitOrders: LimitOrder[] = [
          {
            id: 'order1',
            pair: 'SOL/USDC',
            side: 'buy',
            amount: 10,
            price: 95.50,
            binId: -5,
            status: 'pending',
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000) // 22 hours from now
          },
          {
            id: 'order2',
            pair: 'SOL/USDC',
            side: 'sell',
            amount: 5,
            price: 105.25,
            binId: 5,
            status: 'filled',
            createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
            filledAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
            filledAmount: 5,
            filledPrice: 105.20
          },
          {
            id: 'order3',
            pair: 'BONK/SOL',
            side: 'buy',
            amount: 1000000,
            price: 0.0000125,
            binId: -3,
            status: 'cancelled',
            createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
          }
        ];
        
        const mockStopLossOrders: StopLossOrder[] = [
          {
            id: 'sl1',
            position: 'pos1',
            triggerPrice: 90.00,
            amount: 15,
            status: 'active',
            createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
          },
          {
            id: 'sl2',
            position: 'pos2',
            triggerPrice: 0.0000100,
            amount: 500000,
            status: 'triggered',
            createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
            triggeredAt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
          }
        ];
        
        const mockOrderBook = {
          bids: [
            { price: 99.50, amount: 25, binId: -1, side: 'buy' as const },
            { price: 99.00, amount: 15, binId: -2, side: 'buy' as const },
            { price: 98.50, amount: 30, binId: -3, side: 'buy' as const },
            { price: 98.00, amount: 20, binId: -4, side: 'buy' as const },
            { price: 97.50, amount: 35, binId: -5, side: 'buy' as const }
          ],
          asks: [
            { price: 100.50, amount: 20, binId: 1, side: 'sell' as const },
            { price: 101.00, amount: 25, binId: 2, side: 'sell' as const },
            { price: 101.50, amount: 15, binId: 3, side: 'sell' as const },
            { price: 102.00, amount: 30, binId: 4, side: 'sell' as const },
            { price: 102.50, amount: 20, binId: 5, side: 'sell' as const }
          ]
        };
        
        setLimitOrders(mockLimitOrders);
        setStopLossOrders(mockStopLossOrders);
        setOrderBook(mockOrderBook);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [publicKey]);

  const handleCancelOrder = async (orderId: string) => {
    // Mock cancel order
    setLimitOrders(prev => 
      prev.map(order => 
        order.id === orderId 
          ? { ...order, status: 'cancelled' as const }
          : order
      )
    );
  };

  const handleCancelStopLoss = async (orderId: string) => {
    // Mock cancel stop loss
    setStopLossOrders(prev => 
      prev.map(order => 
        order.id === orderId 
          ? { ...order, status: 'cancelled' as const }
          : order
      )
    );
  };

  if (!publicKey) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔐</div>
        <h2 className="text-2xl font-semibold mb-2">Connect Your Wallet</h2>
        <p className="text-slate-600">Connect your wallet to manage orders</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Loading orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-2xl font-semibold mb-2">Error Loading Orders</h2>
        <p className="text-slate-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Order Management</h1>
          <p className="text-slate-600">Manage limit orders and stop-loss orders</p>
        </div>
        <button
          onClick={() => setShowCreateOrder(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Order
        </button>
      </div>

      {/* Order Book */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Order Book - {selectedPair}</h2>
          <div className="space-y-2">
            <div className="text-sm text-slate-600 grid grid-cols-3 gap-4">
              <span>Price</span>
              <span>Amount</span>
              <span>Bin ID</span>
            </div>
            {orderBook.asks.slice().reverse().map((ask, index) => (
              <div key={index} className="grid grid-cols-3 gap-4 text-sm">
                <span className="text-red-600 font-medium">{formatUSD(ask.price)}</span>
                <span>{ask.amount}</span>
                <span className="text-slate-500">+{ask.binId}</span>
              </div>
            ))}
            <div className="border-t pt-2">
              <div className="text-center text-sm text-slate-500">Spread: $1.00</div>
            </div>
            {orderBook.bids.map((bid, index) => (
              <div key={index} className="grid grid-cols-3 gap-4 text-sm">
                <span className="text-green-600 font-medium">{formatUSD(bid.price)}</span>
                <span>{bid.amount}</span>
                <span className="text-slate-500">{bid.binId}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Market Stats</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-slate-600">Current Price</span>
              <span className="font-semibold">{formatUSD(100.00)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">24h Volume</span>
              <span className="font-semibold">{formatUSD(1250000)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">24h Change</span>
              <span className="font-semibold text-green-600">+2.5%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Liquidity</span>
              <span className="font-semibold">{formatUSD(5000000)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Fee Rate</span>
              <span className="font-semibold">0.3%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Limit Orders */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Limit Orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4">Pair</th>
                <th className="text-left p-4">Side</th>
                <th className="text-left p-4">Amount</th>
                <th className="text-left p-4">Price</th>
                <th className="text-left p-4">Bin ID</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Created</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {limitOrders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-slate-50">
                  <td className="p-4 font-medium">{order.pair}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-sm ${
                      order.side === 'buy' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {order.side.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4">{order.amount}</td>
                  <td className="p-4 font-medium">{formatUSD(order.price)}</td>
                  <td className="p-4 text-slate-500">{order.binId}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-sm ${
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'filled' ? 'bg-green-100 text-green-800' :
                      order.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {order.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-500">
                    {order.createdAt.toLocaleString()}
                  </td>
                  <td className="p-4">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stop Loss Orders */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Stop Loss Orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4">Position</th>
                <th className="text-left p-4">Trigger Price</th>
                <th className="text-left p-4">Amount</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Created</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {stopLossOrders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-slate-50">
                  <td className="p-4 font-medium">{order.position}</td>
                  <td className="p-4 font-medium">{formatUSD(order.triggerPrice)}</td>
                  <td className="p-4">{order.amount}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-sm ${
                      order.status === 'active' ? 'bg-green-100 text-green-800' :
                      order.status === 'triggered' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-500">
                    {order.createdAt.toLocaleString()}
                  </td>
                  <td className="p-4">
                    {order.status === 'active' && (
                      <button
                        onClick={() => handleCancelStopLoss(order.id)}
                        className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{limitOrders.length}</div>
          <div className="text-sm text-slate-600">Total Orders</div>
        </div>
        <div className="border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {limitOrders.filter(o => o.status === 'filled').length}
          </div>
          <div className="text-sm text-slate-600">Filled Orders</div>
        </div>
        <div className="border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {limitOrders.filter(o => o.status === 'pending').length}
          </div>
          <div className="text-sm text-slate-600">Pending Orders</div>
        </div>
        <div className="border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{stopLossOrders.length}</div>
          <div className="text-sm text-slate-600">Stop Loss Orders</div>
        </div>
      </div>
    </div>
  );
}
