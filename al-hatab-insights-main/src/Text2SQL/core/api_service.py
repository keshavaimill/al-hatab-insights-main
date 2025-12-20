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
    
    @staticmethod
    def get_factory_hourly_production(factory_id: Optional[str] = None, line_id: Optional[str] = None) -> List[Dict]:
        """
        Get hourly production data (actual and demand) for a factory/line.
        
        Returns:
            List of dictionaries with:
            {
                "hour": str,  # e.g., "00:00", "01:00", etc.
                "actual": int,  # Actual production quantity
                "demand": int   # Predicted demand
            }
        """
        # Get raw dataframes for calculation
        raw_dfs = global_data_layer._raw_dataframes if hasattr(global_data_layer, '_raw_dataframes') else {}
        
        if "factory_predictions" not in raw_dfs:
            return []
        
        factory_raw = raw_dfs["factory_predictions"]
        if factory_raw.empty:
            return []
        
        # Filter by factory_id if specified
        if factory_id:
            factory_raw = factory_raw[factory_raw["factory_id"] == factory_id]
        
        # Filter by line_id if specified
        if line_id:
            factory_raw = factory_raw[factory_raw["line_id"] == line_id]
        
        if factory_raw.empty:
            return []
        
        # Ensure hour column exists
        if "hour" not in factory_raw.columns and "timestamp" in factory_raw.columns:
            factory_raw["timestamp"] = pd.to_datetime(factory_raw["timestamp"])
            factory_raw["hour"] = factory_raw["timestamp"].dt.hour
        
        if "hour" not in factory_raw.columns:
            return []
        
        # Group by hour and aggregate
        hourly_data = factory_raw.groupby("hour").agg({
            "prod_actual_qty": "sum",
            "y_pred": "sum",  # Predicted demand (y_pred is the ML model prediction)
        }).reset_index()
        
        # If y_pred is not available, use dc_demand_24h as fallback
        if "y_pred" not in factory_raw.columns or hourly_data["y_pred"].sum() == 0:
            if "dc_demand_24h" in factory_raw.columns:
                hourly_data = factory_raw.groupby("hour").agg({
                    "prod_actual_qty": "sum",
                    "dc_demand_24h": "sum",
                }).reset_index()
                hourly_data["demand"] = hourly_data["dc_demand_24h"]
            else:
                hourly_data["demand"] = 0
        else:
            hourly_data["demand"] = hourly_data["y_pred"]
        
        results = []
        for _, row in hourly_data.iterrows():
            hour = int(row["hour"])
            hour_str = f"{hour:02d}:00"
            actual = int(row["prod_actual_qty"]) if pd.notna(row["prod_actual_qty"]) else 0
            demand = int(row["demand"]) if pd.notna(row["demand"]) else 0
            
            results.append({
                "hour": hour_str,
                "actual": actual,
                "demand": demand,
            })
        
        # Sort by hour
        results.sort(key=lambda x: int(x["hour"].split(":")[0]))
        
        # Ensure all 24 hours are present (fill missing hours with 0)
        all_hours = [f"{h:02d}:00" for h in range(24)]
        existing_hours = {r["hour"] for r in results}
        for hour in all_hours:
            if hour not in existing_hours:
                results.append({"hour": hour, "actual": 0, "demand": 0})
        
        results.sort(key=lambda x: int(x["hour"].split(":")[0]))
        
        return results
    
    @staticmethod
    def get_factory_dispatch_planning(factory_id: Optional[str] = None, line_id: Optional[str] = None) -> List[Dict]:
        """
        Get dispatch planning data (SKU-level production recommendations).
        
        Returns:
            List of dictionaries with:
            {
                "sku": str,  # SKU identifier
                "name": str,  # Product name
                "forecastDemand": int,  # Forecasted DC demand
                "recommendedProd": int,  # Recommended production quantity
                "capacityImpact": float,  # Capacity impact percentage
                "wasteRisk": str  # Waste risk level: "Low", "Medium", "High"
            }
        """
        # Get raw dataframes for calculation
        raw_dfs = global_data_layer._raw_dataframes if hasattr(global_data_layer, '_raw_dataframes') else {}
        
        if "factory_predictions" not in raw_dfs:
            return []
        
        factory_raw = raw_dfs["factory_predictions"]
        if factory_raw.empty:
            return []
        
        # Filter by factory_id if specified
        if factory_id:
            factory_raw = factory_raw[factory_raw["factory_id"] == factory_id]
        
        # Filter by line_id if specified
        if line_id:
            factory_raw = factory_raw[factory_raw["line_id"] == line_id]
        
        if factory_raw.empty:
            return []
        
        # Get DC forecasts for demand data
        dc_demand_data = {}
        if "dc_forecasts" in raw_dfs:
            dc_raw = raw_dfs["dc_forecasts"]
            if not dc_raw.empty and "sku_id" in dc_raw.columns:
                # Aggregate DC demand by SKU (sum across all DCs)
                if "dc_demand_24h" in dc_raw.columns:
                    dc_demand_by_sku = dc_raw.groupby("sku_id")["dc_demand_24h"].sum().to_dict()
                    dc_demand_data = dc_demand_by_sku
                elif "predicted_demand" in dc_raw.columns:
                    dc_demand_by_sku = dc_raw.groupby("sku_id")["predicted_demand"].sum().to_dict()
                    dc_demand_data = dc_demand_by_sku
        
        # Group by SKU and calculate metrics
        sku_metrics = factory_raw.groupby("sku_id").agg({
            "prod_plan_qty": "sum",  # Planned production
            "prod_actual_qty": "sum",  # Actual production
            "scrap_qty": "sum",  # Waste/scrap
            "batch_size_units": "sum",  # Total capacity
        }).reset_index()
        
        results = []
        for _, row in sku_metrics.iterrows():
            sku_id = str(row["sku_id"])
            
            # Get forecasted DC demand (from DC forecasts or use planned production as proxy)
            forecast_demand = int(dc_demand_data.get(sku_id, row["prod_plan_qty"])) if dc_demand_data else int(row["prod_plan_qty"])
            
            # Recommended production = forecasted demand + 5% buffer (minimum)
            recommended_prod = int(forecast_demand * 1.05)
            
            # Capacity impact = (recommended production / total capacity) * 100
            total_capacity = float(row["batch_size_units"]) if pd.notna(row["batch_size_units"]) else 1.0
            if total_capacity > 0:
                capacity_impact = round((recommended_prod / total_capacity) * 100, 1)
            else:
                capacity_impact = 0.0
            
            # Waste risk calculation based on historical waste rate
            total_production = float(row["prod_actual_qty"]) if pd.notna(row["prod_actual_qty"]) else 0.0
            total_waste = float(row["scrap_qty"]) if pd.notna(row["scrap_qty"]) else 0.0
            
            if total_production > 0:
                waste_rate = (total_waste / total_production) * 100
            else:
                waste_rate = 0.0
            
            # Determine waste risk level
            if waste_rate <= 2.0:
                waste_risk = "Low"
            elif waste_rate <= 5.0:
                waste_risk = "Medium"
            else:
                waste_risk = "High"
            
            # Derive product name from SKU ID
            product_name = f"Product {sku_id.replace('_', ' ')}"
            # Format SKU for display (SKU_101 -> SKU-001)
            sku_display = sku_id.replace("_", "-").upper()
            
            results.append({
                "sku": sku_display,
                "name": product_name,
                "forecastDemand": int(forecast_demand),
                "recommendedProd": int(recommended_prod),
                "capacityImpact": float(round(capacity_impact, 1)),
                "wasteRisk": waste_risk,
            })
        
        # Sort by SKU
        results.sort(key=lambda x: x["sku"])
        
        return results


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

