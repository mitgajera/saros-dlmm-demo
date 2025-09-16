
"use client";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Scale, 
  TrendingUp, 
  TrendingDown, 
  Shield, 
  Zap, 
  Target,
  Info
} from "lucide-react";

type Shape = "CENTERED" | "SINGLE_SIDED_X" | "SINGLE_SIDED_Y" | "MOMENTUM" | "MEAN_REVERSION" | "VOLATILITY_ADJUSTED" | "CONSERVATIVE" | "AGGRESSIVE";

export function RebalanceForm({ onSubmit }:{ 
  onSubmit:(cfg:{
    shape:Shape; 
    percent:number; 
    width:number;
    strategy?: string;
    riskTolerance?: string;
  })=>void 
}) {
  const [shape, setShape] = useState<Shape>("CENTERED");
  const [percent, setPercent] = useState<number>(100);
  const [width, setWidth] = useState<number>(7);
  const [strategy, setStrategy] = useState<string>("centered");
  const [riskTolerance, setRiskTolerance] = useState<string>("medium");

  const getStrategyIcon = (strategy: Shape) => {
    switch (strategy) {
      case "CENTERED": return <Scale className="h-4 w-4" />;
      case "MOMENTUM": return <TrendingUp className="h-4 w-4" />;
      case "MEAN_REVERSION": return <TrendingDown className="h-4 w-4" />;
      case "CONSERVATIVE": return <Shield className="h-4 w-4" />;
      case "AGGRESSIVE": return <Zap className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getStrategyDescription = (strategy: Shape) => {
    switch (strategy) {
      case "CENTERED": return "Distributes liquidity evenly around current price";
      case "MOMENTUM": return "Shifts liquidity in direction of price momentum";
      case "MEAN_REVERSION": return "Counter-trend strategy for ranging markets";
      case "VOLATILITY_ADJUSTED": return "Adjusts distribution based on market volatility";
      case "CONSERVATIVE": return "Low risk, stable returns with fewer bins";
      case "AGGRESSIVE": return "High risk, high returns with more bins";
      default: return "Custom strategy configuration";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5" />
          Rebalance Configuration
        </CardTitle>
        <CardDescription>
          Configure your rebalancing strategy and parameters
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={e => { 
          e.preventDefault(); 
          onSubmit({ shape, percent, width, strategy, riskTolerance }); 
        }}>
          <div className="space-y-2">
            <label htmlFor="strategy-type" className="text-sm font-medium">
              Strategy Type
            </label>
            <Select
              id="strategy-type"
              value={shape} 
              onChange={e => setShape(e.target.value as Shape)}
            >
              <option value="CENTERED">Centered (Balanced)</option>
              <option value="SINGLE_SIDED_X">Single-sided X</option>
              <option value="SINGLE_SIDED_Y">Single-sided Y</option>
              <option value="MOMENTUM">Momentum (Trend Following)</option>
              <option value="MEAN_REVERSION">Mean Reversion (Counter-trend)</option>
              <option value="VOLATILITY_ADJUSTED">Volatility Adjusted</option>
              <option value="CONSERVATIVE">Conservative (Low Risk)</option>
              <option value="AGGRESSIVE">Aggressive (High Risk)</option>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="withdraw-percentage" className="text-sm font-medium">
              Withdraw Percentage
            </label>
            <div className="relative">
              <Input
                id="withdraw-percentage"
                type="number"
                min={1}
                max={100}
                placeholder="e.g., 50"
                value={percent} 
                onChange={e => setPercent(parseInt(e.target.value || "0"))} 
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                %
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Percentage of position to withdraw and rebalance
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="bin-width" className="text-sm font-medium">
              Bin Width
            </label>
            <Input
              id="bin-width"
              type="number"
              min={1}
              max={99}
              placeholder="e.g., 7"
              value={width} 
              onChange={e => setWidth(parseInt(e.target.value || "0"))} 
            />
            <p className="text-xs text-muted-foreground">
              Number of bins to distribute liquidity across
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="risk-tolerance" className="text-sm font-medium">
              Risk Tolerance
            </label>
            <Select 
              id="risk-tolerance"
              value={riskTolerance} 
              onChange={e => setRiskTolerance(e.target.value)}
            >
              <option value="low">Low (Conservative)</option>
              <option value="medium">Medium (Balanced)</option>
              <option value="high">High (Aggressive)</option>
            </Select>
          </div>

          <Button type="submit" className="w-full" size="lg">
            <Scale className="h-4 w-4 mr-2" />
            Generate Rebalance Plan
          </Button>
        </form>

        {/* Strategy Preview */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-medium text-sm">Strategy Preview</h4>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {getStrategyIcon(shape)}
              <span className="text-sm font-medium">{shape.replace(/_/g, ' ')}</span>
              <Badge variant="outline" className="text-xs">
                {riskTolerance}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {getStrategyDescription(shape)}
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Width: {width} bins</span>
              <span>•</span>
              <span>Risk: {riskTolerance}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
