
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  hint?: string;
  trend?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function MetricCard({ 
  title, 
  value, 
  hint, 
  trend, 
  icon,
  className 
}: MetricCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.startsWith('+')) return <TrendingUp className="h-3 w-3" />;
    if (trend.startsWith('-')) return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getTrendColor = () => {
    if (!trend) return "muted";
    if (trend.startsWith('+')) return "success";
    if (trend.startsWith('-')) return "destructive";
    return "muted";
  };

  return (
    <Card className={cn("hover:shadow-lg transition-all duration-200 group", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && (
          <div className="text-muted-foreground group-hover:text-primary transition-colors">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">{value}</div>
          {trend && (
            <Badge 
              variant={getTrendColor() as any}
              className="flex items-center gap-1 text-xs"
            >
              {getTrendIcon()}
              {trend}
            </Badge>
          )}
        </div>
        {hint && (
          <p className="text-xs text-muted-foreground mt-1">
            {hint}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
