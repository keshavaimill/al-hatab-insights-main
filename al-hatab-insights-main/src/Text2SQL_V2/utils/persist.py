
import sqlite3
import pandas as pd

def persist_order_log(db_path):
    conn = sqlite3.connect(db_path)
    df = pd.read_sql("SELECT * FROM order_log", conn)

    df.to_csv("datasets/order_log.csv", index=False)
    # df.to_excel("data/order_log.xlsx", index=False)

    conn.close()
