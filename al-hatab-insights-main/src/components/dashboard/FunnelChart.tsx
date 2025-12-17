import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { funnelData } from "@/lib/mockData";

export const FunnelChart = memo(function FunnelChart() {
  const { t } = useTranslation();
  const maxUnits = useMemo(() => Math.max(...funnelData.map((d) => d.units)), []);

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h3 className="font-semibold mb-6">{t("pages.commandCenter.productionToSalesFlow")}</h3>
      
      <div className="flex items-center gap-2 overflow-x-auto pb-4">
        {funnelData.map((step, index) => {
          const widthPercent = (step.units / maxUnits) * 100;
          const isWaste = step.step === "Wasted";
          
          return (
            <div
              key={step.step}
              className="flex-1 min-w-[120px] relative"
            >
              <div
                className={`relative flex flex-col items-center justify-center py-6 px-3 rounded-lg transition-all duration-300 hover:scale-105 shadow-md`}
                style={{
                  background: step.color,
                  opacity: isWaste ? 0.6 : 1 - (index * 0.08),
                }}
              >
                <span className="text-xs font-semibold text-white/90 mb-1 uppercase tracking-wide">
                  {step.step}
                </span>
                <span className="text-xl font-bold text-white drop-shadow-sm">
                  {(step.units / 1000).toFixed(1)}K
                </span>
              </div>
              
              {/* Flow indicator */}
              <div className="mt-2 h-1 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${widthPercent}%`,
                    background: step.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary stats */}
      <div className="mt-6 pt-4 border-t border-border grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-sm text-muted-foreground">{t("pages.commandCenter.conversionRate")}</p>
          <p className="text-lg font-semibold text-success">84.6%</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{t("pages.commandCenter.distributionEfficiency")}</p>
          <p className="text-lg font-semibold text-primary">94.5%</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{t("pages.commandCenter.wasteRate")}</p>
          <p className="text-lg font-semibold text-destructive">5.0%</p>
        </div>
      </div>
    </div>
  );
});
