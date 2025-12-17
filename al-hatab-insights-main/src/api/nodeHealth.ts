// API client for Node Health Summary
import { API_BASE_URL } from "@/components/floating-bot/api";

export interface NodeHealth {
  node_id: string;
  name: string;
  type: "Factory" | "DC" | "Store";
  service_level: number;
  waste_pct: number;
  mape: number;
  alerts: number;
  status: "good" | "warning" | "danger";
}

export const fetchNodeHealth = async (): Promise<NodeHealth[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/node-health`, {
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
    console.error("Error calling Node Health API:", error);
    throw error;
  }
};

