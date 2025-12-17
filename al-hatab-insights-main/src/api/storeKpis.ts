import { API_BASE_URL } from "@/components/floating-bot/api";

export interface StoreKpisResponse {
  storeId: string;
  onShelfAvailability: number;
  stockoutIncidents: number;
  wasteUnits: number;
  wasteSAR: number;
}

export const fetchStoreKpis = async (
  storeId: string,
): Promise<StoreKpisResponse> => {
  const params = new URLSearchParams({ store_id: storeId });
  const response = await fetch(`${API_BASE_URL}/store-kpis?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch store KPIs: ${response.statusText}`);
  }

  return response.json();
};


