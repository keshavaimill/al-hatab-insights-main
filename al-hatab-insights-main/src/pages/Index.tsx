import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { KPICard } from "@/components/dashboard/KPICard";
import { SaudiMap } from "@/components/dashboard/SaudiMap";
import { NodeHealthTable } from "@/components/dashboard/NodeHealthTable";
import { FunnelChart } from "@/components/dashboard/FunnelChart";
import { DemandForecastChart } from "@/components/dashboard/DemandForecastChart";
import { HeatmapChart } from "@/components/dashboard/HeatmapChart";
import { kpiData as fallbackKpiData } from "@/lib/mockData";
import { useTranslation } from "react-i18next";
import { Target, DollarSign, TrendingUp, Package, Sparkles, BarChart3 } from "lucide-react";
import { fetchGlobalKpis, type GlobalKpisResponse } from "@/api/globalKpis";

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};

const Index = () => {
  const { t } = useTranslation();
  const [globalKpis, setGlobalKpis] = useState<GlobalKpisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadGlobalKpis = async () => {
      setIsLoading(true);
      try {
        const data = await fetchGlobalKpis();
        if (!cancelled) {
          setGlobalKpis(data);
        }
      } catch (error) {
        console.error("Failed to load global KPIs from backend, using fallback mock data.", error);
        if (!cancelled) {
          // Use fallback data structure
          setGlobalKpis(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadGlobalKpis();
    return () => {
      cancelled = true;
    };
  }, []);

  // Use real data if available, otherwise fallback to mock
  const kpiData = globalKpis
    ? {
        forecastAccuracy: {
          value: globalKpis.forecast_accuracy,
          trend: 0, // TODO: Calculate trend from historical data
          sparkline: [globalKpis.forecast_accuracy], // TODO: Generate sparkline from historical data
        },
        wasteCost: {
          value: globalKpis.waste_cost,
          trend: 0, // TODO: Calculate trend
          percentOfRevenue: globalKpis.revenue > 0 ? (globalKpis.waste_cost / globalKpis.revenue) * 100 : 0,
          sparkline: [globalKpis.waste_cost], // TODO: Generate sparkline
        },
        serviceLevel: {
          value: globalKpis.service_level,
          trend: 0, // TODO: Calculate trend
          sparkline: [globalKpis.service_level], // TODO: Generate sparkline
        },
        onShelfAvailability: {
          value: globalKpis.on_shelf_availability,
          trend: 0, // TODO: Calculate trend
          sparkline: [globalKpis.on_shelf_availability], // TODO: Generate sparkline
        },
        netMargin: {
          value: globalKpis.net_margin,
          trend: 0, // TODO: Calculate trend
          sparkline: [globalKpis.net_margin], // TODO: Generate sparkline
        },
        aiUplift: {
          value: globalKpis.ai_uplift,
          trend: 0, // TODO: Calculate trend
          sparkline: [globalKpis.ai_uplift], // TODO: Generate sparkline
        },
      }
    : fallbackKpiData;

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in w-full">
        {/* Page Header */}
        <div className="flex items-start sm:items-center justify-between gap-2 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold">{t("pages.commandCenter.title")}</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">{t("pages.commandCenter.subtitle")}</p>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 items-stretch w-full">
          <KPICard
            title={t("pages.commandCenter.forecastAccuracy")}
            value={kpiData.forecastAccuracy.value}
            unit="%"
            trend={kpiData.forecastAccuracy.trend}
            trendLabel={t("pages.commandCenter.vsLastWeek")}
            sparklineData={kpiData.forecastAccuracy.sparkline}
            icon={<Target className="w-5 h-5" />}
          />
          <KPICard
            title={t("pages.commandCenter.wasteCost")}
            value={formatCurrency(kpiData.wasteCost.value)}
            unit="SAR"
            trend={kpiData.wasteCost.trend}
            trendLabel={`${kpiData.wasteCost.percentOfRevenue}% ${t("pages.commandCenter.ofRevenue")}`}
            sparklineData={kpiData.wasteCost.sparkline}
            icon={<DollarSign className="w-5 h-5" />}
          />
          <KPICard
            title={t("pages.commandCenter.serviceLevel")}
            value={kpiData.serviceLevel.value}
            unit="%"
            trend={kpiData.serviceLevel.trend}
            trendLabel={t("pages.commandCenter.dcAndStore")}
            sparklineData={kpiData.serviceLevel.sparkline}
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <KPICard
            title={t("pages.commandCenter.onShelfAvailability")}
            value={kpiData.onShelfAvailability.value}
            unit="%"
            trend={kpiData.onShelfAvailability.trend}
            trendLabel={t("common.retail")}
            sparklineData={kpiData.onShelfAvailability.sparkline}
            icon={<Package className="w-5 h-5" />}
          />
          <KPICard
            title={t("pages.commandCenter.netMargin")}
            value={formatCurrency(kpiData.netMargin.value)}
            unit="SAR"
            trend={kpiData.netMargin.trend}
            trendLabel={t("pages.commandCenter.afterWaste")}
            sparklineData={kpiData.netMargin.sparkline}
            icon={<BarChart3 className="w-5 h-5" />}
          />
          <KPICard
            title={t("pages.commandCenter.aiUplift")}
            value={formatCurrency(kpiData.aiUplift.value)}
            unit="SAR"
            trend={kpiData.aiUplift.trend}
            trendLabel={t("pages.commandCenter.vsManual")}
            sparklineData={kpiData.aiUplift.sparkline}
            icon={<Sparkles className="w-5 h-5" />}
          />
        </div>

        {/* Map & Node Health */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 w-full">
          <div className="bg-card rounded-xl border border-border p-4 sm:p-6 w-full min-w-0">
            <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">{t("pages.commandCenter.saudiArabiaNetwork")}</h3>
            <SaudiMap />
          </div>
          <div className="w-full min-w-0">
          <NodeHealthTable />
          </div>
        </div>

        {/* Funnel Chart */}
        <FunnelChart />

        {/* Time Series Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 w-full">
          <div className="w-full min-w-0">
          <DemandForecastChart />
          </div>
          <div className="w-full min-w-0">
          <HeatmapChart />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
