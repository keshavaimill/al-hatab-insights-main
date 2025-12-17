import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { KPICard } from "@/components/dashboard/KPICard";
import { storeHourlySales, stockoutTimeline, shelfPerformance, storeActions, storeKPIs as fallbackStoreKPIs } from "@/lib/mockData";
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

const Store = () => {
  const { t } = useTranslation();
  const [selectedStore, setSelectedStore] = useState("ST_DUBAI_HYPER_01");
  const [storeKpis, setStoreKpis] = useState<StoreKpisResponse | null>(null);
  const [isKpiLoading, setIsKpiLoading] = useState(false);

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

    loadKpis();
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
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <StoreIcon className="w-7 h-7 text-primary" />
              {t("pages.store.title")}
            </h1>
            <p className="text-muted-foreground">{t("pages.store.subtitle")}</p>
          </div>
          <div className="flex items-center gap-4">
            <select
              className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold">{t("pages.store.hourlySalesVsForecast")}</h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-muted-foreground">{t("pages.store.sales")}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-chart-4" />
                <span className="text-muted-foreground">{t("pages.store.forecast")}</span>
              </div>
            </div>
          </div>

          <div className="h-[250px]">
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
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: "hsl(var(--border))" }}
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
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold mb-4">Stockout Timeline (Today)</h3>
          <div className="relative">
            {/* Hour markers */}
            <div className="flex justify-between mb-2 text-xs text-muted-foreground">
              {[6, 9, 12, 15, 18, 21].map((hour) => (
                <span key={hour}>{hour}:00</span>
              ))}
            </div>
            
            {/* Timeline bar */}
            <div className="relative h-10 bg-secondary/50 rounded-lg overflow-hidden">
              {stockoutTimeline.map((stockout, index) => {
                const startPercent = ((stockout.hour - 6) / 18) * 100;
                const widthPercent = (stockout.duration / (18 * 60)) * 100;
                return (
                  <div
                    key={index}
                    className="absolute top-1 bottom-1 rounded flex items-center justify-center text-xs text-primary-foreground font-medium"
                    style={{
                      left: `${startPercent}%`,
                      width: `${Math.max(widthPercent, 3)}%`,
                      backgroundColor: "hsl(var(--primary) / 0.8)",
                    }}
                    title={`${stockout.sku} - ${stockout.duration} min stockout`}
                  >
                    {stockout.sku}
                  </div>
                );
              })}
            </div>
            
            {/* Legend */}
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <span>Total stockout time: <span className="text-primary font-medium">1h 40m</span></span>
              <span>Affected SKUs: <span className="text-foreground font-medium">3</span></span>
            </div>
          </div>
        </div>

        {/* Shelf Performance Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold">Shelf Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product Name</th>
                  <th>Planogram Cap</th>
                  <th>On-Shelf</th>
                  <th>% Filled</th>
                  <th>Sales/Hour</th>
                  <th>Waste (7d)</th>
                </tr>
              </thead>
              <tbody>
                {shelfPerformance.map((item) => (
                  <tr key={item.sku}>
                    <td className="font-mono text-sm">{item.sku}</td>
                    <td className="font-medium">{item.name}</td>
                    <td>{item.planogramCap}</td>
                    <td>{item.onShelf}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${item.shelfFill >= 80 ? "bg-success" : item.shelfFill >= 50 ? "bg-warning" : "bg-destructive"}`}
                            style={{ width: `${item.shelfFill}%` }}
                          />
                        </div>
                        <span className="text-sm">{item.shelfFill}%</span>
                      </div>
                    </td>
                    <td className="text-primary font-medium">{item.salesPerHour}</td>
                    <td className={item.wasteLast7 > 15 ? "text-destructive" : item.wasteLast7 > 10 ? "text-warning" : "text-success"}>
                      {item.wasteLast7}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Store Manager Actions */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">AI Store Manager Recommendations</h3>
              <p className="text-sm text-muted-foreground">Auto-generated action items</p>
            </div>
          </div>
          <div className="divide-y divide-border">
            {storeActions.map((action, index) => (
              <div key={index} className="p-4 flex items-start gap-4 hover:bg-secondary/30 transition-colors">
                <span className={`px-2 py-1 rounded-full text-xs font-medium shrink-0 ${getPriorityColor(action.priority)}`}>
                  {action.priority}
                </span>
                <div>
                  <p className="font-medium">{action.action}</p>
                  <p className="text-sm text-muted-foreground mt-1">{action.reason}</p>
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
