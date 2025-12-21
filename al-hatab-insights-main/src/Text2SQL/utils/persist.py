import sqlite3
import pandas as pd
import os

def persist_order_log(db_path):
    """
    Persist order_log table from database to CSV file.
    """
    conn = sqlite3.connect(db_path)
    df = pd.read_sql("SELECT * FROM order_log", conn)
    conn.close()

    # Get the directory where the database is located
    base_dir = os.path.dirname(os.path.abspath(db_path))
    csv_path = os.path.join(base_dir, "datasets", "order_log.csv")
    
    # Ensure datasets directory exists
    os.makedirs(os.path.dirname(csv_path), exist_ok=True)
    
    df.to_csv(csv_path, index=False)
