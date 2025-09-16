import { PublicKey, Transaction } from '@solana/web3.js';
import { dlmmService } from './dlmm-service';
import { SarosError, handleSarosError } from './saros-config';

export interface LimitOrder {
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

export interface StopLossOrder {
  id: string;
  position: PublicKey;
  triggerPrice: number;
  amount: number;
  status: 'active' | 'triggered' | 'cancelled';
  createdAt: Date;
  triggeredAt?: Date;
}

export interface OrderBookEntry {
  price: number;
  amount: number;
  binId: number;
  side: 'buy' | 'sell';
}

export class LimitOrderService {
  private orders: Map<string, LimitOrder> = new Map();
  private stopLossOrders: Map<string, StopLossOrder> = new Map();
  private orderBook: Map<string, OrderBookEntry[]> = new Map();

  // Create a limit order
  async createLimitOrder(params: {
    pair: string;
    side: 'buy' | 'sell';
    amount: number;
    price: number;
    user: PublicKey;
    expiresAt?: Date;
  }): Promise<LimitOrder> {
    try {
      const pairInfo = await dlmmService.getPairInfo(params.pair);
      if (!pairInfo) {
        throw new SarosError('Pair not found');
      }

      // Find the appropriate bin for the price
      const binId = this.findBinForPrice(pairInfo, params.price);
      if (binId === -1) {
        throw new SarosError('Price out of range for current bins');
      }

      const orderId = this.generateOrderId();
      const order: LimitOrder = {
        id: orderId,
        pair: params.pair,
        side: params.side,
        amount: params.amount,
        price: params.price,
        binId,
        status: 'pending',
        createdAt: new Date(),
        expiresAt: params.expiresAt
      };

      this.orders.set(orderId, order);
      this.addToOrderBook(order);

      return order;
    } catch (error) {
      throw handleSarosError(error);
    }
  }

  // Create a stop loss order
  async createStopLossOrder(params: {
    position: PublicKey;
    triggerPrice: number;
    amount: number;
    user: PublicKey;
  }): Promise<StopLossOrder> {
    try {
      const orderId = this.generateOrderId();
      const order: StopLossOrder = {
        id: orderId,
        position: params.position,
        triggerPrice: params.triggerPrice,
        amount: params.amount,
        status: 'active',
        createdAt: new Date()
      };

      this.stopLossOrders.set(orderId, order);
      return order;
    } catch (error) {
      throw handleSarosError(error);
    }
  }

  // Cancel a limit order
  async cancelLimitOrder(orderId: string, user: PublicKey): Promise<boolean> {
    try {
      const order = this.orders.get(orderId);
      if (!order) {
        throw new SarosError('Order not found');
      }

      if (order.status !== 'pending') {
        throw new SarosError('Order cannot be cancelled');
      }

      order.status = 'cancelled';
      this.orders.set(orderId, order);
      this.removeFromOrderBook(order);

      return true;
    } catch (error) {
      throw handleSarosError(error);
    }
  }

  // Cancel a stop loss order
  async cancelStopLossOrder(orderId: string, user: PublicKey): Promise<boolean> {
    try {
      const order = this.stopLossOrders.get(orderId);
      if (!order) {
        throw new SarosError('Stop loss order not found');
      }

      if (order.status !== 'active') {
        throw new SarosError('Stop loss order cannot be cancelled');
      }

      order.status = 'cancelled';
      this.stopLossOrders.set(orderId, order);

      return true;
    } catch (error) {
      throw handleSarosError(error);
    }
  }

  // Get user's orders
  async getUserOrders(user: PublicKey): Promise<{
    limitOrders: LimitOrder[];
    stopLossOrders: StopLossOrder[];
  }> {
    // In production, filter by user
    const limitOrders = Array.from(this.orders.values());
    const stopLossOrders = Array.from(this.stopLossOrders.values());

    return { limitOrders, stopLossOrders };
  }

  // Get order book for a pair
  async getOrderBook(pair: string): Promise<{
    bids: OrderBookEntry[];
    asks: OrderBookEntry[];
  }> {
    try {
      const pairInfo = await dlmmService.getPairInfo(pair);
      if (!pairInfo) {
        throw new SarosError('Pair not found');
      }

      // Get current market data
      const marketData = await dlmmService.getMarketData(pair);
      const currentPrice = parseFloat(marketData.price);

      // Generate mock order book based on current price
      const bids: OrderBookEntry[] = [];
      const asks: OrderBookEntry[] = [];

      // Generate bids (buy orders)
      for (let i = 0; i < 10; i++) {
        const price = currentPrice * (1 - (i + 1) * 0.01); // 1% intervals
        const amount = Math.random() * 1000;
        const binId = this.findBinForPrice(pairInfo, price);
        
        if (binId !== -1) {
          bids.push({
            price,
            amount,
            binId,
            side: 'buy'
          });
        }
      }

      // Generate asks (sell orders)
      for (let i = 0; i < 10; i++) {
        const price = currentPrice * (1 + (i + 1) * 0.01); // 1% intervals
        const amount = Math.random() * 1000;
        const binId = this.findBinForPrice(pairInfo, price);
        
        if (binId !== -1) {
          asks.push({
            price,
            amount,
            binId,
            side: 'sell'
          });
        }
      }

      return { bids, asks };
    } catch (error) {
      throw handleSarosError(error);
    }
  }

  // Check for order fills (should be called periodically)
  async checkOrderFills(): Promise<LimitOrder[]> {
    const filledOrders: LimitOrder[] = [];
    
    for (const [orderId, order] of this.orders) {
      if (order.status !== 'pending') continue;
      
      // Check if order should be filled based on current market price
      const marketData = await dlmmService.getMarketData(order.pair);
      const currentPrice = parseFloat(marketData.price);
      
      let shouldFill = false;
      if (order.side === 'buy' && currentPrice <= order.price) {
        shouldFill = true;
      } else if (order.side === 'sell' && currentPrice >= order.price) {
        shouldFill = true;
      }
      
      // Check expiration
      if (order.expiresAt && new Date() > order.expiresAt) {
        order.status = 'expired';
        this.orders.set(orderId, order);
        continue;
      }
      
      if (shouldFill) {
        order.status = 'filled';
        order.filledAt = new Date();
        order.filledAmount = order.amount;
        order.filledPrice = currentPrice;
        
        this.orders.set(orderId, order);
        this.removeFromOrderBook(order);
        filledOrders.push(order);
      }
    }
    
    return filledOrders;
  }

  // Check for stop loss triggers
  async checkStopLossTriggers(): Promise<StopLossOrder[]> {
    const triggeredOrders: StopLossOrder[] = [];
    
    for (const [orderId, order] of this.stopLossOrders) {
      if (order.status !== 'active') continue;
      
      // Get current position value
      const positions = await dlmmService.getUserPositions(order.position);
      const position = positions.find(p => p.position.equals(order.position));
      
      if (!position) continue;
      
      // Calculate current price based on position value
      const currentPrice = position.totalValueUSD / position.totalValueUSD; // Simplified
      
      if (currentPrice <= order.triggerPrice) {
        order.status = 'triggered';
        order.triggeredAt = new Date();
        
        this.stopLossOrders.set(orderId, order);
        triggeredOrders.push(order);
      }
    }
    
    return triggeredOrders;
  }

  // Find bin ID for a given price
  private findBinForPrice(pairInfo: any, price: number): number {
    // Simplified bin finding - in production, use real bin calculation
    const basePrice = 100; // Mock base price
    const binStep = 0.01; // 1% bin step
    
    const binOffset = Math.round(Math.log(price / basePrice) / Math.log(1 + binStep));
    return binOffset;
  }

  // Generate unique order ID
  private generateOrderId(): string {
    return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Add order to order book
  private addToOrderBook(order: LimitOrder): void {
    const pair = order.pair;
    if (!this.orderBook.has(pair)) {
      this.orderBook.set(pair, []);
    }
    
    const entries = this.orderBook.get(pair)!;
    entries.push({
      price: order.price,
      amount: order.amount,
      binId: order.binId,
      side: order.side
    });
    
    // Sort by price
    entries.sort((a, b) => {
      if (a.side === 'buy') {
        return b.price - a.price; // Descending for bids
      } else {
        return a.price - b.price; // Ascending for asks
      }
    });
  }

  // Remove order from order book
  private removeFromOrderBook(order: LimitOrder): void {
    const pair = order.pair;
    const entries = this.orderBook.get(pair);
    if (!entries) return;
    
    const index = entries.findIndex(entry => 
      entry.price === order.price && 
      entry.amount === order.amount && 
      entry.side === order.side
    );
    
    if (index !== -1) {
      entries.splice(index, 1);
    }
  }

  // Get order statistics
  async getOrderStatistics(user: PublicKey): Promise<{
    totalOrders: number;
    pendingOrders: number;
    filledOrders: number;
    cancelledOrders: number;
    totalVolume: number;
    successRate: number;
  }> {
    const { limitOrders } = await this.getUserOrders(user);
    
    const totalOrders = limitOrders.length;
    const pendingOrders = limitOrders.filter(o => o.status === 'pending').length;
    const filledOrders = limitOrders.filter(o => o.status === 'filled').length;
    const cancelledOrders = limitOrders.filter(o => o.status === 'cancelled').length;
    
    const totalVolume = limitOrders
      .filter(o => o.status === 'filled')
      .reduce((sum, o) => sum + (o.filledAmount || 0), 0);
    
    const successRate = totalOrders > 0 ? filledOrders / totalOrders : 0;
    
    return {
      totalOrders,
      pendingOrders,
      filledOrders,
      cancelledOrders,
      totalVolume,
      successRate
    };
  }
}

// Export singleton instance
export const limitOrderService = new LimitOrderService();
