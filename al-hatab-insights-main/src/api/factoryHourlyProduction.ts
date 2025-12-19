import { API_BASE_URL } from "@/components/floating-bot/api";

export interface HourlyProductionData {
  hour: string;
  actual: number;
  demand: number;
}

export const fetchFactoryHourlyProduction = async (
  factoryId?: string,
  lineId?: string,
): Promise<HourlyProductionData[]> => {
  const params = new URLSearchParams();
  if (factoryId) {
    params.append("factory_id", factoryId);
  }
  if (lineId) {
    params.append("line_id", lineId);
  }
  const response = await fetch(`${API_BASE_URL}/factory-hourly-production?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch hourly production: ${response.statusText}`);
  }

  return response.json();
};
