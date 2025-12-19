import { API_BASE_URL } from "@/components/floating-bot/api";

export interface InventoryAgeBucket {
  bucket: string;
  units: number;
  color: string;
}

export const fetchDcInventoryAge = async (
  dcId?: string,
): Promise<InventoryAgeBucket[]> => {
  const params = new URLSearchParams();
  if (dcId) {
    params.append("dc_id", dcId);
  }
  const response = await fetch(`${API_BASE_URL}/dc-inventory-age?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch inventory age distribution: ${response.statusText}`);
  }

  return response.json();
};
