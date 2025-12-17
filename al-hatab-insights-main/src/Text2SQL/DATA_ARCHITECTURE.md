# Global Intermediate Dataframe Layer - Architecture Documentation

## Overview

This project implements a **global intermediate dataframe layer** that serves as the **single source of truth** for all data-driven operations. All CSV files are loaded once, validated, cleaned, and preprocessed into a unified intermediate dataframe with all KPIs precomputed at multiple aggregation levels.

## Data Flow

```
┌─────────────────┐
│   CSV Files     │
│  (datasets/)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Raw DataFrames │  ← Loaded once on startup
│  (pandas)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Data Quality    │  ← Validation, cleaning, error handling
│ Layer           │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Intermediate    │  ← Precomputed KPIs at all aggregation levels
│ DataFrame       │     - Factory KPIs (by factory, line, date, hour)
│ (Single Source  │     - DC KPIs (by DC, SKU, date, hour)
│  of Truth)      │     - Store KPIs (by store, SKU, date, hour)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API Service    │  ← Read-only access layer
│  Layer          │     - FactoryKPIService
└────────┬────────┘     - DCKPIService
         │              - StoreKPIService
         ▼
┌─────────────────┐
│  Flask API      │  ← Presentation layer (no business logic)
│  Endpoints      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Frontend      │  ← React application
│   (React)       │
└─────────────────┘
```

## Architecture Principles

### 1. **Single Source of Truth**
- All data comes from the intermediate dataframe
- No direct CSV access outside the data layer
- No duplicate calculations

### 2. **Separation of Concerns**
- **Data Layer**: Business logic, KPI computation, data quality
- **API Service Layer**: Read-only access, filtering
- **API Endpoints**: Pure presentation, no business logic
- **Frontend**: UI only, no data processing

### 3. **Precomputation**
- All KPIs computed once at startup
- Multiple aggregation levels stored (factory, line, date, hour)
- Fast lookups, no runtime calculations

### 4. **Data Quality**
- Automatic validation on load
- Missing value handling
- Invalid value correction (e.g., negative quantities)
- Quality score tracking

## Intermediate DataFrame Schema

### Dimension Columns
- `factory_id`: Factory identifier (e.g., "F_DUBAI_1")
- `line_id`: Production line identifier (e.g., "Bread_Line_01")
- `store_id`: Store identifier (e.g., "ST_DUBAI_HYPER_01")
- `dc_id`: Distribution center identifier (e.g., "DC_JEDDAH")
- `sku_id`: Stock keeping unit identifier (e.g., "SKU_101")
- `date`: Date (YYYY-MM-DD)
- `hour`: Hour of day (0-23)
- `kpi_level`: Aggregation level (e.g., "factory_line", "dc_sku")

### Factory KPI Columns
- `line_utilization_pct`: Line utilization percentage
- `production_adherence_pct`: Production adherence to plan (%)
- `defect_rate_pct`: Defect rate percentage
- `waste_units`: Waste units (scrap)
- `waste_sar`: Waste cost in SAR

### DC KPI Columns
- `service_level_pct`: Service level percentage
- `waste_pct`: Waste percentage
- `backorder_units`: Backorder units
- `days_cover`: Days of inventory cover

### Store KPI Columns
- `on_shelf_availability_pct`: On-shelf availability percentage
- `stockout_incidents`: Number of stockout incidents
- `waste_units`: Waste units
- `waste_sar`: Waste cost in SAR

## Aggregation Levels

The intermediate dataframe contains KPIs at multiple aggregation levels for efficient querying:

### Factory KPIs
1. **factory_line_date_hour**: Most granular (by factory, line, date, hour)
2. **factory_line_date**: Daily aggregates (by factory, line, date)
3. **factory_line**: Line-level aggregates (by factory, line)
4. **factory**: Factory-level aggregates (by factory)

### DC KPIs
1. **dc_sku_date_hour**: Most granular (by DC, SKU, date, hour)
2. **dc_sku**: SKU-level aggregates (by DC, SKU)
3. **dc**: DC-level aggregates (by DC)

### Store KPIs
1. **store_sku_date_hour**: Most granular (by store, SKU, date, hour)
2. **store_sku**: SKU-level aggregates (by store, SKU)
3. **store**: Store-level aggregates (by store)

## Data Quality Rules

### Validation Rules
1. **Missing Values**: Logged and reported in quality reports
2. **Negative Values**: Automatically clipped to 0 for quantity columns
3. **Division by Zero**: Handled with safe division (returns 0 or default)
4. **Invalid Types**: Type coercion with error handling

### Quality Metrics
- `data_quality_score`: 0-1 score based on missing/invalid values
- `missing_values`: Dictionary of column → missing count
- `invalid_values`: Dictionary of column → invalid count
- `rows_dropped`: Number of rows removed during cleaning

## Usage Examples

### Accessing Factory KPIs

```python
from core.data_layer import global_data_layer

# Get factory KPIs for a specific factory and line
df = global_data_layer.get_factory_kpis(
    factory_id="F_DUBAI_1",
    line_id="Bread_Line_01"
)

# Get all factory KPIs
df = global_data_layer.get_factory_kpis()
```

### Accessing DC KPIs

```python
# Get DC KPIs for a specific DC
df = global_data_layer.get_dc_kpis(dc_id="DC_JEDDAH")

# Get days of cover for all DC-SKU combinations
df = global_data_layer.get_dc_kpis()
```

### Accessing Store KPIs

```python
# Get store KPIs for a specific store
df = global_data_layer.get_store_kpis(store_id="ST_DUBAI_HYPER_01")
```

### Using API Services

```python
from core.api_service import FactoryKPIService

# Get factory KPIs as a dictionary (ready for JSON response)
kpis = FactoryKPIService.get_factory_kpis(
    factory_id="F_DUBAI_1",
    line_id="Bread_Line_01"
)
# Returns: {
#     "lineUtilization": 87.5,
#     "productionAdherence": 94.2,
#     "defectRate": 0.8,
#     "wasteUnits": 1250,
#     "wasteSAR": 12500.0
# }
```

## API Endpoints

All endpoints now use the intermediate dataframe layer:

### Factory KPIs
```
GET /factory-kpis?factory_id=F_DUBAI_1&line_id=Bread_Line_01
```

### DC KPIs
```
GET /dc-kpis?dc_id=DC_JEDDAH
```

### DC Days of Cover
```
GET /dc-days-cover?dc_id=DC_JEDDAH&sku_id=SKU_101
```

### Store KPIs
```
GET /store-kpis?store_id=ST_DUBAI_HYPER_01
```

## Adding New KPIs

To add a new KPI:

1. **Add computation in `IntermediateDataFrameBuilder`**:
   - Add calculation in `_compute_factory_kpis()`, `_compute_dc_kpis()`, or `_compute_store_kpis()`
   - Compute at appropriate aggregation levels

2. **Add access method in `GlobalDataLayer`**:
   - Add filtering logic in `get_factory_kpis()`, `get_dc_kpis()`, or `get_store_kpis()`

3. **Add service method in API service layer**:
   - Add method in `FactoryKPIService`, `DCKPIService`, or `StoreKPIService`

4. **Add endpoint in `app.py`**:
   - Create new route that calls the service method

## Performance Considerations

### Caching
- Intermediate dataframe is built once at startup
- All KPIs precomputed
- No runtime calculations for standard queries

### Memory
- Dataframe stored in memory for fast access
- Consider chunking for very large datasets (>10M rows)

### Query Performance
- Filtering uses pandas boolean indexing (fast)
- Aggregation levels allow direct lookups without recalculation

## Error Handling

### Data Quality Issues
- Invalid values are automatically corrected (logged)
- Missing values are handled gracefully
- Quality reports available via `global_data_layer.get_quality_reports()`

### API Errors
- Empty results return default values (0, empty dict, etc.)
- No exceptions thrown to frontend
- Errors logged server-side

## Testing

### Unit Tests
Test each layer independently:
- Data quality layer validation
- KPI computation logic
- API service methods
- Endpoint responses

### Integration Tests
Test the full flow:
- CSV loading → Intermediate dataframe → API response

## Maintenance

### Adding New CSV Files
1. Add CSV to `datasets/` folder
2. Add to `csv_files` dict in `IntermediateDataFrameBuilder.load_raw_data()`
3. Add processing method (e.g., `_compute_new_kpis()`)
4. Update schema documentation

### Updating KPI Formulas
1. Update computation in `IntermediateDataFrameBuilder`
2. Rebuild intermediate dataframe (restart app)
3. Verify results match expected values

## Benefits

1. **Consistency**: Single source of truth ensures all pages show same data
2. **Performance**: Precomputed KPIs = fast API responses
3. **Maintainability**: Business logic centralized in one place
4. **Quality**: Automatic validation and error handling
5. **Extensibility**: Easy to add new KPIs or data sources
6. **Testability**: Each layer can be tested independently

