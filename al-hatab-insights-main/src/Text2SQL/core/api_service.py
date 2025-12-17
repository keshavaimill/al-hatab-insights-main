"""
API Service Layer

This module provides clean, business-logic-free API methods that read from
the global intermediate dataframe layer.

All business logic is centralized in the data layer, making this layer
purely presentational.
"""

from typing import Dict, Optional, List
import pandas as pd
from core.data_layer import global_data_layer


class FactoryKPIService:
    """Service for factory KPI endpoints."""
    
    @staticmethod
    def get_factory_kpis(factory_id: Optional[str] = None, line_id: Optional[str] = None) -> Dict:
        """
        Get factory KPIs from the intermediate dataframe.
        
        Returns:
            {
                "lineUtilization": float,
                "productionAdherence": float,
                "defectRate": float,
                "wasteUnits": int,
                "wasteSAR": float
            }
        """
        df = global_data_layer.get_factory_kpis(factory_id=factory_id, line_id=line_id)
        
        if df.empty:
            return {
                "lineUtilization": 0.0,
                "productionAdherence": 0.0,
                "defectRate": 0.0,
                "wasteUnits": 0,
                "wasteSAR": 0.0,
            }
        
        # Aggregate if multiple rows (shouldn't happen with proper filtering, but safe)
        result = {
            "lineUtilization": round(float(df["line_utilization_pct"].mean()), 1),
            "productionAdherence": round(float(df["production_adherence_pct"].mean()), 1),
            "defectRate": round(float(df["defect_rate_pct"].mean()), 2),
            "wasteUnits": int(df["waste_units"].sum()),
            "wasteSAR": round(float(df["waste_sar"].sum()), 2),
        }
        
        return result


class DCKPIService:
    """Service for DC KPI endpoints."""
    
    @staticmethod
    def get_dc_kpis(dc_id: Optional[str] = None) -> Dict:
        """
        Get DC KPIs from the intermediate dataframe.
        
        Returns:
            {
                "dcId": str,
                "serviceLevelPct": float,
                "wastePercent": float,
                "avgShelfLifeDays": float,
                "backorders": int
            }
        """
        df = global_data_layer.get_dc_kpis(dc_id=dc_id)
        
        if df.empty:
            return {
                "dcId": dc_id or "UNKNOWN",
                "serviceLevelPct": 0.0,
                "wastePercent": 0.0,
                "avgShelfLifeDays": 4.0,  # Placeholder
                "backorders": 0,
            }
        
        result = {
            "dcId": dc_id or df["dc_id"].iloc[0],
            "serviceLevelPct": round(float(df["service_level_pct"].mean()), 1),
            "wastePercent": round(float(df["waste_pct"].mean()), 1),
            "avgShelfLifeDays": 4.0,  # Placeholder - not in current data
            "backorders": int(df["backorder_units"].sum()),
        }
        
        return result
    
    @staticmethod
    def get_dc_days_cover(dc_id: Optional[str] = None, sku_id: Optional[str] = None) -> List[Dict]:
        """
        Get days of cover for DC-SKU combinations.
        
        Returns:
            [
                {
                    "dcId": str,
                    "skuId": str,
                    "daysCover": float
                },
                ...
            ]
        """
        df = global_data_layer.get_dc_kpis(dc_id=dc_id, sku_id=sku_id)
        
        if df.empty or "days_cover" not in df.columns:
            return []
        
        # Filter to SKU-level aggregation for days_cover
        if "sku_id" in df.columns:
            sku_df = df[df["kpi_level"].isin(["dc_sku", "dc_sku_date_hour"])].copy()
            if not sku_df.empty:
                df = sku_df
        
        results = []
        for _, row in df.iterrows():
            if pd.notna(row.get("days_cover")):
                results.append({
                    "dcId": row.get("dc_id", "UNKNOWN"),
                    "skuId": row.get("sku_id", "UNKNOWN"),
                    "daysCover": float(row["days_cover"]) if row["days_cover"] is not None else None,
                })
        
        return results


class StoreKPIService:
    """Service for store KPI endpoints."""
    
    @staticmethod
    def get_store_kpis(store_id: Optional[str] = None) -> Dict:
        """
        Get store KPIs from the intermediate dataframe.
        
        Returns:
            {
                "storeId": str,
                "onShelfAvailability": float,
                "stockoutIncidents": int,
                "wasteUnits": int,
                "wasteSAR": float
            }
        """
        df = global_data_layer.get_store_kpis(store_id=store_id)
        
        if df.empty:
            return {
                "storeId": store_id or "UNKNOWN",
                "onShelfAvailability": 0.0,
                "stockoutIncidents": 0,
                "wasteUnits": 0,
                "wasteSAR": 0.0,
            }
        
        result = {
            "storeId": store_id or df["store_id"].iloc[0],
            "onShelfAvailability": round(float(df["on_shelf_availability_pct"].mean()), 1),
            "stockoutIncidents": int(df["stockout_incidents"].sum()),
            "wasteUnits": int(df["waste_units"].sum()),
            "wasteSAR": round(float(df["waste_sar"].sum()), 2),
        }
        
        return result


class NodeHealthService:
    """Service for node health summary endpoints."""
    
    @staticmethod
    def get_node_health() -> List[Dict]:
        """
        Get node health summary for all nodes (Factory, DC, Store).
        
        Returns:
            [
                {
                    "node_id": str,
                    "name": str,
                    "type": "Factory" | "DC" | "Store",
                    "service_level": float,
                    "waste_pct": float,
                    "mape": float,
                    "alerts": int,
                    "status": "good" | "warning" | "danger"
                },
                ...
            ]
        """
        df = global_data_layer.get_node_health()
        
        if df.empty:
            return []
        
        results = []
        for _, row in df.iterrows():
            results.append({
                "node_id": str(row["node_id"]),
                "name": str(row["name"]),
                "type": str(row["type"]),
                "service_level": float(row["service_level"]),
                "waste_pct": float(row["waste_pct"]),
                "mape": float(row["mape"]),
                "alerts": int(row["alerts"]),
                "status": str(row["status"]),
            })
        
        return results


class GlobalCommandCenterService:
    """Service for global Command Center KPI endpoints."""
    
    @staticmethod
    def get_global_kpis() -> Dict:
        """
        Get global Command Center KPIs aggregated across Factory, DC, and Store.
        
        Returns:
            {
                "forecast_accuracy": float,
                "waste_cost": float,
                "service_level": float,
                "on_shelf_availability": float,
                "net_margin": float,
                "ai_uplift": float,
                "revenue": float
            }
        """
        return global_data_layer.get_global_command_center_kpis()

