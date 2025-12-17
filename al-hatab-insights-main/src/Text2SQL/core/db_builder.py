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


def build_database(schema_list, db_path="local.db"):
    """
    Load CSVs into SQLite and create tables.
    """
    conn = sqlite3.connect(db_path)
    for item in schema_list:
        df = pd.read_csv(item["path"])
        df.to_sql(item["table_name"], conn, if_exists="replace", index=False)
    conn.close()


def execute_sql(db_path, sql):
    """
    Execute given SQL and return dataframe.
    """
    conn = sqlite3.connect(db_path)
    try:
        df = pd.read_sql_query(sql, conn)
    except Exception as e:
        print("SQL error:", e)
        df = pd.DataFrame()
    conn.close()
    return df
