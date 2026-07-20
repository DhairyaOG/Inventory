import os
import pandas as pd
import numpy as np
from pymongo import MongoClient
import certifi
from dotenv import load_dotenv
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_percentage_error
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

from urllib.parse import quote_plus

# Load environment variables
load_dotenv()
MONGO_USERNAME = os.getenv("MONGO_USERNAME")
MONGO_PASSWORD = os.getenv("MONGO_PASSWORD")
MONGO_CLUSTER  = os.getenv("MONGO_CLUSTER", "items.xws9ags.mongodb.net")
MONGO_APP_NAME = os.getenv("MONGO_APP_NAME", "Items")

if not MONGO_USERNAME or not MONGO_PASSWORD:
    raise EnvironmentError("❌ MONGO_USERNAME and MONGO_PASSWORD must be set in .env")

MONGO_URI = (
    f"mongodb+srv://{quote_plus(MONGO_USERNAME)}:{quote_plus(MONGO_PASSWORD)}"
    f"@{MONGO_CLUSTER}/?appName={MONGO_APP_NAME}"
)

FEATURES = ['day_of_week', 'is_weekend', 'sales_lag_7', 'rolling_mean_3']

def calculate_mape():
    logger.info("🔌 Connecting to MongoDB...")
    client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
    db = client['restaurant_db']
    
    items = db.sales.distinct("item_name")
    if not items:
        logger.error("No items found in the sales collection.")
        return
        
    logger.info(f"🔍 Found {len(items)} items. Calculating MAPE...")
    print("-" * 50)
    print(f"{'Item Name':<20} | {'Test Size (Days)':<16} | {'MAPE':<10}")
    print("-" * 50)
    
    overall_mapes = []
    
    for item in items:
        cursor = db.sales.find(
            {"item_name": item},
            {"_id": 0, "date": 1, "qty_sold": 1}
        )
        df = pd.DataFrame(list(cursor))
        
        if len(df) < 30:
            logger.warning(f"Not enough data for {item} (need >= 30 days). Skipping.")
            continue
            
        df["date"] = pd.to_datetime(df["date"])
        df = df.sort_values("date").reset_index(drop=True)
        
        # Feature Engineering (same as app.py)
        df["day_of_week"]    = df["date"].dt.dayofweek
        df["is_weekend"]     = df["day_of_week"].isin([4, 5, 6]).astype(int)
        df["sales_lag_7"]    = df["qty_sold"].shift(7)
        df["rolling_mean_3"] = df["qty_sold"].shift(1).rolling(window=3).mean()
        df = df.dropna()
        
        if len(df) < 10:
            logger.warning(f"After feature engineering, too few rows for {item}. Skipping.")
            continue
            
        # Train-Test Split (Train on everything except the last 30 days, test on the last 30 days)
        split_idx = len(df) - 30
        if split_idx < 10:
            # If dataset is too small for a 30 day test set, just do an 80/20 split
            split_idx = int(len(df) * 0.8)
            
        train_df = df.iloc[:split_idx]
        test_df = df.iloc[split_idx:]
        
        X_train = train_df[FEATURES]
        y_train = train_df["qty_sold"]
        
        X_test = test_df[FEATURES]
        y_test = test_df["qty_sold"]
        
        # Train the Model
        model = RandomForestRegressor(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)
        
        # Predict on Test Set
        predictions = model.predict(X_test)
        
        # Calculate MAPE
        # Adding a small epsilon to avoid division by zero if true qty_sold is 0
        mape = mean_absolute_percentage_error(y_test + 1e-10, predictions)
        mape_percentage = mape * 100
        
        overall_mapes.append(mape_percentage)
        
        print(f"{item:<20} | {len(test_df):<16} | {mape_percentage:.2f}%")
        
    print("-" * 50)
    if overall_mapes:
        print(f"{'OVERALL AVERAGE':<20} | {'-':<16} | {np.mean(overall_mapes):.2f}%")
        
if __name__ == "__main__":
    calculate_mape()
