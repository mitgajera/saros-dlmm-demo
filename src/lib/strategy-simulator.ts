import { PublicKey } from '@solana/web3.js';
import { dlmmService } from './dlmm-service';
import { SarosError, handleSarosError } from './saros-config';

export interface SimulationParams {
  initialCapital: number;
  strategy: 'passive' | 'active' | 'momentum' | 'mean_reversion';
  duration: number; // days
  rebalanceFrequency: number; // hours
  riskTolerance: 'low' | 'medium' | 'high';
  pair: string;
}

export interface SimulationResult {
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

export interface RebalanceEvent {
  timestamp: Date;
  action: 'rebalance' | 'add_liquidity' | 'remove_liquidity';
  amount: number;
  price: number;
  reason: string;
}

export interface BacktestParams {
  startDate: Date;
  endDate: Date;
  strategies: SimulationParams[];
  benchmark?: 'buy_hold' | 'market_cap';
}

export interface BacktestResult {
  strategies: { [key: string]: SimulationResult };
  benchmark?: SimulationResult;
  comparison: {
    bestStrategy: string;
    worstStrategy: string;
    riskAdjustedWinner: string;
  };
}

export class StrategySimulator {
  private historicalData: Map<string, number[]> = new Map();

  // Run a single strategy simulation
  async runSimulation(params: SimulationParams): Promise<SimulationResult> {
    try {
      const startValue = params.initialCapital;
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - params.duration * 24 * 60 * 60 * 1000);
      
      // Generate mock price data
      const priceData = this.generatePriceData(startDate, endDate, params.pair);
      
      // Initialize portfolio
      let portfolioValue = startValue;
      let totalFees = 0;
      const dailyReturns: number[] = [];
      const portfolioValues: number[] = [portfolioValue];
      const rebalanceEvents: RebalanceEvent[] = [];
      
      // Run simulation
      for (let i = 1; i < priceData.length; i++) {
        const currentPrice = priceData[i];
        const previousPrice = priceData[i - 1];
        const priceChange = (currentPrice - previousPrice) / previousPrice;
        
        // Apply strategy logic
        const strategyResult = this.applyStrategy(
          params,
          currentPrice,
          priceChange,
          portfolioValue,
          i,
          priceData
        );
        
        // Update portfolio
        if (strategyResult.rebalance) {
          const rebalanceResult = this.executeRebalance(
            portfolioValue,
            strategyResult.newDistribution!, // Assert non-null as rebalance implies a new distribution
            currentPrice,
            params.pair
          );
          portfolioValue = rebalanceResult.newValue;
          totalFees += rebalanceResult.fees;
          
          rebalanceEvents.push({
            timestamp: new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000),
            action: 'rebalance',
            amount: rebalanceResult.amount,
            price: currentPrice,
            reason: strategyResult.reason
          });
        } else {
          // Apply market movement
          portfolioValue *= (1 + priceChange * this.getLiquidityExposure(params));
        }
        
        // Calculate daily return
        const dailyReturn = (portfolioValue - portfolioValues[portfolioValues.length - 1]) / portfolioValues[portfolioValues.length - 1];
        dailyReturns.push(dailyReturn);
        portfolioValues.push(portfolioValue);
      }
      
      // Calculate final metrics
      const finalValue = portfolioValues[portfolioValues.length - 1];
      const totalReturn = (finalValue - startValue) / startValue;
      const annualizedReturn = Math.pow(1 + totalReturn, 365 / params.duration) - 1;
      const netReturn = totalReturn - (totalFees / startValue);
      
      const maxDrawdown = this.calculateMaxDrawdown(portfolioValues);
      const sharpeRatio = this.calculateSharpeRatio(dailyReturns);
      const winRate = dailyReturns.filter(r => r > 0).length / dailyReturns.length;
      
      const metrics = this.calculateAdvancedMetrics(dailyReturns, portfolioValues);
      
      return {
        finalValue,
        totalReturn,
        annualizedReturn,
        maxDrawdown,
        sharpeRatio,
        winRate,
        totalFees,
        netReturn,
        dailyReturns,
        portfolioValues,
        rebalanceEvents,
        metrics
      };
    } catch (error) {
      throw handleSarosError(error);
    }
  }

  // Run backtest comparing multiple strategies
  async runBacktest(params: BacktestParams): Promise<BacktestResult> {
    try {
      const results: { [key: string]: SimulationResult } = {};
      
      // Run each strategy
      for (let i = 0; i < params.strategies.length; i++) {
        const strategy = params.strategies[i];
        const key = `strategy_${i}_${strategy.strategy}`;
        results[key] = await this.runSimulation(strategy);
      }
      
      // Run benchmark if specified
      let benchmark: SimulationResult | undefined;
      if (params.benchmark) {
        benchmark = await this.runBenchmark(params);
      }
      
      // Compare strategies
      const comparison = this.compareStrategies(results, benchmark);
      
      return {
        strategies: results,
        benchmark,
        comparison
      };
    } catch (error) {
      throw handleSarosError(error);
    }
  }

  // Apply strategy logic
  private applyStrategy(
    params: SimulationParams,
    currentPrice: number,
    priceChange: number,
    portfolioValue: number,
    dayIndex: number,
    priceData: number[]
  ): {
    rebalance: boolean;
    newDistribution?: Array<{ binRelativeId: number; bpsX: number; bpsY: number }>;
    reason: string;
  } {
    switch (params.strategy) {
      case 'passive':
        return this.applyPassiveStrategy(params, dayIndex);
      
      case 'active':
        return this.applyActiveStrategy(params, currentPrice, priceChange, dayIndex);
      
      case 'momentum':
        return this.applyMomentumStrategy(params, priceData, dayIndex);
      
      case 'mean_reversion':
        return this.applyMeanReversionStrategy(params, priceData, dayIndex);
      
      default:
        return { rebalance: false, reason: 'Unknown strategy' };
    }
  }

  // Passive strategy - minimal rebalancing
  private applyPassiveStrategy(params: SimulationParams, dayIndex: number): {
    rebalance: boolean;
    newDistribution?: Array<{ binRelativeId: number; bpsX: number; bpsY: number }>;
    reason: string;
  } {
    // Rebalance only weekly
    if (dayIndex % 7 === 0) {
      return {
        rebalance: true,
        newDistribution: this.generateBalancedDistribution(params.riskTolerance),
        reason: 'Weekly rebalance'
      };
    }
    return { rebalance: false, reason: 'No rebalance needed' };
  }

  // Active strategy - frequent rebalancing based on volatility
  private applyActiveStrategy(
    params: SimulationParams,
    currentPrice: number,
    priceChange: number,
    dayIndex: number
  ): {
    rebalance: boolean;
    newDistribution?: Array<{ binRelativeId: number; bpsX: number; bpsY: number }>;
    reason: string;
  } {
    const volatilityThreshold = this.getVolatilityThreshold(params.riskTolerance);
    
    if (Math.abs(priceChange) > volatilityThreshold) {
      return {
        rebalance: true,
        newDistribution: this.generateVolatilityAdjustedDistribution(params, priceChange),
        reason: `High volatility detected: ${(priceChange * 100).toFixed(2)}%`
      };
    }
    
    return { rebalance: false, reason: 'Volatility within threshold' };
  }

  // Momentum strategy - follow trends
  private applyMomentumStrategy(
    params: SimulationParams,
    priceData: number[],
    dayIndex: number
  ): {
    rebalance: boolean;
    newDistribution?: Array<{ binRelativeId: number; bpsX: number; bpsY: number }>;
    reason: string;
  } {
    if (dayIndex < 5) return { rebalance: false, reason: 'Insufficient data' };
    
    const shortTerm = priceData.slice(dayIndex - 5, dayIndex);
    const longTerm = priceData.slice(dayIndex - 20, dayIndex);
    
    const shortTermReturn = (shortTerm[shortTerm.length - 1] - shortTerm[0]) / shortTerm[0];
    const longTermReturn = (longTerm[longTerm.length - 1] - longTerm[0]) / longTerm[0];
    
    if (shortTermReturn > longTermReturn && shortTermReturn > 0.02) {
      return {
        rebalance: true,
        newDistribution: this.generateMomentumDistribution(params, shortTermReturn),
        reason: `Momentum detected: ${(shortTermReturn * 100).toFixed(2)}%`
      };
    }
    
    return { rebalance: false, reason: 'No momentum signal' };
  }

  // Mean reversion strategy - counter-trend
  private applyMeanReversionStrategy(
    params: SimulationParams,
    priceData: number[],
    dayIndex: number
  ): {
    rebalance: boolean;
    newDistribution?: Array<{ binRelativeId: number; bpsX: number; bpsY: number }>;
    reason: string;
  } {
    if (dayIndex < 10) return { rebalance: false, reason: 'Insufficient data' };
    
    const recent = priceData.slice(dayIndex - 5, dayIndex);
    const historical = priceData.slice(dayIndex - 20, dayIndex - 5);
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const historicalAvg = historical.reduce((a, b) => a + b, 0) / historical.length;
    
    const deviation = (recentAvg - historicalAvg) / historicalAvg;
    
    if (Math.abs(deviation) > 0.05) { // 5% deviation
      return {
        rebalance: true,
        newDistribution: this.generateMeanReversionDistribution(params, deviation),
        reason: `Mean reversion signal: ${(deviation * 100).toFixed(2)}% deviation`
      };
    }
    
    return { rebalance: false, reason: 'No mean reversion signal' };
  }

  // Execute rebalance
  private executeRebalance(
    currentValue: number,
    distribution: Array<{ binRelativeId: number; bpsX: number; bpsY: number }>,
    currentPrice: number,
    pair: string
  ): {
    newValue: number;
    fees: number;
    amount: number;
  } {
    // Simulate rebalance with fees
    const feeRate = 0.003; // 0.3% fee
    const fees = currentValue * feeRate;
    const newValue = currentValue - fees;
    
    return {
      newValue,
      fees,
      amount: currentValue
    };
  }

  // Generate mock price data
  private generatePriceData(startDate: Date, endDate: Date, pair: string): number[] {
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    const prices: number[] = [];
    
    let currentPrice = 100; // Starting price
    prices.push(currentPrice);
    
    for (let i = 1; i < days; i++) {
      // Generate realistic price movement
      const volatility = 0.02; // 2% daily volatility
      const drift = 0.0001; // Slight upward drift
      const randomChange = (Math.random() - 0.5) * volatility + drift;
      
      currentPrice *= (1 + randomChange);
      prices.push(currentPrice);
    }
    
    return prices;
  }

  // Generate balanced distribution
  private generateBalancedDistribution(riskTolerance: string): Array<{ binRelativeId: number; bpsX: number; bpsY: number }> {
    const width = riskTolerance === 'low' ? 5 : riskTolerance === 'medium' ? 7 : 9;
    const bins = [];
    const per = Math.floor(10000 / width);
    
    for (let i = -Math.floor(width / 2); i <= Math.floor(width / 2); i++) {
      bins.push({
        binRelativeId: i,
        bpsX: i < 0 ? per : 0,
        bpsY: i > 0 ? per : 0
      });
    }
    
    return bins;
  }

  // Generate volatility-adjusted distribution
  private generateVolatilityAdjustedDistribution(
    params: SimulationParams,
    priceChange: number
  ): Array<{ binRelativeId: number; bpsX: number; bpsY: number }> {
    const width = params.riskTolerance === 'low' ? 3 : params.riskTolerance === 'medium' ? 5 : 7;
    const bins = [];
    const per = Math.floor(10000 / width);
    
    // Adjust distribution based on price change direction
    const shift = Math.sign(priceChange) * Math.floor(width / 4);
    
    for (let i = -Math.floor(width / 2); i <= Math.floor(width / 2); i++) {
      const binId = i + shift;
      bins.push({
        binRelativeId: binId,
        bpsX: i < 0 ? per : 0,
        bpsY: i > 0 ? per : 0
      });
    }
    
    return bins;
  }

  // Generate momentum distribution
  private generateMomentumDistribution(
    params: SimulationParams,
    momentum: number
  ): Array<{ binRelativeId: number; bpsX: number; bpsY: number }> {
    const width = params.riskTolerance === 'low' ? 3 : params.riskTolerance === 'medium' ? 5 : 7;
    const bins = [];
    const per = Math.floor(10000 / width);
    
    // Shift distribution in direction of momentum
    const shift = Math.sign(momentum) * Math.floor(width / 3);
    
    for (let i = -Math.floor(width / 2); i <= Math.floor(width / 2); i++) {
      const binId = i + shift;
      bins.push({
        binRelativeId: binId,
        bpsX: i < 0 ? per : 0,
        bpsY: i > 0 ? per : 0
      });
    }
    
    return bins;
  }

  // Generate mean reversion distribution
  private generateMeanReversionDistribution(
    params: SimulationParams,
    deviation: number
  ): Array<{ binRelativeId: number; bpsX: number; bpsY: number }> {
    const width = params.riskTolerance === 'low' ? 5 : params.riskTolerance === 'medium' ? 7 : 9;
    const bins = [];
    const per = Math.floor(10000 / width);
    
    // Shift distribution opposite to deviation
    const shift = -Math.sign(deviation) * Math.floor(width / 4);
    
    for (let i = -Math.floor(width / 2); i <= Math.floor(width / 2); i++) {
      const binId = i + shift;
      bins.push({
        binRelativeId: binId,
        bpsX: i < 0 ? per : 0,
        bpsY: i > 0 ? per : 0
      });
    }
    
    return bins;
  }

  // Get liquidity exposure based on strategy
  private getLiquidityExposure(params: SimulationParams): number {
    switch (params.strategy) {
      case 'passive': return 0.8;
      case 'active': return 0.9;
      case 'momentum': return 0.85;
      case 'mean_reversion': return 0.75;
      default: return 0.8;
    }
  }

  // Get volatility threshold based on risk tolerance
  private getVolatilityThreshold(riskTolerance: string): number {
    switch (riskTolerance) {
      case 'low': return 0.01; // 1%
      case 'medium': return 0.02; // 2%
      case 'high': return 0.03; // 3%
      default: return 0.02;
    }
  }

  // Calculate maximum drawdown
  private calculateMaxDrawdown(values: number[]): number {
    let maxDrawdown = 0;
    let peak = values[0];
    
    for (const value of values) {
      if (value > peak) {
        peak = value;
      }
      const drawdown = (peak - value) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
    
    return maxDrawdown;
  }

  // Calculate Sharpe ratio
  private calculateSharpeRatio(returns: number[]): number {
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    return stdDev === 0 ? 0 : avgReturn / stdDev;
  }

  // Calculate advanced metrics
  private calculateAdvancedMetrics(returns: number[], values: number[]): {
    volatility: number;
    calmarRatio: number;
    sortinoRatio: number;
    var95: number;
    cvar95: number;
  } {
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance);
    
    const maxDrawdown = this.calculateMaxDrawdown(values);
    const calmarRatio = maxDrawdown === 0 ? 0 : avgReturn / maxDrawdown;
    
    const negativeReturns = returns.filter(r => r < 0);
    const downsideVariance = negativeReturns.reduce((a, b) => a + Math.pow(b, 2), 0) / negativeReturns.length;
    const downsideDeviation = Math.sqrt(downsideVariance);
    const sortinoRatio = downsideDeviation === 0 ? 0 : avgReturn / downsideDeviation;
    
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const var95Index = Math.floor(sortedReturns.length * 0.05);
    const var95 = sortedReturns[var95Index] || 0;
    
    const cvar95 = sortedReturns.slice(0, var95Index + 1).reduce((a, b) => a + b, 0) / (var95Index + 1);
    
    return {
      volatility,
      calmarRatio,
      sortinoRatio,
      var95,
      cvar95
    };
  }

  // Compare strategies
  private compareStrategies(
    results: { [key: string]: SimulationResult },
    benchmark?: SimulationResult
  ): {
    bestStrategy: string;
    worstStrategy: string;
    riskAdjustedWinner: string;
  } {
    const strategies = Object.keys(results);
    
    // Find best and worst by total return
    const bestStrategy = strategies.reduce((a, b) => 
      results[a].totalReturn > results[b].totalReturn ? a : b
    );
    const worstStrategy = strategies.reduce((a, b) => 
      results[a].totalReturn < results[b].totalReturn ? a : b
    );
    
    // Find best risk-adjusted return (Sharpe ratio)
    const riskAdjustedWinner = strategies.reduce((a, b) => 
      results[a].sharpeRatio > results[b].sharpeRatio ? a : b
    );
    
    return {
      bestStrategy,
      worstStrategy,
      riskAdjustedWinner
    };
  }

  // Run benchmark strategy
  private async runBenchmark(params: BacktestParams): Promise<SimulationResult> {
    // Implement buy and hold or market cap weighted benchmark
    // This is a simplified implementation
    const startValue = 10000;
    const duration = Math.ceil((params.endDate.getTime() - params.startDate.getTime()) / (24 * 60 * 60 * 1000));
    
    // Mock benchmark performance
    const totalReturn = 0.1; // 10% over the period
    const finalValue = startValue * (1 + totalReturn);
    const dailyReturns = Array(duration).fill(totalReturn / duration);
    const portfolioValues = Array(duration + 1).fill(startValue).map((v, i) => v * (1 + totalReturn * i / duration));
    
    return {
      finalValue,
      totalReturn,
      annualizedReturn: totalReturn,
      maxDrawdown: 0.05,
      sharpeRatio: 1.0,
      winRate: 0.6,
      totalFees: 0,
      netReturn: totalReturn,
      dailyReturns,
      portfolioValues,
      rebalanceEvents: [],
      metrics: {
        volatility: 0.15,
        calmarRatio: 2.0,
        sortinoRatio: 1.5,
        var95: -0.02,
        cvar95: -0.03
      }
    };
  }
}

// Export singleton instance
export const strategySimulator = new StrategySimulator();
