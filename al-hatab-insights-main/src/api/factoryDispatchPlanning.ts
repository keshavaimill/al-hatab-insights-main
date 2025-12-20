// API client for Factory Dispatch Planning
import { API_BASE_URL } from "@/components/floating-bot/api";

export interface DispatchPlanningItem {
  sku: string;
  name: string;
  forecastDemand: number;
  recommendedProd: number;
  capacityImpact: number;
  wasteRisk: "Low" | "Medium" | "High";
}

export const fetchFactoryDispatchPlanning = async (
  factoryId?: string,
  lineId?: string
): Promise<DispatchPlanningItem[]> => {
  try {
    const params = new URLSearchParams();
    if (factoryId) params.append("factory_id", factoryId);
    if (lineId) params.append("line_id", lineId);

    const response = await fetch(`${API_BASE_URL}/factory-dispatch-planning?${params.toString()}`, {
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
    console.error("Error calling Factory Dispatch Planning API:", error);
    throw error;
  }
};
