import { PublicKey } from '@solana/web3.js';
import { dlmmService, PositionData } from './dlmm-service';
import { formatUSD, formatPercentage } from './saros-config';

export interface PortfolioMetrics {
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

export interface PositionAnalytics {
  position: PositionData;
  metrics: {
    valueChange24h: number;
    valueChange7d: number;
    valueChange30d: number;
    feeEfficiency: number;
    concentrationRisk: number;
    impermanentLoss: number;
  };
}

export interface RebalanceRecommendation {
  position: PublicKey;
  action: 'increase' | 'decrease' | 'rebalance' | 'close';
  reason: string;
  priority: 'high' | 'medium' | 'low';
  suggestedDistribution?: Array<{ binRelativeId: number; bpsX: number; bpsY: number }>;
}

export class PortfolioService {
  private historicalData: Map<string, number[]> = new Map();

  // Get comprehensive portfolio metrics
  async getPortfolioMetrics(user: PublicKey): Promise<PortfolioMetrics> {
    try {
      const positions = await dlmmService.getUserPositions(user);
      
      const totalValue = positions.reduce((sum, pos) => sum + pos.totalValueUSD, 0);
      const totalFees = positions.reduce((sum, pos) => sum + pos.feesEarned, 0);
      const totalPositions = positions.length;
      const activePositions = positions.filter(pos => pos.totalValueUSD > 0).length;
      
      // Calculate PnL (simplified - in production, use real historical data)
      const pnl24h = this.calculatePnL(positions, 1);
      const pnl7d = this.calculatePnL(positions, 7);
      const pnl30d = this.calculatePnL(positions, 30);
      
      // Calculate APY (simplified)
      const apy = totalFees > 0 ? (totalFees / totalValue) * 365 : 0;
      
      // Calculate risk score (0-100, lower is better)
      const riskScore = this.calculateRiskScore(positions);
      
      return {
        totalValue,
        totalFees,
        totalPositions,
        activePositions,
        pnl24h,
        pnl7d,
        pnl30d,
        apy,
        riskScore
      };
    } catch (error) {
      console.error('Error calculating portfolio metrics:', error);
      return {
        totalValue: 0,
        totalFees: 0,
        totalPositions: 0,
        activePositions: 0,
        pnl24h: 0,
        pnl7d: 0,
        pnl30d: 0,
        apy: 0,
        riskScore: 0
      };
    }
  }

  // Get detailed analytics for each position
  async getPositionAnalytics(user: PublicKey): Promise<PositionAnalytics[]> {
    try {
      const positions = await dlmmService.getUserPositions(user);
      
      return positions.map(position => {
        const metrics = this.calculatePositionMetrics(position);
        return {
          position,
          metrics
        };
      });
    } catch (error) {
      console.error('Error calculating position analytics:', error);
      return [];
    }
  }

  // Get rebalancing recommendations
  async getRebalanceRecommendations(user: PublicKey): Promise<RebalanceRecommendation[]> {
    try {
      const positions = await dlmmService.getUserPositions(user);
      const recommendations: RebalanceRecommendation[] = [];
      
      for (const position of positions) {
        const analytics = this.calculatePositionMetrics(position);
        
        // High concentration risk
        if (analytics.concentrationRisk > 0.8) {
          recommendations.push({
            position: position.position,
            action: 'rebalance',
            reason: 'High concentration risk detected',
            priority: 'high',
            suggestedDistribution: this.generateBalancedDistribution()
          });
        }
        
        // Low fee efficiency
        if (analytics.feeEfficiency < 0.1) {
          recommendations.push({
            position: position.position,
            action: 'rebalance',
            reason: 'Low fee efficiency - consider rebalancing',
            priority: 'medium',
            suggestedDistribution: this.generateOptimizedDistribution()
          });
        }
        
        // High impermanent loss
        if (analytics.impermanentLoss > 0.05) {
          recommendations.push({
            position: position.position,
            action: 'close',
            reason: 'High impermanent loss detected',
            priority: 'high'
          });
        }
        
        // Small position value
        if (position.totalValueUSD < 100) {
          recommendations.push({
            position: position.position,
            action: 'increase',
            reason: 'Position value too small to be efficient',
            priority: 'low'
          });
        }
      }
      
      return recommendations.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
    } catch (error) {
      console.error('Error generating rebalance recommendations:', error);
      return [];
    }
  }

  // Calculate position-specific metrics
  private calculatePositionMetrics(position: PositionData): {
    valueChange24h: number;
    valueChange7d: number;
    valueChange30d: number;
    feeEfficiency: number;
    concentrationRisk: number;
    impermanentLoss: number;
  } {
    // Mock calculations - in production, use real historical data
    const valueChange24h = (Math.random() - 0.5) * 0.1; // ±5% change
    const valueChange7d = (Math.random() - 0.5) * 0.2; // ±10% change
    const valueChange30d = (Math.random() - 0.5) * 0.3; // ±15% change
    
    const feeEfficiency = position.feesEarned / position.totalValueUSD;
    const concentrationRisk = this.calculateConcentrationRisk(position);
    const impermanentLoss = this.calculateImpermanentLoss(position);
    
    return {
      valueChange24h,
      valueChange7d,
      valueChange30d,
      feeEfficiency,
      concentrationRisk,
      impermanentLoss
    };
  }

  // Calculate concentration risk (0-1, higher is riskier)
  private calculateConcentrationRisk(position: PositionData): number {
    const totalBins = position.bins.length;
    const activeBins = position.bins.filter(bin => bin.active).length;
    
    if (totalBins === 0) return 1;
    
    // Higher concentration risk if fewer active bins
    return 1 - (activeBins / totalBins);
  }

  // Calculate impermanent loss (simplified)
  private calculateImpermanentLoss(position: PositionData): number {
    // Mock calculation - in production, compare with HODL strategy
    return Math.random() * 0.1; // 0-10% IL
  }

  // Calculate PnL for a given period
  private calculatePnL(positions: PositionData[], days: number): number {
    // Mock calculation - in production, use real historical data
    return positions.reduce((sum, pos) => {
      const randomChange = (Math.random() - 0.5) * 0.1 * days;
      return sum + (pos.totalValueUSD * randomChange);
    }, 0);
  }

  // Calculate overall risk score
  private calculateRiskScore(positions: PositionData[]): number {
    if (positions.length === 0) return 0;
    
    const avgConcentration = positions.reduce((sum, pos) => {
      return sum + this.calculateConcentrationRisk(pos);
    }, 0) / positions.length;
    
    const avgImpermanentLoss = positions.reduce((sum, pos) => {
      return sum + this.calculateImpermanentLoss(pos);
    }, 0) / positions.length;
    
    // Risk score from 0-100
    return Math.min(100, (avgConcentration + avgImpermanentLoss) * 50);
  }

  // Generate balanced distribution for rebalancing
  private generateBalancedDistribution(): Array<{ binRelativeId: number; bpsX: number; bpsY: number }> {
    const width = 7;
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

  // Generate optimized distribution for rebalancing
  private generateOptimizedDistribution(): Array<{ binRelativeId: number; bpsX: number; bpsY: number }> {
    // More concentrated around current price
    const width = 5;
    const bins = [];
    const per = Math.floor(10000 / width);
    
    for (let i = -Math.floor(width / 2); i <= Math.floor(width / 2); i++) {
      const weight = Math.exp(-Math.abs(i) * 0.5); // Gaussian-like distribution
      bins.push({
        binRelativeId: i,
        bpsX: i < 0 ? Math.floor(per * weight) : 0,
        bpsY: i > 0 ? Math.floor(per * weight) : 0
      });
    }
    
    return bins;
  }

  // Get portfolio performance over time
  async getPerformanceHistory(user: PublicKey, days: number = 30): Promise<{
    dates: string[];
    values: number[];
    fees: number[];
  }> {
    try {
      const positions = await dlmmService.getUserPositions(user);
      const dates: string[] = [];
      const values: number[] = [];
      const fees: number[] = [];
      
      const currentValue = positions.reduce((sum, pos) => sum + pos.totalValueUSD, 0);
      const currentFees = positions.reduce((sum, pos) => sum + pos.feesEarned, 0);
      
      for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
        
        // Mock historical data - in production, use real historical data
        const randomFactor = 1 + (Math.random() - 0.5) * 0.2 * (i / days);
        values.push(currentValue * randomFactor);
        fees.push(currentFees * (1 - i / days));
      }
      
      return { dates, values, fees };
    } catch (error) {
      console.error('Error getting performance history:', error);
      return { dates: [], values: [], fees: [] };
    }
  }
}

// Export singleton instance
export const portfolioService = new PortfolioService();
