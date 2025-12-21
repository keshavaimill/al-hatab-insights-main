import { Layout } from "@/components/layout/Layout";
import { KPICard } from "@/components/dashboard/KPICard";
import { factoryKPIs as fallbackFactoryKpis, productionData as fallbackProductionData, dispatchPlan as fallbackDispatchPlan } from "@/lib/mockData";
import { chartColors } from "@/lib/colors";
import { useTranslation } from "react-i18next";
import { Factory as FactoryIcon, Gauge, Target, AlertTriangle, DollarSign } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Slider } from "@/components/ui/slider";
import { useEffect, useState } from "react";
import { fetchFactoryKpis, type FactoryKpisResponse } from "@/api/factoryKpis";
import { fetchFactoryHourlyProduction, type HourlyProductionData } from "@/api/factoryHourlyProduction";
import { fetchFactoryDispatchPlanning, type DispatchPlanningItem } from "@/api/factoryDispatchPlanning";

const Factory = () => {
  const { t } = useTranslation();
  const [productionAdjustment, setProductionAdjustment] = useState([0]);
  const [factoryKpis, setFactoryKpis] = useState<FactoryKpisResponse | null>(null);
  const [isKpiLoading, setIsKpiLoading] = useState(false);
  const [selectedFactory, setSelectedFactory] = useState<"RIYADH" | "JEDDAH">("RIYADH");
  const [selectedLine, setSelectedLine] = useState<"ALL" | "LINE_1" | "LINE_2" | "LINE_3">("ALL");
  const [productionData, setProductionData] = useState<HourlyProductionData[]>(fallbackProductionData);
  const [isProductionLoading, setIsProductionLoading] = useState(false);
  const [dispatchPlan, setDispatchPlan] = useState<DispatchPlanningItem[]>(fallbackDispatchPlan);
  const [isDispatchLoading, setIsDispatchLoading] = useState(false);

  const getFactoryIdForSelection = () => {
    // Map UI factories to factory_ids in predictions.csv.
    // Available factory_ids: F_RIYADH_1 (Riyadh), F_DUBAI_1 (Dubai)
    // Jeddah maps to F_DUBAI_1 since there's no F_JEDDAH_1 in the data
    if (selectedFactory === "RIYADH") {
      return "F_RIYADH_1";
    }
    // JEDDAH maps to Dubai factory (F_DUBAI_1) as fallback
    return "F_DUBAI_1";
  };

  const getLineIdForSelection = () => {
    if (selectedLine === "LINE_1") return "Bread_Line_01";
    if (selectedLine === "LINE_2") return "Bread_Line_02";
    if (selectedLine === "LINE_3") return "Bread_Line_03";
    return undefined;
  };

  useEffect(() => {
    let cancelled = false;

    const loadKpis = async () => {
      setIsKpiLoading(true);
      try {
        const data = await fetchFactoryKpis({
          factoryId: getFactoryIdForSelection(),
          lineId: getLineIdForSelection(),
        });
        if (!cancelled) {
          setFactoryKpis(data);
        }
      } catch (error) {
        console.error("Failed to load factory KPIs from backend, using fallback mock data.", error);
        if (!cancelled) {
          setFactoryKpis({
            lineUtilization: fallbackFactoryKpis.lineUtilization,
            productionAdherence: fallbackFactoryKpis.productionAdherence,
            defectRate: fallbackFactoryKpis.defectRate,
            wasteUnits: fallbackFactoryKpis.wasteUnits,
            wasteSAR: fallbackFactoryKpis.wasteSAR,
          });
        }
      } finally {
        if (!cancelled) {
          setIsKpiLoading(false);
        }
      }
    };

    const loadHourlyProduction = async () => {
      setIsProductionLoading(true);
      try {
        const data = await fetchFactoryHourlyProduction(
          getFactoryIdForSelection(),
          getLineIdForSelection(),
        );
        if (!cancelled) {
          setProductionData(data);
        }
      } catch (error) {
        console.error("Failed to load hourly production from backend, using fallback mock data.", error);
        if (!cancelled) {
          setProductionData(fallbackProductionData);
        }
      } finally {
        if (!cancelled) {
          setIsProductionLoading(false);
        }
      }
    };

    const loadDispatchPlanning = async () => {
      setIsDispatchLoading(true);
      try {
        const data = await fetchFactoryDispatchPlanning(
          getFactoryIdForSelection(),
          getLineIdForSelection(),
        );
        if (!cancelled) {
          setDispatchPlan(data);
        }
      } catch (error) {
        console.error("Failed to load dispatch planning from backend, using fallback mock data.", error);
        if (!cancelled) {
          setDispatchPlan(fallbackDispatchPlan);
        }
      } finally {
        if (!cancelled) {
          setIsDispatchLoading(false);
        }
      }
    };

    loadKpis();
    loadHourlyProduction();
    loadDispatchPlanning();

    return () => {
      cancelled = true;
    };
  }, [selectedFactory, selectedLine]);

  const getWasteRiskColor = (risk: string) => {
    switch (risk) {
      case "Low":
        return "text-success bg-success/20";
      case "Medium":
        return "text-warning bg-warning/20";
      case "High":
        return "text-destructive bg-destructive/20";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  const getProductDisplayName = (sku: string, productName: string) => {
    // Try to get translation by SKU first (handle both SKU-001 and SKU_001 formats)
    const normalizedSku = sku.replace(/-/g, "_");
    const translationKey = `common.productNames.${sku}`;
    const normalizedTranslationKey = `common.productNames.${normalizedSku}`;
    
    // Try with original SKU format first
    let translated = t(translationKey, { defaultValue: productName });
    if (translated !== translationKey) {
      return translated;
    }
    
    // Try with normalized SKU format (SKU-001 -> SKU_001)
    translated = t(normalizedTranslationKey, { defaultValue: productName });
    if (translated !== normalizedTranslationKey) {
      return translated;
    }
    
    // Fallback to original product name if no translation found
    return productName;
  };

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 sm:gap-3">
              <FactoryIcon className="w-5 h-5 sm:w-7 sm:h-7 text-primary shrink-0" />
              <span className="truncate">{t("pages.factory.title")}</span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground truncate">{t("pages.factory.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <select
              className="bg-secondary border border-border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm flex-1 sm:flex-none min-w-[120px]"
              value={selectedFactory}
              onChange={(e) =>
                setSelectedFactory(e.target.value === "JEDDAH" ? "JEDDAH" : "RIYADH")
              }
            >
              <option value="RIYADH">{t("pages.factory.riyadhFactory")}</option>
              <option value="JEDDAH">{t("pages.factory.jeddahFactory")}</option>
            </select>
            <select
              className="bg-secondary border border-border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm flex-1 sm:flex-none min-w-[100px]"
              value={selectedLine}
              onChange={(e) =>
                setSelectedLine(
                  e.target.value as "ALL" | "LINE_1" | "LINE_2" | "LINE_3",
                )
              }
            >
              <option value="ALL">{t("pages.factory.allLines")}</option>
              <option value="LINE_1">{t("pages.factory.line1")}</option>
              <option value="LINE_2">{t("pages.factory.line2")}</option>
              <option value="LINE_3">{t("pages.factory.line3")}</option>
            </select>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <KPICard
            title={t("pages.factory.lineUtilization")}
            value={factoryKpis?.lineUtilization ?? fallbackFactoryKpis.lineUtilization}
            unit="%"
            icon={<Gauge className="w-5 h-5" />}
          />
          <KPICard
            title={t("pages.factory.productionAdherence")}
            value={factoryKpis?.productionAdherence ?? fallbackFactoryKpis.productionAdherence}
            unit="%"
            icon={<Target className="w-5 h-5" />}
          />
          <KPICard
            title={t("pages.factory.defectRate")}
            value={factoryKpis?.defectRate ?? fallbackFactoryKpis.defectRate}
            unit="%"
            icon={<AlertTriangle className="w-5 h-5" />}
          />
          <KPICard
            title={t("pages.factory.wasteUnits")}
            value={(factoryKpis?.wasteUnits ?? fallbackFactoryKpis.wasteUnits).toLocaleString()}
            icon={<FactoryIcon className="w-5 h-5" />}
          />
          <KPICard
            title={t("pages.factory.wasteCost")}
            value={(factoryKpis?.wasteSAR ?? fallbackFactoryKpis.wasteSAR).toLocaleString()}
            unit="SAR"
            icon={<DollarSign className="w-5 h-5" />}
          />
        </div>

        {/* Production Chart */}
        <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <h3 className="font-semibold text-sm sm:text-base">{t("pages.factory.hourlyProduction")}</h3>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chartColors.orange }} />
                <span className="text-muted-foreground">{t("pages.factory.actual")}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chartColors.mediumGreen }} />
                <span className="text-muted-foreground">{t("pages.factory.demand")}</span>
              </div>
            </div>
          </div>

          <div className="h-[300px] sm:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={productionData.map(item => ({
                  ...item,
                  // Compute stacked segment: forecast demand above actual (if demand > actual)
                  // Ensure minimum visibility for demand when values are close
                  forecastStack: Math.max(0, item.demand - item.actual)
                }))}
                layout="vertical"
                barCategoryGap="8%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
                  tickLine={false}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(1)}K`}
                />
                <YAxis
                  type="category"
                  dataKey="hour"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
                  tickLine={false}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  width={55}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number, name: string, props: any) => {
                    // Custom formatter to show actual and demand values in tooltip
                    if (name === "actual") {
                      return [value.toLocaleString(), t("pages.factory.actual")];
                    }
                    if (name === "forecastStack") {
                      // Show total demand in tooltip for forecastStack segment
                      // The payload contains the original data item with demand field
                      const payload = props?.payload;
                      const totalDemand = payload?.demand ?? value;
                      return [totalDemand.toLocaleString(), t("pages.factory.demand")];
                    }
                    return [value.toLocaleString(), name];
                  }}
                />
                <Bar 
                  dataKey="actual" 
                  fill={chartColors.orange}
                  fillOpacity={0.75}
                  radius={[0, 0, 0, 0]} 
                  stackId="production"
                  name={t("pages.factory.actual")}
                />
                <Bar 
                  dataKey="forecastStack" 
                  fill={chartColors.mediumGreen}
                  fillOpacity={1}
                  stroke={chartColors.mediumGreen}
                  strokeWidth={1}
                  radius={[0, 4, 4, 0]} 
                  stackId="production"
                  name={t("pages.factory.demand")}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dispatch Planning */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-3 sm:p-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h3 className="font-semibold text-sm sm:text-base">{t("pages.factory.dispatchPlanning")}</h3>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {t("pages.factory.todaysProductionSchedule")}
            </div>
          </div>
          <div className="overflow-x-auto -mx-3 sm:mx-0 data-table-wrapper">
            <table className="data-table min-w-full">
              <thead>
                <tr>
                  <th>{t("pages.factory.sku")}</th>
                  <th>{t("pages.factory.productName")}</th>
                  <th>{t("pages.factory.forecastedDCDemand")}</th>
                  <th>{t("pages.factory.recommendedProduction")}</th>
                  <th>{t("pages.factory.capacityImpact")}</th>
                  <th>{t("pages.factory.wasteRisk")}</th>
                </tr>
              </thead>
              <tbody>
                {isDispatchLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      {t("common.loading")}
                    </td>
                  </tr>
                ) : dispatchPlan.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      {t("common.noDataAvailable")}
                    </td>
                  </tr>
                ) : (
                  dispatchPlan.map((item) => (
                    <tr key={item.sku}>
                      <td className="font-mono text-sm">{item.sku}</td>
                      <td className="font-medium">{getProductDisplayName(item.sku, item.name)}</td>
                      <td>{item.forecastDemand.toLocaleString()}</td>
                      <td>{item.recommendedProd.toLocaleString()}</td>
                      <td>{item.capacityImpact}%</td>
                      <td>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getWasteRiskColor(item.wasteRisk)}`}>
                          {t(`pages.factory.${item.wasteRisk.toLowerCase()}` as "pages.factory.low" | "pages.factory.medium" | "pages.factory.high")}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* What-If Slider */}
        <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
            <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">{t("pages.factory.whatIfAnalysis")}</h3>
          <div className="space-y-4 sm:space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-muted-foreground">Production Adjustment</span>
                <span className="text-xs sm:text-sm font-medium text-primary">
                  {productionAdjustment[0] > 0 ? "+" : ""}{productionAdjustment[0]}%
                </span>
              </div>
              <Slider
                value={productionAdjustment}
                onValueChange={setProductionAdjustment}
                min={-30}
                max={30}
                step={5}
                className="w-full"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-border">
              <div className="text-center p-3 sm:p-4 bg-secondary/50 rounded-lg">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Projected DC Stock</p>
                <p className="text-base sm:text-xl font-semibold break-words">
                  {(125000 * (1 + productionAdjustment[0] / 100)).toLocaleString()} units
                </p>
              </div>
              <div className="text-center p-3 sm:p-4 bg-secondary/50 rounded-lg">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Service Level Impact</p>
                <p className={`text-base sm:text-xl font-semibold ${productionAdjustment[0] >= 0 ? "text-success" : "text-destructive"}`}>
                  {productionAdjustment[0] >= 0 ? "+" : ""}{(productionAdjustment[0] * 0.1).toFixed(1)}%
                </p>
              </div>
              <div className="text-center p-3 sm:p-4 bg-secondary/50 rounded-lg">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Projected Waste Risk</p>
                <p className={`text-base sm:text-xl font-semibold ${productionAdjustment[0] <= 0 ? "text-success" : "text-warning"}`}>
                  {productionAdjustment[0] > 10 ? "High" : productionAdjustment[0] > 0 ? "Medium" : "Low"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Factory;
