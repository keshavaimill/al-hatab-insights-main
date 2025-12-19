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
    
    @staticmethod
    def get_dc_inventory_age_distribution(dc_id: Optional[str] = None) -> List[Dict]:
        """
        Get inventory age distribution for a specific DC.
        
        Returns:
            List of dictionaries with:
            {
                "bucket": str,  # e.g., "0-1 days", "2-3 days", etc.
                "units": int,
                "color": str  # Color code for visualization
            }
        """
        # Get raw dataframes for calculation
        raw_dfs = global_data_layer._raw_dataframes if hasattr(global_data_layer, '_raw_dataframes') else {}
        
        if "dc_forecasts" not in raw_dfs:
            return []
        
        dc_raw = raw_dfs["dc_forecasts"]
        if dc_raw.empty:
            return []
        
        # Filter by DC if specified
        if dc_id:
            dc_raw = dc_raw[dc_raw["dc_id"] == dc_id]
        
        if dc_raw.empty:
            return []
        
        # Filter to forecast_hour_offset = 1 (current snapshot)
        if "forecast_hour_offset" in dc_raw.columns:
            dc_raw = dc_raw[dc_raw["forecast_hour_offset"] == 1]
        
        # Calculate age buckets from available data
        # We have: opening_stock_units, expiring_within_24h_units
        total_stock = int(dc_raw["opening_stock_units"].clip(lower=0).sum())
        expiring_24h = int(dc_raw["expiring_within_24h_units"].clip(lower=0).sum()) if "expiring_within_24h_units" in dc_raw.columns else 0
        
        # Distribute inventory across age buckets
        # 0-1 days: expiring_within_24h_units
        bucket_0_1 = int(expiring_24h)
        
        # Estimate other buckets based on proportions
        # Assume a typical distribution pattern if we don't have exact age data
        remaining_stock = max(0, total_stock - bucket_0_1)
        
        # Distribute remaining stock across age buckets (typical distribution)
        # 2-3 days: ~40% of remaining
        bucket_2_3 = int(remaining_stock * 0.40)
        
        # 4-5 days: ~25% of remaining
        bucket_4_5 = int(remaining_stock * 0.25)
        
        # 6-7 days: ~20% of remaining
        bucket_6_7 = int(remaining_stock * 0.20)
        
        # 7+ days: ~15% of remaining
        bucket_7_plus = int(remaining_stock * 0.15)
        
        # Ensure totals match (adjust for rounding)
        total_distributed = bucket_0_1 + bucket_2_3 + bucket_4_5 + bucket_6_7 + bucket_7_plus
        if total_distributed < total_stock:
            bucket_2_3 += int(total_stock - total_distributed)
        
        # Aggregate into 3 categories matching the summary section:
        # 1. Fresh Stock (0-3 days) = 0-1 days + 2-3 days
        fresh_stock = bucket_0_1 + bucket_2_3
        
        # 2. At Risk (4-5 days) = 4-5 days
        at_risk = bucket_4_5
        
        # 3. Near Expiry (6+ days) = 6-7 days + 7+ days
        near_expiry = bucket_6_7 + bucket_7_plus
        
        # Color mapping (matching frontend summary colors)
        colors = {
            "Fresh Stock (0-3 days)": "#2CA02C",  # mediumGreen (success)
            "At Risk (4-5 days)": "#FF7F0E",        # orange (warning)
            "Near Expiry (6+ days)": "#D62728",    # crimsonRed (destructive)
        }
        
        results = [
            {"bucket": "Fresh Stock (0-3 days)", "units": int(fresh_stock), "color": colors["Fresh Stock (0-3 days)"]},
            {"bucket": "At Risk (4-5 days)", "units": int(at_risk), "color": colors["At Risk (4-5 days)"]},
            {"bucket": "Near Expiry (6+ days)", "units": int(near_expiry), "color": colors["Near Expiry (6+ days)"]},
        ]
        
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
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"No store KPI data found for store_id: {store_id}")
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
    
    @staticmethod
    def get_store_shelf_performance(store_id: Optional[str] = None) -> List[Dict]:
        """
        Get shelf performance data for a specific store (SKU-level).
        
        Returns:
            List of dictionaries with:
            {
                "sku": str,
                "name": str,  # Will be derived from SKU ID
                "planogramCap": int,
                "onShelf": int,
                "shelfFill": float,  # Percentage
                "salesPerHour": float,
                "wasteLast7": float  # Waste percentage over 7 days
            }
        """
        # Get store-SKU level KPIs - we need store_sku level data
        # Get the full dataframe and filter manually to get store_sku level
        full_df = global_data_layer.get_dataframe()
        
        if full_df.empty:
            return []
        
        # Filter to store_sku level for the specific store
        store_cols = ["store_id", "sku_id", "on_shelf_availability_pct", "stockout_incidents", 
                     "waste_units", "waste_sar", "on_shelf_units", "planogram_capacity_units", "kpi_level"]
        available_cols = [col for col in store_cols if col in full_df.columns]
        
        if not available_cols:
            return []
        
        sku_df = full_df[available_cols].copy()
        sku_df = sku_df.dropna(subset=["store_id"])
        
        # Filter by store_id and store_sku level
        if store_id:
            sku_df = sku_df[
                (sku_df["store_id"] == store_id) & 
                (sku_df["kpi_level"] == "store_sku")
            ]
        
        if sku_df.empty:
            return []
        
        # Get raw data for additional calculations (sales/hour, waste over 7 days)
        # Access raw dataframes from global_data_layer
        raw_dfs = global_data_layer._raw_dataframes if hasattr(global_data_layer, '_raw_dataframes') else {}
        
        results = []
        for _, row in sku_df.iterrows():
            sku_id = str(row["sku_id"])
            planogram_cap = int(row.get("planogram_capacity_units", 0)) if "planogram_capacity_units" in row.index and pd.notna(row.get("planogram_capacity_units")) else 0
            on_shelf = int(row.get("on_shelf_units", 0)) if "on_shelf_units" in row.index and pd.notna(row.get("on_shelf_units")) else 0
            shelf_fill = float(row.get("on_shelf_availability_pct", 0.0)) if pd.notna(row.get("on_shelf_availability_pct")) else 0.0
            waste_units = int(row.get("waste_units", 0)) if "waste_units" in row.index and pd.notna(row.get("waste_units")) else 0
            
            # Calculate sales per hour from predicted_demand (average hourly demand)
            sales_per_hour = 0.0
            waste_last_7 = 0.0
            
            if "store_forecasts" in raw_dfs and store_id:
                store_raw = raw_dfs["store_forecasts"]
                if not store_raw.empty:
                    sku_data = store_raw[
                        (store_raw["store_id"] == store_id) & 
                        (store_raw["sku_id"] == sku_id)
                    ]
                    
                    # Filter to forecast_hour_offset = 1 if column exists
                    if "forecast_hour_offset" in sku_data.columns:
                        sku_data = sku_data[sku_data["forecast_hour_offset"] == 1]
                    
                    if not sku_data.empty and "predicted_demand" in sku_data.columns:
                        # Sales per hour = average predicted_demand
                        sales_per_hour = float(sku_data["predicted_demand"].mean())
                        
                        # Waste (7d) = waste_units / predicted_demand * 100 (for last 7 days)
                        # Filter to last 7 days if timestamp available
                        if "timestamp" in sku_data.columns:
                            sku_data["timestamp"] = pd.to_datetime(sku_data["timestamp"])
                            seven_days_ago = sku_data["timestamp"].max() - pd.Timedelta(days=7)
                            sku_data_7d = sku_data[sku_data["timestamp"] >= seven_days_ago]
                        else:
                            sku_data_7d = sku_data
                        
                        if not sku_data_7d.empty:
                            if "waste_units" in sku_data_7d.columns:
                                total_waste = sku_data_7d["waste_units"].sum()
                                total_demand = sku_data_7d["predicted_demand"].sum()
                                if total_demand > 0:
                                    waste_last_7 = (total_waste / total_demand) * 100
            
            # Derive product name from SKU ID (format: SKU_101 -> "Product SKU_101")
            product_name = sku_id.replace("_", " ").replace("SKU", "Product").title()
            
            results.append({
                "sku": sku_id,
                "name": product_name,
                "planogramCap": planogram_cap,
                "onShelf": on_shelf,
                "shelfFill": round(shelf_fill, 1),
                "salesPerHour": round(sales_per_hour, 1),
                "wasteLast7": round(waste_last_7, 1),
            })
        
        # Sort by SKU for consistent ordering
        results.sort(key=lambda x: x["sku"])
        
        return results


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

