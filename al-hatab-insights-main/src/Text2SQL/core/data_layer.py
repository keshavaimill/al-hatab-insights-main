"""
Global Intermediate Dataframe Layer

This module provides a centralized data layer that:
1. Loads all CSV files into raw dataframes
2. Validates and cleans data
3. Precomputes all KPIs at multiple aggregation levels
4. Serves as the single source of truth for the entire application

Architecture:
    CSV Files → Raw DataFrames → Data Quality Layer → Intermediate DataFrame → API Layer
"""

import pandas as pd
import numpy as np
import os
import logging
from typing import Dict, Optional, List, Tuple
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DataQualityLayer:
    """Handles data validation, cleaning, and quality checks."""
    
    @staticmethod
    def validate_dataframe(df: pd.DataFrame, name: str) -> Tuple[pd.DataFrame, Dict]:
        """
        Validate and clean a dataframe.
        
        Returns:
            (cleaned_df, quality_report)
        """
        original_rows = len(df)
        quality_report = {
            "name": name,
            "original_rows": original_rows,
            "missing_values": {},
            "invalid_values": {},
            "data_quality_score": 1.0,
        }
        
        df_clean = df.copy()
        
        # Check for missing values
        missing = df_clean.isnull().sum()
        quality_report["missing_values"] = missing[missing > 0].to_dict()
        
        # Handle numeric columns: replace negative values where invalid
        numeric_cols = df_clean.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            # For quantities, stock, demand: negative values are invalid
            if any(keyword in col.lower() for keyword in ['qty', 'units', 'stock', 'demand', 'capacity']):
                invalid_count = (df_clean[col] < 0).sum()
                if invalid_count > 0:
                    quality_report["invalid_values"][col] = int(invalid_count)
                    df_clean[col] = df_clean[col].clip(lower=0)
                    logger.warning(f"{name}: Clipped {invalid_count} negative values in {col}")
        
        # Calculate data quality score (0-1)
        total_cells = len(df_clean) * len(df_clean.columns)
        missing_cells = df_clean.isnull().sum().sum()
        invalid_cells = sum(quality_report["invalid_values"].values())
        quality_report["data_quality_score"] = 1.0 - (missing_cells + invalid_cells) / max(total_cells, 1)
        
        quality_report["final_rows"] = len(df_clean)
        quality_report["rows_dropped"] = original_rows - len(df_clean)
        
        return df_clean, quality_report
    
    @staticmethod
    def safe_divide(numerator: pd.Series, denominator: pd.Series, default: float = 0.0) -> pd.Series:
        """Safe division that handles zero denominators."""
        return numerator.div(denominator.replace(0, np.nan)).fillna(default)


class IntermediateDataFrameBuilder:
    """
    Builds the global intermediate dataframe with precomputed KPIs.
    
    This dataframe acts as the single source of truth and contains:
    - All dimension columns (factory_id, line_id, store_id, dc_id, sku_id, date, hour)
    - All precomputed KPI values
    - KPI metadata (units, thresholds, status)
    - Data quality flags
    """
    
    def __init__(self, base_dir: str):
        self.base_dir = base_dir
        self.raw_dataframes: Dict[str, pd.DataFrame] = {}
        self.intermediate_df: Optional[pd.DataFrame] = None
        self.quality_reports: List[Dict] = []
        
    def load_raw_data(self) -> Dict[str, pd.DataFrame]:
        """Load all CSV files into raw dataframes."""
        datasets_dir = os.path.join(self.base_dir, "datasets")
        
        csv_files = {
            "factory_predictions": "predictions.csv",
            "dc_forecasts": "dc_168h_forecasts.csv",
            "store_forecasts": "store_168h_forecasts.csv",
        }
        
        raw_dfs = {}
        for key, filename in csv_files.items():
            filepath = os.path.join(datasets_dir, filename)
            if os.path.exists(filepath):
                df = pd.read_csv(filepath)
                raw_dfs[key] = df
                logger.info(f"Loaded {filename}: {len(df)} rows, {len(df.columns)} columns")
            else:
                logger.warning(f"File not found: {filepath}")
        
        self.raw_dataframes = raw_dfs
        return raw_dfs
    
    def build_intermediate_dataframe(self) -> pd.DataFrame:
        """
        Build the global intermediate dataframe with all KPIs precomputed.
        
        Structure:
        - Dimension columns: factory_id, line_id, store_id, dc_id, sku_id, date, hour
        - KPI columns: all computed metrics
        - Metadata: units, thresholds, status flags
        """
        if not self.raw_dataframes:
            self.load_raw_data()
        
        # Initialize data quality layer
        quality_layer = DataQualityLayer()
        
        # Process each raw dataframe
        processed_dfs = []
        
        # 1. Factory Predictions → Factory-level KPIs
        if "factory_predictions" in self.raw_dataframes:
            df_factory = self.raw_dataframes["factory_predictions"].copy()
            df_factory, quality_report = quality_layer.validate_dataframe(df_factory, "factory_predictions")
            self.quality_reports.append(quality_report)
            
            # Convert timestamp to datetime
            if "timestamp" in df_factory.columns:
                df_factory["timestamp"] = pd.to_datetime(df_factory["timestamp"])
                df_factory["date"] = df_factory["timestamp"].dt.date
                df_factory["hour"] = df_factory["timestamp"].dt.hour
            
            # Precompute Factory KPIs at multiple aggregation levels
            factory_kpis = self._compute_factory_kpis(df_factory)
            processed_dfs.append(factory_kpis)
        
        # 2. DC Forecasts → DC-level KPIs
        if "dc_forecasts" in self.raw_dataframes:
            df_dc = self.raw_dataframes["dc_forecasts"].copy()
            df_dc, quality_report = quality_layer.validate_dataframe(df_dc, "dc_forecasts")
            self.quality_reports.append(quality_report)
            
            if "timestamp" in df_dc.columns:
                df_dc["timestamp"] = pd.to_datetime(df_dc["timestamp"])
                df_dc["date"] = df_dc["timestamp"].dt.date
                df_dc["hour"] = df_dc["timestamp"].dt.hour
            
            dc_kpis = self._compute_dc_kpis(df_dc)
            processed_dfs.append(dc_kpis)
        
        # 3. Store Forecasts → Store-level KPIs
        if "store_forecasts" in self.raw_dataframes:
            df_store = self.raw_dataframes["store_forecasts"].copy()
            df_store, quality_report = quality_layer.validate_dataframe(df_store, "store_forecasts")
            self.quality_reports.append(quality_report)
            
            if "timestamp" in df_store.columns:
                df_store["timestamp"] = pd.to_datetime(df_store["timestamp"])
                df_store["date"] = df_store["timestamp"].dt.date
                df_store["hour"] = df_store["timestamp"].dt.hour
            
            store_kpis = self._compute_store_kpis(df_store)
            processed_dfs.append(store_kpis)
        
        # Combine all processed dataframes
        if processed_dfs:
            # Use outer join to combine all dimensions
            intermediate_df = processed_dfs[0]
            for df in processed_dfs[1:]:
                # Merge on common dimensions
                common_cols = set(intermediate_df.columns) & set(df.columns)
                if common_cols:
                    intermediate_df = pd.merge(
                        intermediate_df,
                        df,
                        on=list(common_cols),
                        how="outer",
                        suffixes=("", "_dup")
                    )
                else:
                    intermediate_df = pd.concat([intermediate_df, df], axis=1)
            
            self.intermediate_df = intermediate_df
            logger.info(f"Built intermediate dataframe: {len(intermediate_df)} rows, {len(intermediate_df.columns)} columns")
        else:
            self.intermediate_df = pd.DataFrame()
            logger.warning("No dataframes to combine")
        
        return self.intermediate_df
    
    def _compute_factory_kpis(self, df: pd.DataFrame) -> pd.DataFrame:
        """Compute factory-level KPIs at multiple aggregation levels."""
        quality_layer = DataQualityLayer()
        
        # Ensure required columns exist
        required_cols = ["prod_actual_qty", "prod_plan_qty", "defect_qty", "scrap_qty", "batch_size_units"]
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            logger.warning(f"Missing columns in factory data: {missing_cols}")
            return pd.DataFrame()
        
        # Compute KPIs at different aggregation levels
        kpi_dfs = []
        
        # Level 1: By factory, line, date, hour (most granular)
        if "factory_id" in df.columns and "line_id" in df.columns:
            granular = df.groupby(["factory_id", "line_id", "date", "hour"]).agg({
                "prod_actual_qty": "sum",
                "prod_plan_qty": "sum",
                "defect_qty": "sum",
                "scrap_qty": "sum",
                "batch_size_units": "sum",
            }).reset_index()
            
            granular["line_utilization_pct"] = quality_layer.safe_divide(
                granular["prod_actual_qty"],
                granular["batch_size_units"],
                default=0.0
            ) * 100.0
            
            granular["production_adherence_pct"] = quality_layer.safe_divide(
                granular["prod_actual_qty"],
                granular["prod_plan_qty"],
                default=0.0
            ) * 100.0
            
            granular["defect_rate_pct"] = quality_layer.safe_divide(
                granular["defect_qty"],
                granular["prod_actual_qty"],
                default=0.0
            ) * 100.0
            
            granular["waste_units"] = granular["scrap_qty"]
            granular["waste_sar"] = granular["waste_units"] * 10.0  # Nominal cost
            
            # Add metadata
            granular["kpi_level"] = "factory_line_date_hour"
            kpi_dfs.append(granular)
        
        # Level 2: By factory, line, date (daily aggregates)
        if "factory_id" in df.columns and "line_id" in df.columns:
            daily = df.groupby(["factory_id", "line_id", "date"]).agg({
                "prod_actual_qty": "sum",
                "prod_plan_qty": "sum",
                "defect_qty": "sum",
                "scrap_qty": "sum",
                "batch_size_units": "sum",
            }).reset_index()
            
            daily["line_utilization_pct"] = quality_layer.safe_divide(
                daily["prod_actual_qty"],
                daily["batch_size_units"],
                default=0.0
            ) * 100.0
            
            daily["production_adherence_pct"] = quality_layer.safe_divide(
                daily["prod_actual_qty"],
                daily["prod_plan_qty"],
                default=0.0
            ) * 100.0
            
            daily["defect_rate_pct"] = quality_layer.safe_divide(
                daily["defect_qty"],
                daily["prod_actual_qty"],
                default=0.0
            ) * 100.0
            
            daily["waste_units"] = daily["scrap_qty"]
            daily["waste_sar"] = daily["waste_units"] * 10.0
            
            daily["kpi_level"] = "factory_line_date"
            kpi_dfs.append(daily)
        
        # Level 3: By factory, line (line-level aggregates)
        if "factory_id" in df.columns and "line_id" in df.columns:
            line_level = df.groupby(["factory_id", "line_id"]).agg({
                "prod_actual_qty": "sum",
                "prod_plan_qty": "sum",
                "defect_qty": "sum",
                "scrap_qty": "sum",
                "batch_size_units": "sum",
            }).reset_index()
            
            line_level["line_utilization_pct"] = quality_layer.safe_divide(
                line_level["prod_actual_qty"],
                line_level["batch_size_units"],
                default=0.0
            ) * 100.0
            
            line_level["production_adherence_pct"] = quality_layer.safe_divide(
                line_level["prod_actual_qty"],
                line_level["prod_plan_qty"],
                default=0.0
            ) * 100.0
            
            line_level["defect_rate_pct"] = quality_layer.safe_divide(
                line_level["defect_qty"],
                line_level["prod_actual_qty"],
                default=0.0
            ) * 100.0
            
            line_level["waste_units"] = line_level["scrap_qty"]
            line_level["waste_sar"] = line_level["waste_units"] * 10.0
            # Keep prod_actual_qty for node health calculations
            line_level["prod_actual_qty"] = line_level["prod_actual_qty"]
            
            line_level["kpi_level"] = "factory_line"
            kpi_dfs.append(line_level)
        
        # Level 4: By factory (factory-level aggregates)
        if "factory_id" in df.columns:
            factory_level = df.groupby(["factory_id"]).agg({
                "prod_actual_qty": "sum",
                "prod_plan_qty": "sum",
                "defect_qty": "sum",
                "scrap_qty": "sum",
                "batch_size_units": "sum",
            }).reset_index()
            
            factory_level["line_utilization_pct"] = quality_layer.safe_divide(
                factory_level["prod_actual_qty"],
                factory_level["batch_size_units"],
                default=0.0
            ) * 100.0
            
            factory_level["production_adherence_pct"] = quality_layer.safe_divide(
                factory_level["prod_actual_qty"],
                factory_level["prod_plan_qty"],
                default=0.0
            ) * 100.0
            
            factory_level["defect_rate_pct"] = quality_layer.safe_divide(
                factory_level["defect_qty"],
                factory_level["prod_actual_qty"],
                default=0.0
            ) * 100.0
            
            factory_level["waste_units"] = factory_level["scrap_qty"]
            factory_level["waste_sar"] = factory_level["waste_units"] * 10.0
            # Keep prod_actual_qty for node health calculations
            factory_level["prod_actual_qty"] = factory_level["prod_actual_qty"]
            
            factory_level["kpi_level"] = "factory"
            kpi_dfs.append(factory_level)
        
        # Combine all levels
        if kpi_dfs:
            result = pd.concat(kpi_dfs, ignore_index=True)
            return result
        return pd.DataFrame()
    
    def _compute_dc_kpis(self, df: pd.DataFrame) -> pd.DataFrame:
        """Compute DC-level KPIs at multiple aggregation levels."""
        quality_layer = DataQualityLayer()
        
        required_cols = ["opening_stock_units", "predicted_demand"]
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            logger.warning(f"Missing columns in DC data: {missing_cols}")
            return pd.DataFrame()
        
        kpi_dfs = []
        
        # Filter to forecast_hour_offset = 1 (next hour forecast)
        if "forecast_hour_offset" in df.columns:
            df = df[df["forecast_hour_offset"] == 1].copy()
        
        # Level 1: By DC, SKU, date, hour
        if "dc_id" in df.columns and "sku_id" in df.columns:
            granular = df.groupby(["dc_id", "sku_id", "date", "hour"]).agg({
                "opening_stock_units": "sum",
                "predicted_demand": "sum",
            }).reset_index()
            
            # Service Level: min(stock, demand) / demand
            serviced = granular[["opening_stock_units", "predicted_demand"]].min(axis=1)
            granular["service_level_pct"] = quality_layer.safe_divide(
                serviced,
                granular["predicted_demand"],
                default=0.0
            ) * 100.0
            
            # Waste %: excess stock / total stock
            excess = (granular["opening_stock_units"] - granular["predicted_demand"]).clip(lower=0)
            granular["waste_pct"] = quality_layer.safe_divide(
                excess,
                granular["opening_stock_units"],
                default=0.0
            ) * 100.0
            
            # Backorders: demand when stock = 0
            granular["backorder_units"] = granular.apply(
                lambda row: row["predicted_demand"] if row["opening_stock_units"] == 0 else 0,
                axis=1
            )
            
            # Days of Cover
            granular["days_cover"] = quality_layer.safe_divide(
                granular["opening_stock_units"],
                granular["predicted_demand"],
                default=0.0
            )
            
            granular["kpi_level"] = "dc_sku_date_hour"
            kpi_dfs.append(granular)
        
        # Level 2: By DC, SKU (SKU-level aggregates)
        if "dc_id" in df.columns and "sku_id" in df.columns:
            sku_level = df.groupby(["dc_id", "sku_id"]).agg({
                "opening_stock_units": "sum",
                "predicted_demand": "sum",
            }).reset_index()
            
            serviced = sku_level[["opening_stock_units", "predicted_demand"]].min(axis=1)
            sku_level["service_level_pct"] = quality_layer.safe_divide(
                serviced,
                sku_level["predicted_demand"],
                default=0.0
            ) * 100.0
            
            excess = (sku_level["opening_stock_units"] - sku_level["predicted_demand"]).clip(lower=0)
            sku_level["waste_pct"] = quality_layer.safe_divide(
                excess,
                sku_level["opening_stock_units"],
                default=0.0
            ) * 100.0
            
            sku_level["backorder_units"] = sku_level.apply(
                lambda row: row["predicted_demand"] if row["opening_stock_units"] == 0 else 0,
                axis=1
            )
            
            sku_level["days_cover"] = quality_layer.safe_divide(
                sku_level["opening_stock_units"],
                sku_level["predicted_demand"],
                default=0.0
            )
            
            sku_level["kpi_level"] = "dc_sku"
            kpi_dfs.append(sku_level)
        
        # Level 3: By DC (DC-level aggregates)
        if "dc_id" in df.columns:
            dc_level = df.groupby(["dc_id"]).agg({
                "opening_stock_units": "sum",
                "predicted_demand": "sum",
            }).reset_index()
            
            serviced = dc_level[["opening_stock_units", "predicted_demand"]].min(axis=1)
            dc_level["service_level_pct"] = quality_layer.safe_divide(
                serviced,
                dc_level["predicted_demand"],
                default=0.0
            ) * 100.0
            
            excess = (dc_level["opening_stock_units"] - dc_level["predicted_demand"]).clip(lower=0)
            dc_level["waste_pct"] = quality_layer.safe_divide(
                excess,
                dc_level["opening_stock_units"],
                default=0.0
            ) * 100.0
            
            dc_level["backorder_units"] = dc_level.apply(
                lambda row: row["predicted_demand"] if row["opening_stock_units"] == 0 else 0,
                axis=1
            )
            
            dc_level["kpi_level"] = "dc"
            kpi_dfs.append(dc_level)
        
        if kpi_dfs:
            result = pd.concat(kpi_dfs, ignore_index=True)
            return result
        return pd.DataFrame()
    
    def _compute_store_kpis(self, df: pd.DataFrame) -> pd.DataFrame:
        """Compute store-level KPIs at multiple aggregation levels."""
        quality_layer = DataQualityLayer()
        
        required_cols = ["on_shelf_units", "planogram_capacity_units"]
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            logger.warning(f"Missing columns in store data: {missing_cols}")
            return pd.DataFrame()
        
        kpi_dfs = []
        
        # Filter to forecast_hour_offset = 1
        if "forecast_hour_offset" in df.columns:
            df = df[df["forecast_hour_offset"] == 1].copy()
        
        # Clip negative on_shelf_units
        df["on_shelf_units"] = df["on_shelf_units"].clip(lower=0)
        
        # Check if waste_units and waste_cost columns exist in CSV (use them if available)
        use_csv_waste = "waste_units" in df.columns and "waste_cost" in df.columns
        if use_csv_waste:
            logger.info(f"Using waste_units and waste_cost columns from CSV for store KPIs")
        else:
            logger.warning(f"waste_units/waste_cost columns not found in CSV, will calculate waste from on_shelf_units - planogram_capacity_units")
        
        # Level 1: By Store, SKU, date, hour
        if "store_id" in df.columns and "sku_id" in df.columns:
            agg_dict = {
                "on_shelf_units": "sum",
                "planogram_capacity_units": "sum",
            }
            # Include waste columns if they exist in CSV
            if use_csv_waste:
                agg_dict["waste_units"] = "sum"
                agg_dict["waste_cost"] = "sum"
            
            granular = df.groupby(["store_id", "sku_id", "date", "hour"]).agg(agg_dict).reset_index()
            
            # On-Shelf Availability: clipped on_shelf / capacity
            granular["on_shelf_availability_pct"] = quality_layer.safe_divide(
                granular["on_shelf_units"],
                granular["planogram_capacity_units"],
                default=0.0
            ) * 100.0
            
            # Stockout incidents: count rows where on_shelf = 0
            granular["stockout_incidents"] = (granular["on_shelf_units"] == 0).astype(int)
            
            # Waste: use CSV values if available, otherwise calculate
            if use_csv_waste:
                granular["waste_units"] = granular["waste_units"].fillna(0).clip(lower=0)
                granular["waste_sar"] = granular["waste_cost"].fillna(0)
            else:
                granular["waste_units"] = (granular["on_shelf_units"] - granular["planogram_capacity_units"]).clip(lower=0)
                granular["waste_sar"] = granular["waste_units"] * 10.0
            
            granular["kpi_level"] = "store_sku_date_hour"
            kpi_dfs.append(granular)
        
        # Level 2: By Store, SKU
        if "store_id" in df.columns and "sku_id" in df.columns:
            agg_dict = {
                "on_shelf_units": "sum",
                "planogram_capacity_units": "sum",
            }
            if use_csv_waste:
                agg_dict["waste_units"] = "sum"
                agg_dict["waste_cost"] = "sum"
            
            sku_level = df.groupby(["store_id", "sku_id"]).agg(agg_dict).reset_index()
            
            sku_level["on_shelf_availability_pct"] = quality_layer.safe_divide(
                sku_level["on_shelf_units"],
                sku_level["planogram_capacity_units"],
                default=0.0
            ) * 100.0
            
            sku_level["stockout_incidents"] = (sku_level["on_shelf_units"] == 0).astype(int)
            
            if use_csv_waste:
                sku_level["waste_units"] = sku_level["waste_units"].fillna(0).clip(lower=0)
                sku_level["waste_sar"] = sku_level["waste_cost"].fillna(0)
            else:
                sku_level["waste_units"] = (sku_level["on_shelf_units"] - sku_level["planogram_capacity_units"]).clip(lower=0)
                sku_level["waste_sar"] = sku_level["waste_units"] * 10.0
            
            sku_level["kpi_level"] = "store_sku"
            kpi_dfs.append(sku_level)
        
        # Level 3: By Store
        if "store_id" in df.columns:
            agg_dict = {
                "on_shelf_units": "sum",
                "planogram_capacity_units": "sum",
            }
            if use_csv_waste:
                agg_dict["waste_units"] = "sum"
                agg_dict["waste_cost"] = "sum"
            
            store_level = df.groupby(["store_id"]).agg(agg_dict).reset_index()
            
            store_level["on_shelf_availability_pct"] = quality_layer.safe_divide(
                store_level["on_shelf_units"],
                store_level["planogram_capacity_units"],
                default=0.0
            ) * 100.0
            
            # Count stockout incidents from original data
            stockouts = df[df["on_shelf_units"] <= 0].groupby("store_id").size().reset_index(name="stockout_incidents")
            store_level = store_level.merge(stockouts, on="store_id", how="left")
            store_level["stockout_incidents"] = store_level["stockout_incidents"].fillna(0).astype(int)
            
            if use_csv_waste:
                store_level["waste_units"] = store_level["waste_units"].fillna(0).clip(lower=0)
                store_level["waste_sar"] = store_level["waste_cost"].fillna(0)
            else:
                store_level["waste_units"] = (store_level["on_shelf_units"] - store_level["planogram_capacity_units"]).clip(lower=0)
                store_level["waste_sar"] = store_level["waste_units"] * 10.0
            
            store_level["kpi_level"] = "store"
            kpi_dfs.append(store_level)
        
        if kpi_dfs:
            result = pd.concat(kpi_dfs, ignore_index=True)
            return result
        return pd.DataFrame()
    
    def get_quality_reports(self) -> List[Dict]:
        """Return data quality reports for all processed dataframes."""
        return self.quality_reports
    
    def get_intermediate_dataframe(self) -> Optional[pd.DataFrame]:
        """Get the built intermediate dataframe."""
        return self.intermediate_df


class GlobalDataLayer:
    """
    Global singleton data layer that provides read-only access to the intermediate dataframe.
    
    This is the single source of truth for the entire application.
    """
    
    _instance = None
    _dataframe_builder: Optional[IntermediateDataFrameBuilder] = None
    _intermediate_df: Optional[pd.DataFrame] = None
    _raw_dataframes: Dict[str, pd.DataFrame] = {}
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(GlobalDataLayer, cls).__new__(cls)
        return cls._instance
    
    def initialize(self, base_dir: str):
        """Initialize the data layer by loading and processing all CSVs."""
        if self._intermediate_df is not None:
            logger.info("Data layer already initialized")
            return
        
        logger.info("Initializing global data layer...")
        self._dataframe_builder = IntermediateDataFrameBuilder(base_dir)
        self._raw_dataframes = self._dataframe_builder.load_raw_data()
        self._intermediate_df = self._dataframe_builder.build_intermediate_dataframe()
        logger.info("Global data layer initialized successfully")
    
    def get_dataframe(self) -> pd.DataFrame:
        """Get the intermediate dataframe (read-only)."""
        if self._intermediate_df is None:
            raise RuntimeError("Data layer not initialized. Call initialize() first.")
        return self._intermediate_df.copy()
    
    def get_factory_kpis(self, factory_id: Optional[str] = None, line_id: Optional[str] = None) -> pd.DataFrame:
        """Get factory KPIs filtered by factory_id and/or line_id."""
        df = self.get_dataframe()
        
        # Filter to factory KPIs
        factory_cols = ["factory_id", "line_id", "line_utilization_pct", "production_adherence_pct", 
                       "defect_rate_pct", "waste_units", "waste_sar", "kpi_level"]
        available_cols = [col for col in factory_cols if col in df.columns]
        
        if not available_cols:
            return pd.DataFrame()
        
        result = df[available_cols].copy()
        result = result.dropna(subset=["factory_id"])
        
        if factory_id:
            result = result[result["factory_id"] == factory_id]
        if line_id:
            result = result[result["line_id"] == line_id]
        
        # Get the most appropriate aggregation level
        if factory_id and line_id:
            # Prefer line-level, fallback to daily
            preferred = result[result["kpi_level"].isin(["factory_line", "factory_line_date"])]
            if not preferred.empty:
                result = preferred
        elif factory_id:
            # Prefer factory-level
            preferred = result[result["kpi_level"] == "factory"]
            if not preferred.empty:
                result = preferred
        
        return result
    
    def get_dc_kpis(self, dc_id: Optional[str] = None, sku_id: Optional[str] = None) -> pd.DataFrame:
        """Get DC KPIs filtered by dc_id and/or sku_id."""
        df = self.get_dataframe()
        
        dc_cols = ["dc_id", "sku_id", "service_level_pct", "waste_pct", "backorder_units", 
                  "days_cover", "kpi_level"]
        available_cols = [col for col in dc_cols if col in df.columns]
        
        if not available_cols:
            return pd.DataFrame()
        
        result = df[available_cols].copy()
        result = result.dropna(subset=["dc_id"])
        
        if dc_id:
            result = result[result["dc_id"] == dc_id]
        if sku_id:
            result = result[result["sku_id"] == sku_id]
        
        # Get appropriate aggregation level
        if dc_id and sku_id:
            preferred = result[result["kpi_level"].isin(["dc_sku", "dc_sku_date_hour"])]
            if not preferred.empty:
                result = preferred
        elif dc_id:
            preferred = result[result["kpi_level"] == "dc"]
            if not preferred.empty:
                result = preferred
        
        return result
    
    def get_store_kpis(self, store_id: Optional[str] = None, sku_id: Optional[str] = None) -> pd.DataFrame:
        """Get store KPIs filtered by store_id and/or sku_id."""
        df = self.get_dataframe()
        
        store_cols = ["store_id", "sku_id", "on_shelf_availability_pct", "stockout_incidents", 
                     "waste_units", "waste_sar", "on_shelf_units", "planogram_capacity_units", "kpi_level"]
        available_cols = [col for col in store_cols if col in df.columns]
        
        if not available_cols:
            return pd.DataFrame()
        
        result = df[available_cols].copy()
        result = result.dropna(subset=["store_id"])
        
        if store_id:
            result = result[result["store_id"] == store_id]
        if sku_id:
            result = result[result["sku_id"] == sku_id]
        
        # Get appropriate aggregation level
        if store_id and sku_id:
            preferred = result[result["kpi_level"].isin(["store_sku", "store_sku_date_hour"])]
            if not preferred.empty:
                result = preferred
        elif store_id:
            preferred = result[result["kpi_level"] == "store"]
            if not preferred.empty:
                result = preferred
        
        return result
    
    def get_quality_reports(self) -> List[Dict]:
        """Get data quality reports."""
        if self._dataframe_builder:
            return self._dataframe_builder.get_quality_reports()
        return []
    
    def get_global_command_center_kpis(self) -> Dict:
        """
        Get global Command Center KPIs aggregated across Factory, DC, and Store.
        
        Computes:
        1. Forecast Accuracy (%): Calculated as 100 - AVG(MAPE) from predictions.csv
           - Reads MAPE column from predictions.csv (factory_predictions)
           - Parses percentage strings (e.g., "0.94%" → 0.94)
           - Calculates average MAPE across all predictions
           - Forecast Accuracy = 100 - AVG(MAPE)
        
        2. Waste Cost (SAR): Waste units × cost
           - Store: waste_units × cost
           - DC: spoilage_units × cost
           - Factory: scrap_qty × cost
        
        3. Service Level (%):
           - DC: service_level_pct
           - Store: 1 - stockout rate
        
        4. On-Shelf Availability (%): on_shelf_units / planogram_capacity_units
        
        5. Net Margin After Waste (SAR): Revenue - Waste cost
           - Revenue = Σ(pos_sales_units × price)
           - Waste cost = Σ(waste units × cost)
        
        6. AI Uplift (SAR): Manual vs AI plan comparison
        """
        import numpy as np
        
        df = self.get_dataframe()
        raw_dfs = self._raw_dataframes
        
        # Default unit cost (SAR per unit) - can be made configurable
        # Using more realistic values for bread products
        UNIT_COST = 2.0  # Cost per unit (production cost)
        UNIT_PRICE = 5.0  # Average selling price per unit
        
        results = {}
        
        # 1. Forecast Accuracy (%)
        # Calculate as: 100 - AVG(MAPE) from predictions.csv
        # MAPE column contains percentage strings like "0.94%", "0.30%", etc.
        forecast_accuracy = 0.0
        
        # Get KPI dataframes for later use
        factory_df = self.get_factory_kpis()
        dc_df = self.get_dc_kpis()
        store_df = self.get_store_kpis()
        
        # Read MAPE from predictions.csv (factory_predictions)
        if "factory_predictions" in raw_dfs:
            factory_raw = raw_dfs["factory_predictions"]
            if not factory_raw.empty and "MAPE" in factory_raw.columns:
                # Parse MAPE column: remove % sign and convert to float
                mape_values = factory_raw["MAPE"].astype(str).str.replace("%", "").str.strip()
                # Convert to numeric, handling any invalid values
                mape_numeric = pd.to_numeric(mape_values, errors="coerce")
                # Remove NaN values
                mape_numeric = mape_numeric.dropna()
                
                if len(mape_numeric) > 0:
                    # Calculate average MAPE
                    avg_mape = float(mape_numeric.mean())
                    # Forecast accuracy = 100 - AVG(MAPE)
                    forecast_accuracy = max(0.0, min(100.0, 100.0 - avg_mape))
                else:
                    logger.warning("No valid MAPE values found in predictions.csv")
            else:
                logger.warning("MAPE column not found in factory_predictions dataframe")
        
        # Fallback: If no MAPE data, use factory production adherence as proxy
        if forecast_accuracy == 0.0 and not factory_df.empty and "production_adherence_pct" in factory_df.columns:
            forecast_accuracy = float(factory_df["production_adherence_pct"].mean())
            logger.info("Using production adherence as fallback for forecast accuracy")
        
        results["forecast_accuracy"] = round(forecast_accuracy, 1)
        
        # 2. Waste Cost (SAR)
        waste_cost = 0.0
        
        # Factory: scrap_qty × cost
        if not factory_df.empty and "waste_units" in factory_df.columns:
            factory_waste = factory_df["waste_units"].sum()
            waste_cost += float(factory_waste) * UNIT_COST
        
        # DC: spoilage_units (approximate from waste_pct)
        if not dc_df.empty and "waste_pct" in dc_df.columns:
            # Approximate spoilage from waste percentage
            if "dc_forecasts" in raw_dfs:
                dc_raw = raw_dfs["dc_forecasts"]
                if not dc_raw.empty and "opening_stock_units" in dc_raw.columns:
                    dc_stock = dc_raw["opening_stock_units"].clip(lower=0).sum()
                    dc_waste_pct = dc_df["waste_pct"].mean() / 100.0
                    dc_spoilage = dc_stock * dc_waste_pct
                    waste_cost += float(dc_spoilage) * UNIT_COST
        
        # Store: waste_units × cost
        if not store_df.empty and "waste_units" in store_df.columns:
            store_waste = store_df["waste_units"].sum()
            waste_cost += float(store_waste) * UNIT_COST
        
        results["waste_cost"] = round(waste_cost, 2)
        
        # 3. Service Level (%)
        # Weighted average of DC and Store service levels
        service_level = 0.0
        service_level_sum = 0.0
        service_level_count = 0
        
        # DC service level
        if not dc_df.empty and "service_level_pct" in dc_df.columns:
            dc_service = dc_df["service_level_pct"].mean()
            service_level_sum += dc_service
            service_level_count += 1
        
        # Store service level (1 - stockout rate, approximated from on_shelf_availability)
        if not store_df.empty and "on_shelf_availability_pct" in store_df.columns:
            store_service = store_df["on_shelf_availability_pct"].mean()
            service_level_sum += store_service
            service_level_count += 1
        
        if service_level_count > 0:
            service_level = service_level_sum / service_level_count
        
        results["service_level"] = round(service_level, 1)
        
        # 4. On-Shelf Availability (%)
        on_shelf_availability = 0.0
        if "store_forecasts" in raw_dfs:
            store_raw = raw_dfs["store_forecasts"]
            if not store_raw.empty and "on_shelf_units" in store_raw.columns and "planogram_capacity_units" in store_raw.columns:
                total_on_shelf = store_raw["on_shelf_units"].clip(lower=0).sum()
                total_capacity = store_raw["planogram_capacity_units"].sum()
                if total_capacity > 0:
                    on_shelf_availability = (total_on_shelf / total_capacity) * 100
        
        results["on_shelf_availability"] = round(on_shelf_availability, 1)
        
        # 5. Net Margin After Waste (SAR)
        # Formula: Revenue - Waste cost
        # Revenue = Σ(pos_sales_units × price)
        # Waste cost = Σ(waste units × cost)
        revenue = 0.0
        
        # Calculate Revenue: Use released_to_dc_qty as proxy for actual sales (pos_sales_units)
        # This represents actual production released to distribution centers, which is closer to actual sales
        if "factory_predictions" in raw_dfs:
            factory_raw = raw_dfs["factory_predictions"]
            if not factory_raw.empty and "released_to_dc_qty" in factory_raw.columns:
                # Sum all units released to DC (this represents actual production that reached market)
                # This is the closest proxy to pos_sales_units (point-of-sale sales units)
                total_released = factory_raw["released_to_dc_qty"].clip(lower=0).sum()
                revenue = float(total_released) * UNIT_PRICE
        
        # If factory data not available or revenue is still 0, use store predicted_demand as fallback
        if revenue == 0.0 and "store_forecasts" in raw_dfs:
            store_raw = raw_dfs["store_forecasts"]
            if not store_raw.empty and "predicted_demand" in store_raw.columns:
                # Sum all predicted demand across all time periods (not just hourly average)
                # Filter to forecast_hour_offset = 1 to avoid double-counting across forecast horizons
                if "forecast_hour_offset" in store_raw.columns:
                    store_raw = store_raw[store_raw["forecast_hour_offset"] == 1].copy()
                # Sum all predicted demand (this represents total expected sales)
                total_predicted_sales = store_raw["predicted_demand"].clip(lower=0).sum()
                revenue = float(total_predicted_sales) * UNIT_PRICE
        
        # Calculate Waste Cost: Sum of all waste units × cost
        # Waste cost is already calculated above and stored in waste_cost variable
        # It includes: Factory (scrap_qty × UNIT_COST), DC (spoilage × UNIT_COST), Store (waste_units × UNIT_COST)
        # Formula: Σ(waste units × cost) as per specification
        
        # Net Margin = Revenue - Waste cost
        net_margin = revenue - waste_cost
        
        # Use absolute value if negative (as per user request)
        # This ensures net margin is always positive for display purposes
        # The formula is correct: Revenue - Waste cost, but we display abs() to avoid negative values
        net_margin_abs = abs(net_margin)
        
        results["net_margin"] = round(net_margin_abs, 2)
        results["revenue"] = round(revenue, 2)
        
        # 6. AI Uplift (SAR)
        # Compare AI plan vs manual baseline
        # Simplified: Assume AI reduces waste by 15% and improves service level
        manual_waste_cost = waste_cost * 1.15  # Manual has 15% more waste
        manual_service_penalty = (100 - service_level) * 1000  # Penalty for lower service
        ai_service_benefit = service_level * 50  # Benefit from better service
        
        ai_uplift = (manual_waste_cost - waste_cost) + ai_service_benefit - manual_service_penalty
        results["ai_uplift"] = round(max(0, ai_uplift), 2)
        
        return results
    
    def get_node_health(self) -> pd.DataFrame:
        """
        Get node health summary for all nodes (Factory, DC, Store).
        
        Computes:
        - Service Level: Factory (production_adherence), DC (service_level_pct), Store (on_shelf_availability)
        - Waste %: Factory (waste_units / prod), DC (waste_pct), Store (waste_units / capacity)
        - MAPE: actual vs forecast comparison
        - Alerts: Auto-generated from rule engine
        - Status: Good/Warning/Danger based on thresholds
        """
        nodes = []
        
        # Get raw dataframes for MAPE calculation
        raw_dfs = self._raw_dataframes
        
        # 1. Factory Nodes
        factory_df = self.get_factory_kpis()
        if not factory_df.empty and "factory_id" in factory_df.columns:
            for factory_id in factory_df["factory_id"].dropna().unique():
                factory_rows = factory_df[factory_df["factory_id"] == factory_id]
                if factory_rows.empty:
                    continue
                
                factory_data = factory_rows.iloc[0]
                
                # Service Level = Average(production_adherence_pct)
                service_level = float(factory_data.get("production_adherence_pct", 0.0))
                
                # Waste % = Sum(scrap_qty) / Sum(prod_actual_qty) * 100
                waste_pct = 0.0
                if "factory_predictions" in raw_dfs:
                    factory_raw = raw_dfs["factory_predictions"]
                    if not factory_raw.empty and factory_id in factory_raw.get("factory_id", pd.Series()).dropna().values:
                        factory_rows_raw = factory_raw[factory_raw["factory_id"] == factory_id]
                        if len(factory_rows_raw) > 0:
                            if "scrap_qty" in factory_rows_raw.columns and "prod_actual_qty" in factory_rows_raw.columns:
                                scrap_sum = factory_rows_raw["scrap_qty"].sum()
                                actual_sum = factory_rows_raw["prod_actual_qty"].sum()
                                if actual_sum > 0:
                                    waste_pct = (scrap_sum / actual_sum) * 100
                else:
                    # Fallback: use waste_units from KPI data if raw data not available
                    waste_units = float(factory_data.get("waste_units", 0))
                    total_prod = 0.0
                    if "prod_actual_qty" in factory_data.index:
                        total_prod = float(factory_data.get("prod_actual_qty", 0))
                    if total_prod > 0:
                        waste_pct = (waste_units / total_prod) * 100
                
                # MAPE: (|Actual Qty - Predicted Demand| / Actual Qty) * 100
                # Note: For factory, Predicted Demand = prod_plan_qty, Actual Qty = prod_actual_qty
                mape = 0.0
                if "factory_predictions" in raw_dfs:
                    factory_raw = raw_dfs["factory_predictions"]
                    if not factory_raw.empty and factory_id in factory_raw.get("factory_id", pd.Series()).values:
                        factory_rows_raw = factory_raw[factory_raw["factory_id"] == factory_id]
                        if len(factory_rows_raw) > 0:
                            actual_sum = factory_rows_raw["prod_actual_qty"].sum()
                            plan_sum = factory_rows_raw["prod_plan_qty"].sum()
                            if actual_sum > 0:  # Use actual in denominator
                                mape = abs((actual_sum - plan_sum) / actual_sum) * 100
                
                # Alerts: Waste % exceeds 10%
                alerts = 0
                if waste_pct > 10:
                    alerts += 1
                
                # Status thresholds:
                # Good: Service Level > 90% AND Waste < 5%
                # Warning: Service Level 75-90% OR Waste 5-15%
                # Critical: Service Level < 75% OR Waste > 15%
                if service_level > 90 and waste_pct < 5:
                    status = "good"
                elif (75 <= service_level <= 90) or (5 <= waste_pct <= 15):
                    status = "warning"
                else:
                    status = "danger"
                
                nodes.append({
                    "node_id": factory_id,
                    "name": factory_id.replace("F_", "").replace("_", " ").title() + " Factory",
                    "type": "Factory",
                    "service_level": round(service_level, 1),
                    "waste_pct": round(waste_pct, 1),
                    "mape": round(mape, 1),
                    "alerts": alerts,
                    "status": status,
                })
        
        # 2. DC Nodes
        dc_df = self.get_dc_kpis()
        if not dc_df.empty and "dc_id" in dc_df.columns:
            for dc_id in dc_df["dc_id"].dropna().unique():
                dc_rows = dc_df[dc_df["dc_id"] == dc_id]
                if dc_rows.empty:
                    continue
                
                dc_data = dc_rows.iloc[0]
                
                # Service Level = Average(service_level_pct)
                service_level = float(dc_data.get("service_level_pct", 0.0))
                
                # Waste % = Sum(expiring_within_24h_units) / Sum(opening_stock_units) * 100
                waste_pct = 0.0
                if "dc_forecasts" in raw_dfs:
                    dc_raw = raw_dfs["dc_forecasts"]
                    if not dc_raw.empty and dc_id in dc_raw.get("dc_id", pd.Series()).dropna().values:
                        dc_rows_raw = dc_raw[dc_raw["dc_id"] == dc_id]
                        if len(dc_rows_raw) > 0:
                            if "expiring_within_24h_units" in dc_rows_raw.columns and "opening_stock_units" in dc_rows_raw.columns:
                                expiring_sum = dc_rows_raw["expiring_within_24h_units"].sum()
                                opening_sum = dc_rows_raw["opening_stock_units"].sum()
                                if opening_sum > 0:
                                    waste_pct = (expiring_sum / opening_sum) * 100
                
                # MAPE: (|Actual Qty - Predicted Demand| / Actual Qty) * 100
                mape = 0.0
                if "dc_forecasts" in raw_dfs:
                    dc_raw = raw_dfs["dc_forecasts"]
                    if not dc_raw.empty and dc_id in dc_raw.get("dc_id", pd.Series()).dropna().values:
                        dc_rows_raw = dc_raw[dc_raw["dc_id"] == dc_id]
                        if len(dc_rows_raw) > 0 and "opening_stock_units" in dc_rows_raw.columns and "predicted_demand" in dc_rows_raw.columns:
                            actual = dc_rows_raw["opening_stock_units"].sum()
                            forecast = dc_rows_raw["predicted_demand"].sum()
                            if actual > 0:  # Use actual in denominator
                                mape = abs((actual - forecast) / actual) * 100
                
                # Alerts: Count of rows where on_shelf_units <= 0 (Stockouts) OR Waste % exceeds 10%
                alerts = 0
                if waste_pct > 10:
                    alerts += 1
                # Note: DC doesn't have on_shelf_units, so stockout check doesn't apply
                
                # Status thresholds:
                # Good: Service Level > 90% AND Waste < 5%
                # Warning: Service Level 75-90% OR Waste 5-15%
                # Critical: Service Level < 75% OR Waste > 15%
                if service_level > 90 and waste_pct < 5:
                    status = "good"
                elif (75 <= service_level <= 90) or (5 <= waste_pct <= 15):
                    status = "warning"
                else:
                    status = "danger"
                
                nodes.append({
                    "node_id": dc_id,
                    "name": dc_id.replace("DC_", "").replace("_", " ").title() + " DC",
                    "type": "DC",
                    "service_level": round(service_level, 1),
                    "waste_pct": round(waste_pct, 1),
                    "mape": round(mape, 1),
                    "alerts": alerts,
                    "status": status,
                })
        
        # 3. Store Nodes
        store_df = self.get_store_kpis()
        if not store_df.empty and "store_id" in store_df.columns:
            for store_id in store_df["store_id"].dropna().unique():
                store_rows = store_df[store_df["store_id"] == store_id]
                if store_rows.empty:
                    continue
                
                store_data = store_rows.iloc[0]
                
                # Service Level = Count(on_shelf_units > 0) / Total Rows * 100
                service_level = 0.0
                if "store_forecasts" in raw_dfs:
                    store_raw = raw_dfs["store_forecasts"]
                    if not store_raw.empty and store_id in store_raw.get("store_id", pd.Series()).dropna().values:
                        store_rows_raw = store_raw[store_raw["store_id"] == store_id]
                        if len(store_rows_raw) > 0 and "on_shelf_units" in store_rows_raw.columns:
                            total_rows = len(store_rows_raw)
                            positive_stock_rows = len(store_rows_raw[store_rows_raw["on_shelf_units"] > 0])
                            if total_rows > 0:
                                service_level = (positive_stock_rows / total_rows) * 100
                else:
                    # Fallback to on_shelf_availability_pct if raw data not available
                    service_level = float(store_data.get("on_shelf_availability_pct", 0.0))
                
                # Waste % = Sum(waste_units) / Sum(predicted_demand) * 100
                waste_pct = 0.0
                waste_units = float(store_data.get("waste_units", 0))
                if "store_forecasts" in raw_dfs:
                    store_raw = raw_dfs["store_forecasts"]
                    if not store_raw.empty and store_id in store_raw.get("store_id", pd.Series()).dropna().values:
                        store_rows_raw = store_raw[store_raw["store_id"] == store_id]
                        if len(store_rows_raw) > 0 and "predicted_demand" in store_rows_raw.columns:
                            predicted_sum = store_rows_raw["predicted_demand"].sum()
                            if predicted_sum > 0:
                                waste_pct = (waste_units / predicted_sum) * 100
                else:
                    # Fallback: if no raw data, use waste_units from KPI data
                    waste_pct = 0.0  # Can't calculate without predicted_demand
                
                # MAPE: (|Actual Qty - Predicted Demand| / Actual Qty) * 100
                mape = 0.0
                if "store_forecasts" in raw_dfs:
                    store_raw = raw_dfs["store_forecasts"]
                    if not store_raw.empty and store_id in store_raw.get("store_id", pd.Series()).dropna().values:
                        store_rows_raw = store_raw[store_raw["store_id"] == store_id]
                        if len(store_rows_raw) > 0 and "on_shelf_units" in store_rows_raw.columns and "predicted_demand" in store_rows_raw.columns:
                            actual = store_rows_raw["on_shelf_units"].clip(lower=0).sum()
                            forecast = store_rows_raw["predicted_demand"].sum()
                            if actual > 0:  # Use actual in denominator
                                mape = abs((actual - forecast) / actual) * 100
                
                # Alerts: Count of rows where on_shelf_units <= 0 (Stockouts) OR Waste % exceeds 10%
                alerts = 0
                stockout_count = int(store_data.get("stockout_incidents", 0))
                if stockout_count > 0:
                    alerts += 1
                if waste_pct > 10:
                    alerts += 1
                
                # Status thresholds:
                # Good: Service Level > 90% AND Waste < 5%
                # Warning: Service Level 75-90% OR Waste 5-15%
                # Critical: Service Level < 75% OR Waste > 15%
                if service_level > 90 and waste_pct < 5:
                    status = "good"
                elif (75 <= service_level <= 90) or (5 <= waste_pct <= 15):
                    status = "warning"
                else:
                    status = "danger"
                
                nodes.append({
                    "node_id": store_id,
                    "name": store_id.replace("ST_", "").replace("_", " ").title() + " Store",
                    "type": "Store",
                    "service_level": round(service_level, 1),
                    "waste_pct": round(waste_pct, 1),
                    "mape": round(mape, 1),
                    "alerts": alerts,
                    "status": status,
                })
        
        return pd.DataFrame(nodes) if nodes else pd.DataFrame()


# Global singleton instance
global_data_layer = GlobalDataLayer()

