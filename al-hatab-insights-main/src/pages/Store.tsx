import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { KPICard } from "@/components/dashboard/KPICard";
import { storeHourlySales, stockoutTimeline, shelfPerformance as fallbackShelfPerformance, storeActions, storeKPIs as fallbackStoreKPIs } from "@/lib/mockData";
import { Store as StoreIcon, Package, AlertTriangle, DollarSign, TrendingUp, Lightbulb } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { useTranslation } from "react-i18next";
import { fetchStoreKpis, type StoreKpisResponse } from "@/api/storeKpis";
import { fetchStoreShelfPerformance, type ShelfPerformanceItem } from "@/api/storeShelfPerformance";

const Store = () => {
  const { t } = useTranslation();
  const [selectedStore, setSelectedStore] = useState("ST_DUBAI_HYPER_01");

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

  const translateAction = (actionText: string): string => {
    // Extract SKU from action text (e.g., "SKU-003", "SKU-005", "SKU-001")
    const skuMatch = actionText.match(/SKU[-_]\d+/);
    if (!skuMatch) return actionText;
    
    const sku = skuMatch[0];
    const translatedSku = getProductDisplayName(sku, sku);
    
    // Translate common action patterns
    if (actionText.includes("Increase facing")) {
      const match = actionText.match(/from (\d+) to (\d+)/);
      if (match) {
        return t("pages.store.actionTemplates.increaseFacing", {
          sku: translatedSku,
          from: match[1],
          to: match[2]
        });
      }
    } else if (actionText.includes("Reduce order")) {
      const match = actionText.match(/by (\d+)%/);
      if (match) {
        return t("pages.store.actionTemplates.reduceOrder", {
          sku: translatedSku,
          percent: match[1]
        });
      }
    } else if (actionText.includes("Move") && actionText.includes("eye-level")) {
      return t("pages.store.actionTemplates.moveToEyeLevel", {
        sku: translatedSku
      });
    }
    
    // Fallback: replace SKU in original text with translated SKU
    return actionText.replace(sku, translatedSku);
  };

  const translateReason = (reasonText: string): string => {
    // Extract SKU if present
    const skuMatch = reasonText.match(/SKU[-_]\d+/);
    const translatedSku = skuMatch ? getProductDisplayName(skuMatch[0], skuMatch[0]) : null;
    
    // Translate common reason patterns
    if (reasonText.includes("High sell-through rate")) {
      const match = reasonText.match(/\(([\d.]+)\/hr\)/);
      if (match) {
        return t("pages.store.reasonTemplates.highSellThrough", {
          rate: match[1]
        });
      }
    } else if (reasonText.includes("High waste risk")) {
      const match = reasonText.match(/(\d+) units wasted/);
      if (match) {
        return t("pages.store.reasonTemplates.highWasteRisk", {
          units: match[1]
        });
      }
    } else if (reasonText.includes("Premium product")) {
      const match = reasonText.match(/([\d.]+) sales\/hr/);
      if (match) {
        return t("pages.store.reasonTemplates.premiumProduct", {
          rate: match[1]
        });
      }
    }
    
    // Fallback: replace SKU if present
    if (translatedSku && skuMatch) {
      return reasonText.replace(skuMatch[0], translatedSku);
    }
    
    return reasonText;
  };
  const [storeKpis, setStoreKpis] = useState<StoreKpisResponse | null>(null);
  const [isKpiLoading, setIsKpiLoading] = useState(false);
  const [shelfPerformance, setShelfPerformance] = useState<ShelfPerformanceItem[]>(fallbackShelfPerformance);
  const [isShelfLoading, setIsShelfLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadKpis = async () => {
      setIsKpiLoading(true);
      try {
        const data = await fetchStoreKpis(selectedStore);
        if (!cancelled) {
          setStoreKpis(data);
        }
      } catch (error) {
        console.error("Failed to load store KPIs from backend, using fallback mock data.", error);
        if (!cancelled) {
          setStoreKpis({
            storeId: selectedStore,
            onShelfAvailability: fallbackStoreKPIs.onShelfAvailability,
            stockoutIncidents: fallbackStoreKPIs.stockoutIncidents,
            wasteUnits: fallbackStoreKPIs.wasteUnits,
            wasteSAR: fallbackStoreKPIs.wasteSAR,
          });
        }
      } finally {
        if (!cancelled) {
          setIsKpiLoading(false);
        }
      }
    };

    const loadShelfPerformance = async () => {
      setIsShelfLoading(true);
      try {
        const data = await fetchStoreShelfPerformance(selectedStore);
        if (!cancelled) {
          setShelfPerformance(data);
        }
      } catch (error) {
        console.error("Failed to load shelf performance from backend, using fallback mock data.", error);
        if (!cancelled) {
          setShelfPerformance(fallbackShelfPerformance);
        }
      } finally {
        if (!cancelled) {
          setIsShelfLoading(false);
        }
      }
    };

    loadKpis();
    loadShelfPerformance();
    return () => {
      cancelled = true;
    };
  }, [selectedStore]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "text-destructive bg-destructive/20";
      case "Medium":
        return "text-warning bg-warning/20";
      case "Low":
        return "text-success bg-success/20";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 sm:gap-3">
              <StoreIcon className="w-5 h-5 sm:w-7 sm:h-7 text-primary shrink-0" />
              <span className="truncate">{t("pages.store.title")}</span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground truncate">{t("pages.store.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <select
              className="bg-secondary border border-border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm min-w-[160px]"
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
            >
              <option value="ST_DUBAI_HYPER_01">{t("pages.store.makkahStore1")}</option>
              <option value="ST_JEDDAH_MALL_01">{t("pages.store.madinahStore2")}</option>
              <option value="ST_RIYADH_MALL_01">{t("pages.store.khobarStore3")}</option>
              <option value="ST_RIYADH_STREET_01">{t("pages.store.tabukStore4")}</option>
            </select>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <KPICard
            title={t("pages.store.onShelfAvailability")}
            value={storeKpis?.onShelfAvailability ?? fallbackStoreKPIs.onShelfAvailability}
            unit="%"
            icon={<Package className="w-5 h-5" />}
          />
          <KPICard
            title={t("pages.store.stockoutIncidents")}
            value={storeKpis?.stockoutIncidents ?? fallbackStoreKPIs.stockoutIncidents}
            unit={t("pages.store.count")}
            icon={<AlertTriangle className="w-5 h-5" />}
          />
          <KPICard
            title={t("pages.store.wasteUnits")}
            value={storeKpis?.wasteUnits ?? fallbackStoreKPIs.wasteUnits}
            icon={<StoreIcon className="w-5 h-5" />}
          />
          <KPICard
            title={t("pages.store.wasteCost")}
            value={(storeKpis?.wasteSAR ?? fallbackStoreKPIs.wasteSAR).toLocaleString()}
            unit="SAR"
            icon={<DollarSign className="w-5 h-5" />}
          />
          <KPICard
            title={t("pages.store.promoUplift")}
            value={fallbackStoreKPIs.promoUplift}
            unit="%"
            icon={<TrendingUp className="w-5 h-5" />}
          />
        </div>

        {/* Hourly Sales Chart */}
        <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <h3 className="font-semibold text-sm sm:text-base">{t("pages.store.hourlySalesVsForecast")}</h3>
            <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-primary shrink-0" />
                <span className="text-muted-foreground">{t("pages.store.sales")}</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-chart-4 shrink-0" />
                <span className="text-muted-foreground">{t("pages.store.forecast")}</span>
              </div>
            </div>
          </div>

          <div className="h-[220px] sm:h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={storeHourlySales}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="hour"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
                  tickLine={false}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  interval={4}
                />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
                  tickLine={false}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  width={35}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#salesGradient)"
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="hsl(var(--chart-4))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stockout Timeline */}
        <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
          <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">{t("pages.store.stockoutTimelineToday")}</h3>
          <div className="relative">
            {/* Hour markers */}
            <div className="flex justify-between mb-2 text-[10px] sm:text-xs text-muted-foreground">
              {[6, 9, 12, 15, 18, 21].map((hour) => (
                <span key={hour}>{hour}:00</span>
              ))}
            </div>
            
            {/* Timeline bar */}
            <div className="relative h-8 sm:h-10 bg-secondary/50 rounded-lg overflow-hidden">
              {stockoutTimeline.map((stockout, index) => {
                const startPercent = ((stockout.hour - 6) / 18) * 100;
                const widthPercent = (stockout.duration / (18 * 60)) * 100;
                return (
                  <div
                    key={index}
                    className="absolute top-0.5 bottom-0.5 sm:top-1 sm:bottom-1 rounded flex items-center justify-center text-[10px] sm:text-xs text-primary-foreground font-medium"
                    style={{
                      left: `${startPercent}%`,
                      width: `${Math.max(widthPercent, 3)}%`,
                      backgroundColor: "hsl(var(--primary) / 0.8)",
                    }}
                    title={`${stockout.sku} - ${stockout.duration} min stockout`}
                  >
                    <span className="truncate">{stockout.sku}</span>
                  </div>
                );
              })}
            </div>
            
            {/* Legend */}
            <div className="mt-2 sm:mt-3 flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-muted-foreground">
              <span>{t("pages.store.totalStockoutTime")}: <span className="text-primary font-medium">1h 40m</span></span>
              <span>{t("pages.store.affectedSKUs")}: <span className="text-foreground font-medium">3</span></span>
            </div>
          </div>
        </div>

        {/* Shelf Performance Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-3 sm:p-4 border-b border-border">
            <h3 className="font-semibold text-sm sm:text-base">{t("pages.store.shelfPerformance")}</h3>
          </div>
          <div className="overflow-x-auto -mx-3 sm:mx-0 data-table-wrapper">
            {isShelfLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                <p className="text-sm">{t("pages.store.loadingShelfPerformance")}</p>
              </div>
            ) : shelfPerformance.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p className="text-sm">{t("pages.store.noShelfPerformanceData")}</p>
              </div>
            ) : (
              <table className="data-table min-w-full">
                <thead>
                  <tr>
                    <th>{t("pages.store.sku")}</th>
                    <th>{t("pages.store.productName")}</th>
                    <th>{t("pages.store.planogramCap")}</th>
                    <th>{t("pages.store.onShelf")}</th>
                    <th>{t("pages.store.percentFilled")}</th>
                    <th>{t("pages.store.salesPerHour")}</th>
                    <th>{t("pages.store.waste7d")}</th>
                  </tr>
                </thead>
                <tbody>
                  {shelfPerformance.map((item) => (
                  <tr key={item.sku}>
                    <td className="font-mono text-sm">{item.sku}</td>
                    <td className="font-medium">{getProductDisplayName(item.sku, item.name)}</td>
                    <td>{item.planogramCap}</td>
                    <td>{item.onShelf}</td>
                    <td>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-12 sm:w-16 h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${item.shelfFill >= 80 ? "bg-success" : item.shelfFill >= 50 ? "bg-warning" : "bg-destructive"}`}
                            style={{ width: `${item.shelfFill}%` }}
                          />
                        </div>
                        <span className="text-xs sm:text-sm whitespace-nowrap">{item.shelfFill}%</span>
                      </div>
                    </td>
                    <td className="text-primary font-medium whitespace-nowrap">{item.salesPerHour}</td>
                    <td className={`whitespace-nowrap ${item.wasteLast7 > 15 ? "text-destructive" : item.wasteLast7 > 10 ? "text-warning" : "text-success"}`}>
                      {item.wasteLast7}
                    </td>
                  </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* AI Store Manager Actions */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-3 sm:p-4 border-b border-border flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm sm:text-base">{t("pages.store.aiStoreManagerRecommendations")}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">{t("pages.store.autoGeneratedActionItems")}</p>
            </div>
          </div>
          <div className="divide-y divide-border">
            {storeActions.map((action, index) => (
              <div key={index} className="p-3 sm:p-4 flex items-start gap-2 sm:gap-4 hover:bg-secondary/30 transition-colors">
                <span className={`px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium shrink-0 ${getPriorityColor(action.priority)}`}>
                  {t(`pages.factory.${action.priority.toLowerCase()}` as "pages.factory.low" | "pages.factory.medium" | "pages.factory.high")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm sm:text-base">{translateAction(action.action)}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">{translateReason(action.reason)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Store;
