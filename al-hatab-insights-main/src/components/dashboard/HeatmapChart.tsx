import { memo } from "react";
import { useTranslation } from "react-i18next";
import { heatmapData } from "@/lib/mockData";
import { chartColors } from "@/lib/colors";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const HeatmapChart = memo(function HeatmapChart() {
  const { t } = useTranslation();

  const getHeatColor = (value: number) => {
    // Use Steel Blue with varying opacity based on error value
    // Lower values = lighter shade, higher values = darker shade
    // Convert hex to rgba for proper opacity
    const hexToRgba = (hex: string, alpha: number) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    if (value <= 0.3) return { backgroundColor: hexToRgba(chartColors.steelBlue, 0.2) };
    if (value <= 0.6) return { backgroundColor: hexToRgba(chartColors.steelBlue, 0.4) };
    if (value <= 0.9) return { backgroundColor: hexToRgba(chartColors.steelBlue, 0.6) };
    if (value <= 1.2) return { backgroundColor: hexToRgba(chartColors.steelBlue, 0.8) };
    return { backgroundColor: chartColors.steelBlue };
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
      <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">{t("pages.commandCenter.hourStoreClusterForecastError")}</h3>
      
      <div className="overflow-x-auto -mx-3 sm:mx-0 scrollbar-hide">
        <div className="min-w-[500px] sm:min-w-[600px] px-3 sm:px-0">
          {/* Hour labels */}
          <div className="flex mb-2 ml-20 sm:ml-24">
            {HOURS.filter((_, i) => i % 4 === 0).map((hour) => (
              <div
                key={hour}
                className="text-[10px] sm:text-xs text-muted-foreground"
                style={{ width: `${100 / 6}%` }}
              >
                {hour.toString().padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {/* Heatmap rows */}
          {heatmapData.map((row) => (
            <div key={row.cluster} className="flex items-center mb-1">
              <div className="w-20 sm:w-24 text-xs sm:text-sm text-muted-foreground truncate pr-2">
                {row.cluster}
              </div>
              <div className="flex-1 flex gap-0.5">
                {row.hours.map((value, i) => (
                  <div
                    key={i}
                    className="flex-1 h-5 sm:h-6 rounded-sm transition-all hover:scale-110 cursor-pointer"
                    style={getHeatColor(value)}
                    title={`${row.cluster} @ ${i.toString().padStart(2, "0")}:00 - Error: ${(value * 10).toFixed(1)}%`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 sm:mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-muted-foreground">
        <span>{t("pages.commandCenter.lowError")}</span>
        <div className="flex gap-0.5 sm:gap-1">
          {[0.2, 0.4, 0.6, 0.8, 1.0].map((opacity) => {
            const hexToRgba = (hex: string, alpha: number) => {
              const r = parseInt(hex.slice(1, 3), 16);
              const g = parseInt(hex.slice(3, 5), 16);
              const b = parseInt(hex.slice(5, 7), 16);
              return `rgba(${r}, ${g}, ${b}, ${alpha})`;
            };
            return (
              <div
                key={opacity}
                className="w-3 h-2.5 sm:w-4 sm:h-3 rounded-sm"
                style={{ backgroundColor: hexToRgba(chartColors.steelBlue, opacity) }}
              />
            );
          })}
        </div>
        <span>{t("pages.commandCenter.highError")}</span>
      </div>
    </div>
  );
});
