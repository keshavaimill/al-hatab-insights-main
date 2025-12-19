import { API_BASE_URL } from "@/components/floating-bot/api";

export interface ShelfPerformanceItem {
  sku: string;
  name: string;
  planogramCap: number;
  onShelf: number;
  shelfFill: number;
  salesPerHour: number;
  wasteLast7: number;
}

export const fetchStoreShelfPerformance = async (
  storeId: string,
): Promise<ShelfPerformanceItem[]> => {
  const params = new URLSearchParams({ store_id: storeId });
  const response = await fetch(`${API_BASE_URL}/store-shelf-performance?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch shelf performance: ${response.statusText}`);
  }

  return response.json();
};
