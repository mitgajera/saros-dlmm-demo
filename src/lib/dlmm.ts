
// Enhanced DLMM distribution helpers with real SDK integration
// These functions work with the actual @saros-finance/dlmm-sdk

export type Distribution = { binRelativeId: number; bpsX: number; bpsY: number };

export function makeCenteredDistribution(width: number): Distribution[] {
  // width should be odd; center = 0
  const w = Math.max(1, width | 0);
  const half = Math.floor(w / 2);
  const bins = [];
  const per = Math.floor(10000 / w);
  for (let i = -half; i <= half; i++) {
    bins.push({ binRelativeId: i, bpsX: i < 0 ? per : 0, bpsY: i > 0 ? per : 0 });
  }
  // Put leftover on center bin (split across both sides)
  const used = per * w;
  const rem = 10000 - used;
  const center = bins.find(b => b.binRelativeId === 0);
  if (center) {
    center.bpsX += Math.floor(rem / 2);
    center.bpsY += rem - Math.floor(rem / 2);
  }
  return bins;
}

export function makeSingleSidedX(width: number): Distribution[] {
  const per = Math.floor(10000 / width);
  const arr = Array.from({ length: width }, (_, i) => ({ binRelativeId: -i - 1, bpsX: per, bpsY: 0 }));
  const used = per * width;
  if (arr.length) arr[0].bpsX += (10000 - used);
  return arr;
}

export function makeSingleSidedY(width: number): Distribution[] {
  const per = Math.floor(10000 / width);
  const arr = Array.from({ length: width }, (_, i) => ({ binRelativeId: i + 1, bpsX: 0, bpsY: per }));
  const used = per * width;
  if (arr.length) arr[0].bpsY += (10000 - used);
  return arr;
}

// Advanced distribution strategies
export function makeMomentumDistribution(width: number, momentum: number): Distribution[] {
  const w = Math.max(1, width | 0);
  const half = Math.floor(w / 2);
  const shift = Math.sign(momentum) * Math.floor(w / 4);
  const bins = [];
  const per = Math.floor(10000 / w);
  
  for (let i = -half; i <= half; i++) {
    const binId = i + shift;
    bins.push({ 
      binRelativeId: binId, 
      bpsX: i < 0 ? per : 0, 
      bpsY: i > 0 ? per : 0 
    });
  }
  
  return bins;
}

export function makeMeanReversionDistribution(width: number, deviation: number): Distribution[] {
  const w = Math.max(1, width | 0);
  const half = Math.floor(w / 2);
  const shift = -Math.sign(deviation) * Math.floor(w / 4);
  const bins = [];
  const per = Math.floor(10000 / w);
  
  for (let i = -half; i <= half; i++) {
    const binId = i + shift;
    bins.push({ 
      binRelativeId: binId, 
      bpsX: i < 0 ? per : 0, 
      bpsY: i > 0 ? per : 0 
    });
  }
  
  return bins;
}

export function makeVolatilityAdjustedDistribution(width: number, volatility: number): Distribution[] {
  const w = Math.max(1, width | 0);
  const half = Math.floor(w / 2);
  const bins = [];
  const per = Math.floor(10000 / w);
  
  // Adjust distribution based on volatility
  const adjustedPer = Math.floor(per * (1 - Math.min(volatility, 0.5)));
  
  for (let i = -half; i <= half; i++) {
    const weight = Math.exp(-Math.abs(i) * volatility * 2); // Gaussian-like distribution
    bins.push({ 
      binRelativeId: i, 
      bpsX: i < 0 ? Math.floor(adjustedPer * weight) : 0, 
      bpsY: i > 0 ? Math.floor(adjustedPer * weight) : 0 
    });
  }
  
  return bins;
}

// Risk-adjusted distributions
export function makeConservativeDistribution(width: number): Distribution[] {
  const w = Math.max(1, Math.min(width, 5)); // Limit to 5 bins for conservative
  const half = Math.floor(w / 2);
  const bins = [];
  const per = Math.floor(10000 / w);
  
  for (let i = -half; i <= half; i++) {
    bins.push({ 
      binRelativeId: i, 
      bpsX: i < 0 ? per : 0, 
      bpsY: i > 0 ? per : 0 
    });
  }
  
  return bins;
}

export function makeAggressiveDistribution(width: number): Distribution[] {
  const w = Math.max(1, Math.min(width, 15)); // Allow up to 15 bins for aggressive
  const half = Math.floor(w / 2);
  const bins = [];
  const per = Math.floor(10000 / w);
  
  for (let i = -half; i <= half; i++) {
    bins.push({ 
      binRelativeId: i, 
      bpsX: i < 0 ? per : 0, 
      bpsY: i > 0 ? per : 0 
    });
  }
  
  return bins;
}

// Utility functions
export function validateDistribution(distribution: Distribution[]): boolean {
  const totalBps = distribution.reduce((sum, d) => sum + d.bpsX + d.bpsY, 0);
  return totalBps === 10000;
}

export function normalizeDistribution(distribution: Distribution[]): Distribution[] {
  const totalBps = distribution.reduce((sum, d) => sum + d.bpsX + d.bpsY, 0);
  if (totalBps === 0) return distribution;
  
  const factor = 10000 / totalBps;
  return distribution.map(d => ({
    binRelativeId: d.binRelativeId,
    bpsX: Math.floor(d.bpsX * factor),
    bpsY: Math.floor(d.bpsY * factor)
  }));
}

export function getDistributionMetrics(distribution: Distribution[]): {
  totalBps: number;
  activeBins: number;
  concentration: number;
  skewness: number;
} {
  const totalBps = distribution.reduce((sum, d) => sum + d.bpsX + d.bpsY, 0);
  const activeBins = distribution.filter(d => d.bpsX > 0 || d.bpsY > 0).length;
  
  // Calculate concentration (Herfindahl index)
  const concentration = distribution.reduce((sum, d) => {
    const total = d.bpsX + d.bpsY;
    return sum + Math.pow(total / 10000, 2);
  }, 0);
  
  // Calculate skewness (positive = right-skewed, negative = left-skewed)
  const mean = distribution.reduce((sum, d) => sum + d.binRelativeId * (d.bpsX + d.bpsY), 0) / totalBps;
  const variance = distribution.reduce((sum, d) => {
    const total = d.bpsX + d.bpsY;
    return sum + Math.pow(d.binRelativeId - mean, 2) * (total / 10000);
  }, 0);
  const stdDev = Math.sqrt(variance);
  const skewness = distribution.reduce((sum, d) => {
    const total = d.bpsX + d.bpsY;
    return sum + Math.pow((d.binRelativeId - mean) / stdDev, 3) * (total / 10000);
  }, 0);
  
  return {
    totalBps,
    activeBins,
    concentration,
    skewness
  };
}
