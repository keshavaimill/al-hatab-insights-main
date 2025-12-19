from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os

# Load environment variables from .env file FIRST (before any other imports that might need them)
from dotenv import load_dotenv
load_dotenv()

# Import config to ensure .env is loaded and validate API keys
from config import config

# Original imports 
from core.db_builder import load_schema, build_database, execute_sql
from core.schema_loader import SchemaLoader

# New global data layer
from core.data_layer import global_data_layer
from core.api_service import FactoryKPIService, DCKPIService, StoreKPIService, NodeHealthService, GlobalCommandCenterService

# Agents
from agents.text2sql_agent import Text2SQLAgent
from agents.summarizer_agent import SummarizerAgent

# Utility for chart intent detection
from utils.intent import wants_chart


app = Flask(__name__)
# Enable CORS for frontend requests - allow all origins
# This allows requests from localhost (dev) and any deployed frontend
CORS(app, 
     resources={r"/*": {
         "origins": "*",
         "methods": ["GET", "POST", "OPTIONS"],
         "allow_headers": ["Content-Type", "Authorization"],
         "expose_headers": ["Content-Type"]
     }}, 
     supports_credentials=True)

# Add CORS headers to all responses
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# Get the directory where app.py is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ---------------------------------------------
# Initialize Global Data Layer
# ---------------------------------------------
# This loads all CSVs, validates data, and precomputes all KPIs
# This is the single source of truth for the entire application
global_data_layer.initialize(BASE_DIR)

# ---------------------------------------------
# LOAD SCHEMA
# ---------------------------------------------
# Use absolute paths based on app.py location
schema = [
    {
        "table_name": "dc_168h_forecasts",
        "path": os.path.join(BASE_DIR, "datasets", "dc_168h_forecasts.csv"),
    },
    {
        "table_name": "store_168h_forecasts",
        "path": os.path.join(BASE_DIR, "datasets", "store_168h_forecasts.csv"),
    },
    {
        "table_name": "factory_predictions",
        "path": os.path.join(BASE_DIR, "datasets", "predictions.csv"),
    },
]

# Use your existing schema loader
schema_loader = SchemaLoader(schema)
loaded_schema = schema_loader.load()

# Build local SQLite DB - use absolute path
db_path = os.path.join(BASE_DIR, "local.db")
try:
    build_database(schema, db_path)
    print("✅ Database built successfully")
except Exception as e:
    print(f"⚠️  Warning: Database build failed: {str(e)}")

# Load schema metadata for Text2SQLAgent
schema_metadata_path = os.path.join(BASE_DIR, "schema_metadata.json")
schema_metadata = {}
try:
    if os.path.exists(schema_metadata_path):
        with open(schema_metadata_path, "r") as f:
            schema_metadata = json.load(f)
        print("✅ Schema metadata loaded successfully")
    else:
        print(f"⚠️  Warning: schema_metadata.json not found at {schema_metadata_path}")
except Exception as e:
    print(f"⚠️  Warning: Failed to load schema metadata: {str(e)}")


# ---------------------------------------------
# Initialize agents (with error handling)
# ---------------------------------------------
t2s = None
summarizer = None
agent_error = None

try:
    # Verify API key is loaded before initializing agents
    if config.LLM_PROVIDER == "google":
        if not config.GOOGLE_API_KEY:
            raise ValueError("GOOGLE_API_KEY is required but not set. Please check your .env file.")
        print(f"✅ Using Google Gemini API (model: {config.GOOGLE_MODEL})")
        if config.GOOGLE_API_KEY and len(config.GOOGLE_API_KEY) > 8:
            masked_key = '*' * (len(config.GOOGLE_API_KEY) - 8) + config.GOOGLE_API_KEY[-8:]
        else:
            masked_key = 'NOT SET' if not config.GOOGLE_API_KEY else 'SET (too short to mask)'
        print(f"✅ API Key loaded: {masked_key}")
    elif config.LLM_PROVIDER == "openai":
        if not config.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is required but not set. Please check your .env file.")
        print(f"✅ Using OpenAI API (model: {config.OPENAI_MODEL})")
        if config.OPENAI_API_KEY and len(config.OPENAI_API_KEY) > 8:
            masked_key = '*' * (len(config.OPENAI_API_KEY) - 8) + config.OPENAI_API_KEY[-8:]
        else:
            masked_key = 'NOT SET' if not config.OPENAI_API_KEY else 'SET (too short to mask)'
        print(f"✅ API Key loaded: {masked_key}")
    
    t2s = Text2SQLAgent(db_path, loaded_schema, schema_metadata)
    summarizer = SummarizerAgent()
    print("✅ Agents initialized successfully")
except Exception as e:
    agent_error = str(e)
    print(f"⚠️  Warning: Failed to initialize agents: {agent_error}")
    print("⚠️  The /query endpoint will return errors until agents are properly configured.")
    print("⚠️  Please check your .env file for LLM_PROVIDER and API keys.")
    print(f"⚠️  Current LLM_PROVIDER: {config.LLM_PROVIDER}")
    print(f"⚠️  GOOGLE_API_KEY set: {bool(config.GOOGLE_API_KEY)}")
    print(f"⚠️  OPENAI_API_KEY set: {bool(config.OPENAI_API_KEY)}")

# ---------------------------------------------
# Text2SQL query endpoint
# ---------------------------------------------
@app.route("/query", methods=["POST", "OPTIONS"])
def query():
    # Handle OPTIONS request for CORS preflight
    if request.method == "OPTIONS":
        return jsonify({}), 200
    
    try:
        # Check if agents are initialized
        if t2s is None or summarizer is None:
            error_msg = agent_error or "Agents not initialized. Please check backend configuration."
            return jsonify({
                "error": "Agents not available",
                "details": error_msg,
                "sql": None,
                "data": [],
                "summary": "The AI agents are not properly configured. Please check the backend logs for details. Common issues: missing API keys (GOOGLE_API_KEY or OPENAI_API_KEY) in environment variables.",
                "viz": None,
                "mime": None
            }), 503
        
        # Validate request body
        if not request.json:
            return jsonify({"error": "Request body is required"}), 400

        body = request.json
        question = body.get("question", "").strip()
        
        if not question:
            return jsonify({"error": "Question is required"}), 400

        # Step 1 — Get SQL from text2sql agent
        try:
            sql = t2s.run(question)
        except Exception as e:
            print(f"Error in Text2SQL agent: {str(e)}")
            return jsonify({
                "error": "Failed to generate SQL query",
                "details": str(e),
                "sql": None,
                "data": [],
                "summary": "I encountered an error while processing your query. Please try rephrasing it.",
                "viz": None,
                "mime": None
            }), 500

        # Step 2 — Execute SQL
        try:
            df = execute_sql(db_path, sql)
        except Exception as e:
            print(f"Error executing SQL: {str(e)}")
            return jsonify({
                "error": "Failed to execute SQL query",
                "details": str(e),
                "sql": sql,
                "data": [],
                "summary": "I generated a SQL query but encountered an error executing it. Please try rephrasing your question.",
                "viz": None,
                "mime": None
            }), 500

        # Step 3 — Summarize result
        try:
            summary = summarizer.summarize(question, df)
        except Exception as e:
            print(f"Error summarizing results: {str(e)}")
            # Use a fallback summary if summarization fails
            summary = f"Query returned {len(df)} row(s)."

        # Step 4 — Generate visualization ONLY if explicitly asked
        viz, mime = None, None
        try:
            if wants_chart(question) and not df.empty:
                viz, mime = summarizer.generate_viz(question, df)
        except Exception as e:
            print(f"Error generating visualization: {str(e)}")
            # Continue without visualization if it fails

        return jsonify({
            "sql": sql,
            "data": df.to_dict(orient="records"),
            "summary": summary,
            "viz": viz,
            "mime": mime
        })
    
    except Exception as e:
        print(f"Unexpected error in /query endpoint: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "error": "Internal server error",
            "details": str(e),
            "sql": None,
            "data": [],
            "summary": "I encountered an unexpected error. Please try again.",
            "viz": None,
            "mime": None
        }), 500


# ---------------------------------------------
# Store KPIs endpoint (Store Operations)
# Now uses the global intermediate dataframe layer
# ---------------------------------------------
@app.route("/store-kpis", methods=["GET"])
def store_kpis():
    """
    Get store-level KPIs from the precomputed intermediate dataframe.
    
    All business logic is in the data layer - this endpoint is purely presentational.
    """
    store_id = request.args.get("store_id", "ST_DUBAI_HYPER_01")
    result = StoreKPIService.get_store_kpis(store_id=store_id)
    return jsonify(result)


@app.route("/store-shelf-performance", methods=["GET"])
def store_shelf_performance():
    """
    Get shelf performance data (SKU-level) for a specific store.
    
    All business logic is in the data layer - this endpoint is purely presentational.
    """
    store_id = request.args.get("store_id", "ST_DUBAI_HYPER_01")
    results = StoreKPIService.get_store_shelf_performance(store_id=store_id)
    return jsonify(results)


# ---------------------------------------------
# DC KPIs endpoint (Distribution Center)
# Now uses the global intermediate dataframe layer
# ---------------------------------------------
@app.route("/dc-kpis", methods=["GET"])
def dc_kpis():
    """
    Get DC-level KPIs from the precomputed intermediate dataframe.
    
    All business logic is in the data layer - this endpoint is purely presentational.
    """
    dc_id = request.args.get("dc_id", "DC_JEDDAH")
    result = DCKPIService.get_dc_kpis(dc_id=dc_id)
    return jsonify(result)


# ---------------------------------------------
# DC Days-of-Cover endpoint (per DC, per SKU)
# Now uses the global intermediate dataframe layer
# ---------------------------------------------
@app.route("/dc-days-cover", methods=["GET"])
def dc_days_cover():
    """
    Get days-of-cover per (dc_id, sku_id) from the precomputed intermediate dataframe.
    
    All business logic is in the data layer - this endpoint is purely presentational.
    """
    dc_id = request.args.get("dc_id")
    sku_id = request.args.get("sku_id")
    results = DCKPIService.get_dc_days_cover(dc_id=dc_id, sku_id=sku_id)
    return jsonify(results)


# ---------------------------------------------
# Factory KPIs endpoint (Factory Control Tower)
# Now uses the global intermediate dataframe layer
# ---------------------------------------------
@app.route("/factory-kpis", methods=["GET"])
def factory_kpis():
    """
    Get factory-level KPIs from the precomputed intermediate dataframe.
    
    All business logic is in the data layer - this endpoint is purely presentational.
    """
    factory_id = request.args.get("factory_id")
    line_id = request.args.get("line_id")
    result = FactoryKPIService.get_factory_kpis(factory_id=factory_id, line_id=line_id)
    return jsonify(result)


# ---------------------------------------------
# Node Health Summary endpoint
# Now uses the global intermediate dataframe layer
# ---------------------------------------------
@app.route("/node-health", methods=["GET"])
def node_health():
    """
    Get node health summary for all nodes (Factory, DC, Store).
    
    All business logic is in the data layer - this endpoint is purely presentational.
    """
    results = NodeHealthService.get_node_health()
    return jsonify(results)


# ---------------------------------------------
# Global Command Center KPIs endpoint
# Now uses the global intermediate dataframe layer
# ---------------------------------------------
@app.route("/global-kpis", methods=["GET"])
def global_kpis():
    """
    Get global Command Center KPIs aggregated across Factory, DC, and Store.
    
    All business logic is in the data layer - this endpoint is purely presentational.
    """
    results = GlobalCommandCenterService.get_global_kpis()
    return jsonify(results)


# ---------------------------------------------
# Health check endpoint
# ---------------------------------------------
@app.route("/health", methods=["GET", "OPTIONS"])
def health():
    """Health check endpoint to verify backend is running"""
    agents_status = "ready" if (t2s is not None and summarizer is not None) else "not_initialized"
    return jsonify({
        "status": "healthy",
        "service": "al-hatab-insights-backend",
        "version": "1.0.0",
        "agents": agents_status,
        "agent_error": agent_error if agent_error else None
    }), 200


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
