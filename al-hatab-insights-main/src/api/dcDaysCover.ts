import { API_BASE_URL } from "@/components/floating-bot/api";

export interface DcDaysCoverRow {
  dcId: string;
  skuId: string;
  daysCover: number | null;
}

export const fetchDcDaysCover = async (): Promise<DcDaysCoverRow[]> => {
  const response = await fetch(`${API_BASE_URL}/dc-days-cover`);

  if (!response.ok) {
    throw new Error(`Failed to fetch DC days-of-cover data: ${response.statusText}`);
  }

  return response.json();
};


