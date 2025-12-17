// Mock data for the Al Hatab Command Center

export const kpiData = {
  forecastAccuracy: {
    value: 94.2,
    trend: 2.3,
    sparkline: [88, 90, 91, 93, 92, 94, 94.2],
  },
  wasteCost: {
    value: 127500,
    trend: -8.5,
    percentOfRevenue: 2.1,
    sparkline: [145000, 142000, 138000, 135000, 130000, 128000, 127500],
  },
  serviceLevel: {
    value: 97.8,
    trend: 1.2,
    sparkline: [95, 96, 96.5, 97, 97.2, 97.5, 97.8],
  },
  onShelfAvailability: {
    value: 96.5,
    trend: 0.8,
    sparkline: [94, 95, 95.5, 96, 96.2, 96.3, 96.5],
  },
  netMargin: {
    value: 2450000,
    trend: 5.2,
    sparkline: [2200000, 2280000, 2320000, 2380000, 2410000, 2430000, 2450000],
  },
  aiUplift: {
    value: 185000,
    trend: 12.4,
    sparkline: [120000, 135000, 150000, 160000, 170000, 178000, 185000],
  },
};

export const nodes = [
  { id: 1, name: "Riyadh Factory", type: "Factory", lat: 24.7136, lng: 46.6753, serviceLevel: 98.5, waste: 1.2, mape: 4.8, alerts: 0, status: "good" },
  { id: 2, name: "Jeddah DC", type: "DC", lat: 21.4858, lng: 39.1925, serviceLevel: 97.2, waste: 2.1, mape: 5.2, alerts: 1, status: "good" },
  { id: 3, name: "Dammam DC", type: "DC", lat: 26.4207, lng: 50.0888, serviceLevel: 95.8, waste: 3.5, mape: 6.1, alerts: 2, status: "warning" },
  { id: 4, name: "Makkah Store #1", type: "Store", lat: 21.3891, lng: 39.8579, serviceLevel: 96.5, waste: 2.8, mape: 5.5, alerts: 0, status: "good" },
  { id: 5, name: "Madinah Store #2", type: "Store", lat: 24.5247, lng: 39.5692, serviceLevel: 94.2, waste: 4.2, mape: 7.2, alerts: 3, status: "warning" },
  { id: 6, name: "Khobar Store #3", type: "Store", lat: 26.2172, lng: 50.1971, serviceLevel: 91.5, waste: 5.8, mape: 8.5, alerts: 5, status: "danger" },
  { id: 7, name: "Tabuk Store #4", type: "Store", lat: 28.3998, lng: 36.5550, serviceLevel: 97.8, waste: 1.5, mape: 4.2, alerts: 0, status: "good" },
  { id: 8, name: "Abha DC", type: "DC", lat: 18.2164, lng: 42.5053, serviceLevel: 96.9, waste: 2.3, mape: 5.0, alerts: 1, status: "good" },
];

import { chartColors } from "./colors";

export const funnelData = [
  { step: "Produced", units: 125000, color: chartColors.steelBlue },
  { step: "Sent to DCs", units: 118500, color: chartColors.steelBlue },
  { step: "Delivered to Stores", units: 112000, color: chartColors.steelBlue },
  { step: "Sold", units: 105800, color: chartColors.steelBlue },
  { step: "Wasted", units: 6200, color: chartColors.steelBlue },
];

export const hourlyDemandData = Array.from({ length: 48 }, (_, i) => {
  const hour = i % 24;
  const day = i < 24 ? "Yesterday" : "Today";
  const baseValue = 800 + Math.sin((hour - 6) * Math.PI / 12) * 400;
  const actual = Math.max(0, baseValue + (Math.random() - 0.5) * 200);
  const forecast = baseValue + (Math.random() - 0.5) * 100;
  return {
    time: `${day} ${hour.toString().padStart(2, "0")}:00`,
    hour,
    actual: Math.round(actual),
    forecast: Math.round(forecast),
  };
});

export const heatmapData = [
  { cluster: "Urban High", hours: [0.2, 0.1, 0.1, 0.1, 0.2, 0.5, 0.8, 1.2, 1.0, 0.9, 0.8, 1.1, 1.3, 1.1, 0.9, 1.0, 1.2, 1.5, 1.3, 1.1, 0.8, 0.5, 0.3, 0.2] },
  { cluster: "Urban Mid", hours: [0.1, 0.1, 0.1, 0.1, 0.2, 0.4, 0.6, 0.9, 0.8, 0.7, 0.6, 0.8, 1.0, 0.9, 0.7, 0.8, 1.0, 1.2, 1.0, 0.8, 0.6, 0.4, 0.2, 0.1] },
  { cluster: "Suburban", hours: [0.1, 0.1, 0.1, 0.1, 0.1, 0.3, 0.5, 0.7, 0.6, 0.5, 0.5, 0.6, 0.7, 0.6, 0.5, 0.6, 0.8, 0.9, 0.8, 0.6, 0.4, 0.3, 0.2, 0.1] },
  { cluster: "Highway", hours: [0.2, 0.2, 0.2, 0.3, 0.4, 0.6, 0.7, 0.8, 0.6, 0.5, 0.4, 0.5, 0.6, 0.5, 0.4, 0.5, 0.7, 0.8, 0.7, 0.5, 0.4, 0.3, 0.3, 0.2] },
];

// Factory data
export const factoryKPIs = {
  lineUtilization: 87.5,
  productionAdherence: 94.2,
  defectRate: 0.8,
  wasteUnits: 1250,
  wasteSAR: 18750,
};

export const productionData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i.toString().padStart(2, "0")}:00`,
  planned: 5000 + Math.sin(i * Math.PI / 12) * 1000,
  actual: 4800 + Math.sin(i * Math.PI / 12) * 1000 + (Math.random() - 0.5) * 500,
  demand: 4500 + Math.sin((i - 2) * Math.PI / 12) * 800,
}));

export const dispatchPlan = [
  { sku: "SKU-001", name: "White Bread Loaf", forecastDemand: 2500, recommendedProd: 2650, capacityImpact: 12, wasteRisk: "Low" },
  { sku: "SKU-002", name: "Whole Wheat Bread", forecastDemand: 1800, recommendedProd: 1900, capacityImpact: 8, wasteRisk: "Low" },
  { sku: "SKU-003", name: "Croissant Plain", forecastDemand: 3200, recommendedProd: 3100, capacityImpact: 15, wasteRisk: "Medium" },
  { sku: "SKU-004", name: "Baguette", forecastDemand: 1200, recommendedProd: 1250, capacityImpact: 5, wasteRisk: "Low" },
  { sku: "SKU-005", name: "Danish Pastry", forecastDemand: 2100, recommendedProd: 2000, capacityImpact: 10, wasteRisk: "High" },
];

// DC data
export const dcKPIs = {
  serviceLevel: 97.2,
  wastePercent: 2.1,
  avgShelfLife: 4.2,
  backorders: 145,
};

export const inventoryAgeData = [
  { bucket: "0-1 days", units: 12500, color: chartColors.mediumGreen },
  { bucket: "2-3 days", units: 8200, color: chartColors.cyanBlue },
  { bucket: "4-5 days", units: 4500, color: chartColors.orange },
  { bucket: "6-7 days", units: 1800, color: chartColors.saddleBrown },
  { bucket: "7+ days", units: 450, color: chartColors.crimsonRed },
];

export const dcSkuCover = [
  { dc: "Jeddah DC", skus: [{ sku: "SKU-001", cover: 5.2, target: 4 }, { sku: "SKU-002", cover: 3.1, target: 4 }, { sku: "SKU-003", cover: 6.5, target: 5 }] },
  { dc: "Dammam DC", skus: [{ sku: "SKU-001", cover: 3.8, target: 4 }, { sku: "SKU-002", cover: 4.2, target: 4 }, { sku: "SKU-003", cover: 2.1, target: 5 }] },
  { dc: "Abha DC", skus: [{ sku: "SKU-001", cover: 4.5, target: 4 }, { sku: "SKU-002", cover: 3.9, target: 4 }, { sku: "SKU-003", cover: 5.8, target: 5 }] },
];

export const replenishmentRecs = [
  { store: "Makkah Store #1", sku: "SKU-002", onHand: 45, recommended: 120, reason: "Low cover - 0.8 days" },
  { store: "Madinah Store #2", sku: "SKU-003", onHand: 180, recommended: 280, reason: "Promo starting tomorrow" },
  { store: "Khobar Store #3", sku: "SKU-001", onHand: 25, recommended: 150, reason: "Stockout risk - high demand" },
  { store: "Tabuk Store #4", sku: "SKU-005", onHand: 90, recommended: 60, reason: "Reduce - high expiry risk" },
];

// Store data
export const storeKPIs = {
  onShelfAvailability: 96.5,
  stockoutIncidents: 12,
  wasteUnits: 320,
  wasteSAR: 4800,
  promoUplift: 18.5,
};

export const storeHourlySales = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i.toString().padStart(2, "0")}:00`,
  sales: Math.max(0, 150 + Math.sin((i - 6) * Math.PI / 12) * 100 + (Math.random() - 0.5) * 50),
  forecast: 150 + Math.sin((i - 6) * Math.PI / 12) * 100,
}));

export const stockoutTimeline = [
  { hour: 8, sku: "SKU-001", duration: 25 },
  { hour: 12, sku: "SKU-003", duration: 45 },
  { hour: 17, sku: "SKU-002", duration: 30 },
];

export const shelfPerformance = [
  { sku: "SKU-001", name: "White Bread Loaf", planogramCap: 50, onShelf: 42, shelfFill: 84, salesPerHour: 8.5, wasteLast7: 12 },
  { sku: "SKU-002", name: "Whole Wheat Bread", planogramCap: 40, onShelf: 38, shelfFill: 95, salesPerHour: 5.2, wasteLast7: 8 },
  { sku: "SKU-003", name: "Croissant Plain", planogramCap: 60, onShelf: 25, shelfFill: 42, salesPerHour: 12.3, wasteLast7: 22 },
  { sku: "SKU-004", name: "Baguette", planogramCap: 30, onShelf: 28, shelfFill: 93, salesPerHour: 3.8, wasteLast7: 5 },
  { sku: "SKU-005", name: "Danish Pastry", planogramCap: 45, onShelf: 40, shelfFill: 89, salesPerHour: 6.1, wasteLast7: 18 },
];

export const storeActions = [
  { action: "Increase facing of SKU-003 from 3 to 4", reason: "High sell-through rate (12.3/hr)", priority: "High" },
  { action: "Reduce order of SKU-005 by 15%", reason: "High waste risk - 18 units wasted last 7 days", priority: "Medium" },
  { action: "Move SKU-001 to eye-level shelf", reason: "Premium product with 8.5 sales/hr", priority: "Low" },
];
