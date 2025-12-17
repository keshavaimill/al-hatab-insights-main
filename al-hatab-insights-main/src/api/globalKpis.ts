// API client for Global Command Center KPIs
import { API_BASE_URL } from "@/components/floating-bot/api";

export interface GlobalKpisResponse {
  forecast_accuracy: number;
  waste_cost: number;
  service_level: number;
  on_shelf_availability: number;
  net_margin: number;
  ai_uplift: number;
  revenue: number;
}

export const fetchGlobalKpis = async (): Promise<GlobalKpisResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/global-kpis`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error calling Global KPIs API:", error);
    throw error;
  }
};

