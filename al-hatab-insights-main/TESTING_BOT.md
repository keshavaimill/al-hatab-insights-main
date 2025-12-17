# Testing the Floating Chat Bot

## Prerequisites

1. **Python 3.8+** installed
2. **Node.js & npm** installed
3. **Text2SQL backend dependencies** installed

## Step-by-Step Testing Guide

### 1. Install Backend Dependencies

```bash
cd src/Text2SQL/Text2SQL
pip install -r requirements.txt
```

Or if you prefer using a virtual environment:

```bash
cd src/Text2SQL/Text2SQL
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Set Up Environment Variables (Optional)

Create a `.env` file in `src/Text2SQL/Text2SQL/` if you want to use a specific LLM provider:

```env
LLM_PROVIDER=google
GOOGLE_API_KEY=your_api_key_here
```

Or for OpenAI:

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=your_api_key_here
```

**Note:** If no API keys are provided, the backend will still run but queries may fail. You can test the UI without API keys to see the error handling.

### 3. Start the Text2SQL Backend

```bash
cd src/Text2SQL/Text2SQL
python app.py
```

You should see output like:
```
 * Running on http://127.0.0.1:5000
 * Debug mode: on
```

**Keep this terminal window open!**

### 4. Start the Frontend

Open a **new terminal window** and run:

```bash
npm install  # If you haven't installed dependencies yet
npm run dev
```

The frontend should start on `http://localhost:8080`

### 5. Test the Bot

1. **Open the application** in your browser: `http://localhost:8080`

2. **Locate the floating bot icon** in the bottom-right corner (should show `/public/image.png`)

3. **Click the floating icon** to open the chat window

4. **Try these test queries:**

   **DC Replenishment Queries:**
   - "Show me all DC replenishment recommendations"
   - "What are the recommended quantities for DC_DAMMAM?"
   - "Show predicted demand for SKU_101"
   - "Which DCs need replenishment?"
   - "Show me items expiring within 24 hours"

   **Store Replenishment Queries:**
   - "Show me all store replenishment recommendations"
   - "What stores need replenishment?"
   - "Show on-shelf units for ST_DUBAI_HYPER_01"
   - "Which SKUs are below planogram capacity?"
   - "Show recommendations for stores with promotions"

   **Aggregation Queries:**
   - "What is the total predicted demand across all DCs?"
   - "Count how many replenishment recommendations we have"
   - "Show the average recommended quantity by DC"
   - "What is the total opening stock across all DCs?"

   **Time-based Queries:**
   - "Show replenishment data for December 7th"
   - "What are the recommendations for today?"
   - "Show hourly demand predictions"

   **Visualization Queries:**
   - "Show me a chart of predicted demand by DC"
   - "Create a bar chart of recommended quantities"
   - "Visualize the replenishment recommendations"
   - "Show a line chart of predicted demand over time"

5. **Expected Behavior:**
   - ✅ Bot sends your question to the backend
   - ✅ Backend generates SQL query
   - ✅ SQL is executed against the database
   - ✅ Results are summarized
   - ✅ If you asked for a chart, a visualization appears
   - ✅ SQL query is displayed in the response
   - ✅ Data preview table shows results

## Troubleshooting

### Bot doesn't appear
- Check browser console for errors
- Verify `/public/image.png` exists
- Check that `FloatingBot` is imported in `Layout.tsx`

### "Error processing your query" message
- **Backend not running:** Make sure Flask app is running on port 5000
- **CORS error:** The Vite proxy should handle this, but if issues persist, add `flask-cors`:
  ```bash
  pip install flask-cors
  ```
  Then in `app.py`, add:
  ```python
  from flask_cors import CORS
  CORS(app)
  ```

### API connection issues
- Check that backend is running: `http://localhost:5000`
- Test backend directly: 
  ```bash
  curl -X POST http://localhost:5000/query \
    -H "Content-Type: application/json" \
    -d '{"question": "show all sales"}'
  ```

### No response from bot
- Check browser Network tab for failed requests
- Check backend terminal for error messages
- Verify database file exists: `src/Text2SQL/Text2SQL/local.db`
- Verify CSV files exist: 
  - `src/Text2SQL/Text2SQL/datasets/dc_replenishment_recs.csv`
  - `src/Text2SQL/Text2SQL/datasets/store_replenishment_recs.csv`

### Map not loading
- This is separate from the bot - make sure Leaflet dependencies are installed:
  ```bash
  npm install
  ```

## Quick Test Checklist

- [ ] Backend running on port 5000
- [ ] Frontend running on port 8080
- [ ] Floating bot icon visible (bottom-right)
- [ ] Chat window opens on click
- [ ] Can type and send messages
- [ ] Bot responds with SQL + summary
- [ ] Data preview shows in response
- [ ] Charts appear when requested

## Sample Test Queries

**DC Replenishment:**
```
"Show all DC replenishment recommendations"
"What are the recommended quantities for DC_DAMMAM?"
"Show predicted demand for SKU_101"
"Which DCs have items expiring within 24 hours?"
"Show me the total opening stock by DC"
```

**Store Replenishment:**
```
"Show all store replenishment recommendations"
"What stores need replenishment?"
"Show on-shelf units for ST_DUBAI_HYPER_01"
"Which SKUs are below planogram capacity?"
"Show recommendations where on_shelf_units is negative"
```

**Aggregations:**
```
"What is the total predicted demand?"
"Count how many recommendations we have"
"Show average recommended quantity by store"
"What is the total opening stock?"
```

**Visualizations:**
```
"Create a bar chart of recommended quantities by DC"
"Show me a line chart of predicted demand over time"
"Visualize the replenishment recommendations"
```

## API Endpoint Testing

You can also test the backend API directly:

```bash
# Using curl
curl -X POST http://localhost:5000/query \
  -H "Content-Type: application/json" \
  -d '{"question": "show all DC replenishment recommendations"}'

# Using PowerShell (Windows)
Invoke-RestMethod -Uri http://localhost:5000/query -Method POST -ContentType "application/json" -Body '{"question":"show all DC replenishment recommendations"}'
```

Expected response:
```json
{
  "sql": "SELECT * FROM dc_replenishment;",
  "data": [
    {
      "timestamp": "2025-12-07 00:00:00",
      "dc_id": "DC_DAMMAM",
      "sku_id": "SKU_101",
      "predicted_demand": 13.33,
      "Recommended_Qty": 14.0,
      "Reason": "REPLENISH_DEMAND",
      ...
    }
  ],
  "summary": "...",
  "viz": null,
  "mime": null
}
```

## Database Schema

The database contains two tables:

### `dc_replenishment` table:
- **timestamp**: Date and time of the record
- **dc_id**: Distribution Center ID (e.g., DC_DAMMAM, DC_JEDDAH)
- **sku_id**: Stock Keeping Unit ID (e.g., SKU_101, SKU_103)
- **predicted_demand**: Forecasted demand quantity
- **Recommended_Qty**: Recommended replenishment quantity
- **Reason**: Reason for recommendation (e.g., REPLENISH_DEMAND)
- **lag_1, lag_14, lag_30**: Historical demand lags
- **opening_stock_units**: Current stock level
- **expiring_within_24h_units**: Units expiring soon

### `store_replenishment` table:
- **timestamp**: Date and time of the record
- **store_id**: Store ID (e.g., ST_DUBAI_HYPER_01, ST_JEDDAH_MALL_01)
- **sku_id**: Stock Keeping Unit ID
- **on_shelf_units**: Current units on shelf (can be negative for stockouts)
- **planogram_capacity_units**: Maximum shelf capacity
- **predicted_demand**: Forecasted demand quantity
- **Recommended_Qty**: Recommended replenishment quantity
- **Recommendation_Type**: Type of recommendation (e.g., ORDER_EXPIRY_PULL, ORDER_TO_CAPACITY)
- **promo_flag**: Whether promotion is active (1 = yes, 0 = no)
- **footfall_count**: Number of customers/visitors

