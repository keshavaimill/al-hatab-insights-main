from flask import Flask, request, jsonify
import json, os

# Original imports 
from core.db_builder import load_schema, build_database, execute_sql
from core.schema_loader import SchemaLoader

# Agents
from agents.text2sql_agent import Text2SQLAgent
from agents.summarizer_agent import SummarizerAgent

# Utility for chart intent detection
from utils.intent import wants_chart

from utils.persist import persist_order_log

app = Flask(__name__)

# ---------------------------------------------
# LOAD SCHEMA
# ---------------------------------------------
schema = [
    {"table_name": "dc_168h_forecasts", "path": "datasets/dc_168h_forecasts.csv"},
    {"table_name": "store_168h_forecasts", "path": "datasets/store_168h_forecasts.csv"},
    {"table_name": "order_log", "path": "datasets/order_log.csv"}
]

# Use your existing schema loader
schema_loader = SchemaLoader(schema)
loaded_schema = schema_loader.load()

# Build local SQLite DB
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(BASE_DIR, "local.db")
build_database(schema, db_path)

# Load schema metadata for Text2SQLAgent
with open("schema_metadata.json", "r") as f:
    schema_metadata = json.load(f)


# ---------------------------------------------
# Initialize agents
# ---------------------------------------------
t2s = Text2SQLAgent(db_path, loaded_schema, schema_metadata)
summarizer = SummarizerAgent()

# ---------------------------------------------
# API Endpoint
# ---------------------------------------------
# @app.route("/query", methods=["POST"])
# def query():
#     body = request.json
#     question = body.get("question", "")

#     # Step 1 — Get SQL from text2sql agent
#     sql = t2s.run(question)

#     # Step 2 — Execute SQL
#     result = execute_sql(db_path, sql)

#     if isinstance(result, int):
#         summary = f"{result} rows successfully written to order_log."
#         df = []
#     else:
#     # Step 3 — Summarize results
#         summary = summarizer.summarize(question, result)
#         df = result.to_dict(orient="records")

#     # Step 4 — Generate visualization ONLY if explicitly asked
#     if wants_chart(question) and not df.empty:
#         viz, mime = summarizer.generate_viz(question, df)
#     else:
#         viz, mime = None, None

#     return jsonify({
#         "sql": sql,
#         "data": df.to_dict(orient="records"),
#         "summary": summary,
#         "viz": viz,
#         "mime": mime
#     })
@app.route("/query", methods=["POST"])
def query():
    body = request.json
    question = body.get("question", "")

    # Step 1 — Get SQL
    sql = t2s.run(question)

    # Step 2 — Execute SQL
    result = execute_sql(db_path, sql)

    # WRITE query (INSERT / UPDATE / DELETE)
    if isinstance(result, int):
        summary = f"{result} row(s) successfully written to order_log."
        data = []

        # Optional: persist after write
        persist_order_log(db_path)

        viz, mime = None, None

    # READ query (SELECT)
    else:
        summary = summarizer.summarize(question, result)
        data = result.to_dict(orient="records")

        if wants_chart(question) and not result.empty:
            viz, mime = summarizer.generate_viz(question, result)
        else:
            viz, mime = None, None

    return jsonify({
        "sql": sql,
        "data": data,
        "summary": summary,
        "viz": viz,
        "mime": mime
    })


if __name__ == "__main__":
    app.run(debug=True)
