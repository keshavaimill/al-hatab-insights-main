import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { KPICard } from "@/components/dashboard/KPICard";
import { dcKPIs as fallbackDcKpis, inventoryAgeData as fallbackInventoryAgeData, replenishmentRecs } from "@/lib/mockData";
import { useTranslation } from "react-i18next";
import { Warehouse, TrendingUp, Clock, AlertTriangle, Package } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { fetchDcKpis, type DcKpisResponse } from "@/api/dcKpis";
import { fetchDcDaysCover, type DcDaysCoverRow } from "@/api/dcDaysCover";
import { fetchDcInventoryAge, type InventoryAgeBucket } from "@/api/dcInventoryAge";

const DC = () => {
  const { t } = useTranslation();
  const [selectedDc, setSelectedDc] = useState("DC_JEDDAH");

  const getDCDisplayName = (dcId: string) => {
    // Try to get translation by node_id first
    const translationKey = `common.nodeNames.${dcId}`;
    const translated = t(translationKey, { defaultValue: dcId });
    // If translation exists (returned value is different from the key), use it
    return translated !== translationKey ? translated : dcId;
  };

  const getStoreDisplayName = (storeName: string) => {
    // Map store names to translation keys
    const storeKeyMap: Record<string, string> = {
      "Makkah Store #1": "pages.dc.makkahStore1",
      "Madinah Store #2": "pages.dc.madinahStore2",
      "Khobar Store #3": "pages.dc.khobarStore3",
      "Tabuk Store #4": "pages.dc.tabukStore4",
    };
    
    const translationKey = storeKeyMap[storeName];
    if (translationKey) {
      const translated = t(translationKey, { defaultValue: storeName });
      return translated !== translationKey ? translated : storeName;
    }
    return storeName;
  };

  const getProductDisplayName = (sku: string) => {
    // Try to get translation by SKU first (handle both SKU-001 and SKU_001 formats)
    const normalizedSku = sku.replace(/-/g, "_");
    const translationKey = `common.productNames.${sku}`;
    const normalizedTranslationKey = `common.productNames.${normalizedSku}`;
    
    // Try with original SKU format first
    let translated = t(translationKey, { defaultValue: sku });
    if (translated !== translationKey) {
      return translated;
    }
    
    // Try with normalized SKU format (SKU-001 -> SKU_001)
    translated = t(normalizedTranslationKey, { defaultValue: sku });
    if (translated !== normalizedTranslationKey) {
      return translated;
    }
    
    // Fallback to original SKU if no translation found
    return sku;
  };
  const [dcKpis, setDcKpis] = useState<DcKpisResponse | null>(null);
  const [isKpiLoading, setIsKpiLoading] = useState(false);
  const [daysCoverData, setDaysCoverData] = useState<DcDaysCoverRow[]>([]);
  const [inventoryAgeData, setInventoryAgeData] = useState<InventoryAgeBucket[]>(fallbackInventoryAgeData);
  const [isInventoryAgeLoading, setIsInventoryAgeLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadKpis = async () => {
      setIsKpiLoading(true);
      try {
        const data = await fetchDcKpis(selectedDc);
        if (!cancelled) {
          setDcKpis(data);
        }
      } catch (error) {
        console.error("Failed to load DC KPIs from backend, using fallback mock data.", error);
        if (!cancelled) {
          setDcKpis({
            dcId: selectedDc,
            serviceLevelPct: fallbackDcKpis.serviceLevel,
            wastePercent: fallbackDcKpis.wastePercent,
            avgShelfLifeDays: fallbackDcKpis.avgShelfLife,
            backorders: fallbackDcKpis.backorders,
          });
        }
      } finally {
        if (!cancelled) {
          setIsKpiLoading(false);
        }
      }
    };

    loadKpis();

    return () => {
      cancelled = true;
    };
  }, [selectedDc]);

  useEffect(() => {
    let cancelled = false;

    const loadDaysCover = async () => {
      try {
        const data = await fetchDcDaysCover();
        if (!cancelled) {
          setDaysCoverData(data);
        }
      } catch (error) {
        console.error("Failed to load DC days-of-cover data from backend.", error);
      }
    };

    const loadInventoryAge = async () => {
      setIsInventoryAgeLoading(true);
      try {
        const data = await fetchDcInventoryAge(selectedDc);
        if (!cancelled) {
          setInventoryAgeData(data);
        }
      } catch (error) {
        console.error("Failed to load inventory age distribution from backend, using fallback mock data.", error);
        if (!cancelled) {
          setInventoryAgeData(fallbackInventoryAgeData);
        }
      } finally {
        if (!cancelled) {
          setIsInventoryAgeLoading(false);
        }
      }
    };

    loadDaysCover();
    loadInventoryAge();

    return () => {
      cancelled = true;
    };
  }, [selectedDc]);

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 sm:gap-3">
              <Warehouse className="w-5 h-5 sm:w-7 sm:h-7 text-primary shrink-0" />
              <span className="truncate">{t("pages.dc.title")}</span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground truncate">{t("pages.dc.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <select
              className="bg-secondary border border-border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm min-w-[140px]"
              value={selectedDc}
              onChange={(e) => setSelectedDc(e.target.value)}
            >
              <option value="DC_JEDDAH">{t("pages.dc.jeddahDC")}</option>
              <option value="DC_DAMMAM">{t("pages.dc.dammamDC")}</option>
              <option value="DC_DUBAI">{t("pages.dc.dubaiDC")}</option>
              <option value="DC_RIYADH">{t("pages.dc.riyadhDC")}</option>
            </select>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <KPICard
            title={t("pages.dc.dcServiceLevel")}
            value={dcKpis?.serviceLevelPct ?? fallbackDcKpis.serviceLevel}
            unit="%"
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <KPICard
            title={t("pages.dc.wasteRate")}
            value={dcKpis?.wastePercent ?? fallbackDcKpis.wastePercent}
            unit="%"
            icon={<AlertTriangle className="w-5 h-5" />}
          />
          <KPICard
            title={t("pages.dc.avgShelfLifeRemaining")}
            value={dcKpis?.avgShelfLifeDays ?? fallbackDcKpis.avgShelfLife}
            unit={t("pages.dc.days")}
            icon={<Clock className="w-5 h-5" />}
          />
          <KPICard
            title={t("pages.dc.backorders")}
            value={dcKpis?.backorders ?? fallbackDcKpis.backorders}
            unit={t("pages.dc.units")}
            icon={<Package className="w-5 h-5" />}
          />
        </div>

        {/* Inventory Age Pyramid */}
        <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
          <h3 className="font-semibold mb-4 sm:mb-6 text-sm sm:text-base">{t("pages.dc.inventoryAgeDistribution")}</h3>
          <div className="h-[250px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inventoryAgeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
                  tickLine={false}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                />
                <YAxis
                  type="category"
                  dataKey="bucket"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
                  tickLine={false}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  width={65}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`${value.toLocaleString()} ${t("pages.dc.units")}`, t("pages.dc.inventory")]}
                />
                <Bar dataKey="units" radius={[0, 4, 4, 0]}>
                  {inventoryAgeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Summary */}
          <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-border grid grid-cols-3 gap-2 sm:gap-4 text-center">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">{t("pages.dc.freshStock")}</p>
              <p className="text-base sm:text-xl font-semibold text-success">
                {(inventoryAgeData.find((item) => item.bucket === "Fresh Stock (0-3 days)")?.units || 0).toLocaleString()}{" "}
                {t("pages.dc.units")}
              </p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">{t("pages.dc.atRisk")}</p>
              <p className="text-base sm:text-xl font-semibold text-warning">
                {(inventoryAgeData.find((item) => item.bucket === "At Risk (4-5 days)")?.units || 0).toLocaleString()}{" "}
                {t("pages.dc.units")}
              </p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">{t("pages.dc.nearExpiry")}</p>
              <p className="text-base sm:text-xl font-semibold text-destructive">
                {(inventoryAgeData.find((item) => item.bucket === "Near Expiry (6+ days)")?.units || 0).toLocaleString()}{" "}
                {t("pages.dc.units")}
              </p>
            </div>
          </div>
        </div>

        {/* DC × SKU Days of Cover Heatmap */}
        <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
          <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">{t("pages.dc.daysOfCoverByDCAndSKU")}</h3>
          <div className="overflow-x-auto -mx-3 sm:mx-0 data-table-wrapper">
            <table className="w-full text-xs sm:text-sm min-w-full">
              <thead>
                <tr>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-muted-foreground font-medium">{t("common.nodeType.dc")}</th>
                  <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-muted-foreground font-medium whitespace-nowrap">
                    {getProductDisplayName("SKU-001")}<br/><span className="text-[10px] sm:text-xs">(Target: 4d)</span>
                  </th>
                  <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-muted-foreground font-medium whitespace-nowrap">
                    {getProductDisplayName("SKU-002")}<br/><span className="text-[10px] sm:text-xs">(Target: 4d)</span>
                  </th>
                  <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-muted-foreground font-medium whitespace-nowrap">
                    {getProductDisplayName("SKU-003")}<br/><span className="text-[10px] sm:text-xs">(Target: 5d)</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {["DC_JEDDAH", "DC_DAMMAM", "DC_DUBAI", "DC_RIYADH"].map((dcId) => {
                  const label = getDCDisplayName(dcId);

                  const skuTargets: { skuId: string; target: number }[] = [
                    { skuId: "SKU_101", target: 4 },
                    { skuId: "SKU_102", target: 4 },
                    { skuId: "SKU_103", target: 5 },
                  ];

                  return (
                    <tr key={dcId} className="border-t border-border">
                      <td className="py-2 sm:py-3 px-2 sm:px-4 font-medium whitespace-nowrap">{label}</td>
                      {skuTargets.map(({ skuId, target }) => {
                        const row = daysCoverData.find(
                          (r) => r.dcId === dcId && r.skuId === skuId,
                        );
                        const cover = row?.daysCover ?? null;

                        if (cover == null) {
                          return (
                            <td key={skuId} className="py-2 sm:py-3 px-2 sm:px-4 text-center text-muted-foreground">
                              —
                            </td>
                          );
                        }

                        const ratio = cover / target;
                        const bgColor =
                          ratio < 0.7
                            ? "bg-destructive/30"
                            : ratio < 0.9
                              ? "bg-warning/30"
                              : ratio > 1.2
                                ? "bg-warning/30"
                                : "bg-success/30";
                        const textColor =
                          ratio < 0.7
                            ? "text-destructive"
                            : ratio < 0.9
                              ? "text-warning"
                              : ratio > 1.2
                                ? "text-warning"
                                : "text-success";

                        return (
                          <td key={skuId} className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                            <span
                              className={`inline-block px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg ${bgColor} ${textColor} font-medium text-[10px] sm:text-xs whitespace-nowrap`}
                            >
                              {cover.toFixed(1)}d
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Replenishment Recommendations */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-3 sm:p-4 border-b border-border">
            <h3 className="font-semibold text-sm sm:text-base">{t("pages.dc.aiReplenishmentRecommendations")}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">{t("pages.dc.suggestedDispatchesToStores")}</p>
          </div>
          <div className="overflow-x-auto -mx-3 sm:mx-0 data-table-wrapper">
            <table className="data-table min-w-full">
              <thead>
                <tr>
                  <th>{t("pages.dc.store")}</th>
                  <th>{t("pages.factory.sku")}</th>
                  <th>{t("pages.dc.currentOnHand")}</th>
                  <th>{t("pages.dc.recommendedQty")}</th>
                  <th>{t("pages.dc.reason")}</th>
                </tr>
              </thead>
              <tbody>
                {replenishmentRecs.map((rec, index) => (
                  <tr key={index}>
                    <td className="font-medium">{getStoreDisplayName(rec.store)}</td>
                    <td className="font-mono text-sm">{getProductDisplayName(rec.sku)}</td>
                    <td>{rec.onHand} units</td>
                    <td>
                      <span className={rec.recommended > rec.onHand ? "text-success" : "text-warning"}>
                        {rec.recommended > rec.onHand ? "+" : ""}{rec.recommended - rec.onHand} → {rec.recommended} units
                      </span>
                    </td>
                    <td className="text-muted-foreground text-sm">{rec.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DC;
