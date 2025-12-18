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
      className="kpi-card cursor-pointer group h-full flex flex-col justify-between p-4 sm:p-5"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm text-muted-foreground font-medium truncate">{title}</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl sm:text-3xl font-bold text-foreground">{value}</span>
            {unit && <span className="text-base sm:text-lg text-muted-foreground">{unit}</span>}
          </div>
        </div>
        {icon && (
          <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 text-primary shrink-0 ml-2">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 sm:mt-4 gap-2">
        {trend !== undefined && (
          <div className={`flex items-center gap-1 ${trendColor} min-w-0 flex-1`}>
            {isPositive ? (
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
            ) : (
              <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
              {isPositive ? "+" : ""}{trend}%
            </span>
            {trendLabel && (
              <span className="text-[10px] sm:text-xs text-muted-foreground ml-1 truncate hidden sm:inline">
                {trendLabel}
              </span>
            )}
          </div>
        )}

        {chartData && (
          <div className="sparkline-container shrink-0">
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
