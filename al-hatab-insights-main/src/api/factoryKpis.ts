import { API_BASE_URL } from "@/components/floating-bot/api";

export interface FactoryKpisResponse {
  lineUtilization: number;
  productionAdherence: number;
  defectRate: number;
  wasteUnits: number;
  wasteSAR: number;
}

export interface FactoryKpisParams {
  factoryId?: string;
  lineId?: string;
}

export const fetchFactoryKpis = async (
  params?: FactoryKpisParams,
): Promise<FactoryKpisResponse> => {
  const searchParams = new URLSearchParams();
  if (params?.factoryId) searchParams.set("factory_id", params.factoryId);
  if (params?.lineId) searchParams.set("line_id", params.lineId);

  const queryString = searchParams.toString();
  const url =
    queryString.length > 0
      ? `${API_BASE_URL}/factory-kpis?${queryString}`
      : `${API_BASE_URL}/factory-kpis`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch factory KPIs: ${response.statusText}`);
  }

  return response.json();
};


