import { memo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { hourlyDemandData } from "@/lib/mockData";
import { useIsMobile } from "@/hooks/use-mobile";

export const DemandForecastChart = memo(function DemandForecastChart() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  return (
    <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <h3 className="font-semibold text-sm sm:text-base">{t("pages.commandCenter.hourlyDemandVsForecast")}</h3>
        <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-primary shrink-0" />
            <span className="text-muted-foreground">{t("pages.commandCenter.actual")}</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-chart-4 shrink-0" />
            <span className="text-muted-foreground">{t("pages.commandCenter.forecast")}</span>
          </div>
        </div>
      </div>

      <div className="h-[250px] sm:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={hourlyDemandData}>
            <defs>
              <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />
            <XAxis
              dataKey="time"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: isMobile ? 9 : 10 }}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
              interval={isMobile ? 11 : 7}
              angle={isMobile ? -90 : -45}
              textAnchor="end"
              height={isMobile ? 80 : 60}
            />
            <YAxis
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: isMobile ? 9 : 10 }}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickFormatter={(value) => `${value}`}
              width={isMobile ? 35 : 40}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              itemStyle={{ color: "hsl(var(--muted-foreground))" }}
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
            />
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="hsl(var(--chart-4))"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={{ r: 4, fill: "hsl(var(--chart-4))" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});
