import { ReactNode, memo, useMemo } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: number;
  trendLabel?: string;
  sparklineData?: number[];
  icon?: ReactNode;
  onClick?: () => void;
}

export const KPICard = memo(function KPICard({
  title,
  value,
  unit,
  trend,
  trendLabel,
  sparklineData,
  icon,
  onClick,
}: KPICardProps) {
  const isPositive = trend && trend > 0;
  const trendColor = isPositive ? "text-success" : "text-destructive";

  const chartData = useMemo(
    () => sparklineData?.map((v, i) => ({ value: v, index: i })),
    [sparklineData],
  );

  return (
    <div
      className="kpi-card cursor-pointer group h-full flex flex-col justify-between"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-bold text-foreground">{value}</span>
            {unit && <span className="text-lg text-muted-foreground">{unit}</span>}
          </div>
        </div>
        {icon && (
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4">
        {trend !== undefined && (
          <div className={`flex items-center gap-1 ${trendColor}`}>
            {isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">
              {isPositive ? "+" : ""}{trend}%
            </span>
            {trendLabel && (
              <span className="text-xs text-muted-foreground ml-1">
                {trendLabel}
              </span>
            )}
          </div>
        )}

        {chartData && (
          <div className="sparkline-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="sparklineGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#sparklineGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
});
