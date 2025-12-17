import { API_BASE_URL } from "@/components/floating-bot/api";

export interface DcKpisResponse {
  dcId: string;
  serviceLevelPct: number;
  wastePercent: number;
  avgShelfLifeDays: number;
  backorders: number;
}

export const fetchDcKpis = async (dcId: string): Promise<DcKpisResponse> => {
  const params = new URLSearchParams({ dc_id: dcId });
  const response = await fetch(`${API_BASE_URL}/dc-kpis?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch DC KPIs: ${response.statusText}`);
  }

  return response.json();
};


