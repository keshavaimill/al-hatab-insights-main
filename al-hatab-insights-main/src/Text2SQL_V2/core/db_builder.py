from utils.persist import persist_order_log
import sqlite3
import pandas as pd

def load_schema(schema_list):
    """
    Convert schema list into a dict describing tables + columns.
    """
    schema = {}
    for item in schema_list:
        df = pd.read_csv(item["path"])
        schema[item["table_name"]] = list(df.columns)
    return schema


# SEED_TABLES = {"dc_168h_forecasts", "store_168h_forecasts"}
# TRANSACTIONAL_TABLES = {"order_log"}

def build_database(schema_list, db_path="local.db"):
    conn = sqlite3.connect(db_path)

    for item in schema_list:
        table = item["table_name"]
        
        if table == "order_log":
            # DO NOT read CSV, DO NOT overwrite, DO NOT append data
            conn.execute("""
                CREATE TABLE IF NOT EXISTS order_log (
                    order_id TEXT,
                    product_id TEXT,
                    forecast_date TEXT,
                    order_date TEXT,
                    quantity REAL,
                    created_at TEXT,
                    source TEXT
                )
            """)
            continue


        # For Seed Tables
        df = pd.read_csv(item["path"])
        # if table in SEED_TABLES:
        df.to_sql(table, conn, if_exists="replace", index=False)

        # elif table in TRANSACTIONAL_TABLES:
        #     df.head(0).to_sql(table, conn, if_exists="append", index=False)

    conn.close()



def execute_sql(db_path, sql):
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    sql_clean = sql.strip().lower()

    try:
        # READ queries
        if sql_clean.startswith("select"):
            df = pd.read_sql_query(sql, conn)
            conn.close()
            return df

        # WRITE queries (INSERT / UPDATE / DELETE / ALTER)
        cur.execute(sql)
        conn.commit()
        rows_affected = cur.rowcount
        conn.close()
        return rows_affected

    except Exception as e:
        conn.close()
        raise RuntimeError(f"SQL execution failed: {e}")

