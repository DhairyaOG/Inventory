import os
import logging
import joblib
import pandas as pd
import certifi
import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, OperationFailure
from sklearn.ensemble import RandomForestRegressor
from datetime import datetime, timedelta
from urllib.parse import quote_plus
from dotenv import load_dotenv
from functools import wraps

# ─────────────────────────────────────────────
# 0. LOGGING SETUP
# ─────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────
# 1. CONFIGURATION
# ─────────────────────────────────────────────
load_dotenv()  # Load from .env file

MONGO_USERNAME = os.getenv("MONGO_USERNAME")
MONGO_PASSWORD = os.getenv("MONGO_PASSWORD")
MONGO_CLUSTER  = os.getenv("MONGO_CLUSTER", "items.xws9ags.mongodb.net")
MONGO_APP_NAME = os.getenv("MONGO_APP_NAME", "Items")
API_SECRET_KEY = os.getenv("API_SECRET_KEY", "change-me-in-production")  # For /train protection
ALLOWED_ORIGIN = os.getenv("ALLOWED_ORIGIN", "*")  # Set to your frontend URL in production
MODEL_PATH     = os.getenv("MODEL_PATH", "multi_item_model.pkl")

if not MONGO_USERNAME or not MONGO_PASSWORD:
    raise EnvironmentError("❌ MONGO_USERNAME and MONGO_PASSWORD must be set in .env")

MONGO_URL = (
    f"mongodb+srv://{quote_plus(MONGO_USERNAME)}:{quote_plus(MONGO_PASSWORD)}"
    f"@{MONGO_CLUSTER}/?appName={MONGO_APP_NAME}"
)

# ─────────────────────────────────────────────
# 2. FLASK APP SETUP
# ─────────────────────────────────────────────
app = Flask(__name__)
CORS(app, origins=[ALLOWED_ORIGIN])  # Restrict CORS to your frontend only

# ─────────────────────────────────────────────
# 3. DATABASE CONNECTION (with error handling)
# ─────────────────────────────────────────────
try:
    client = MongoClient(MONGO_URL, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=5000)
    client.admin.command("ping")  # Test connection at startup
    db = client["restaurant_db"]
    logger.info("✅ Connected to MongoDB")
except ConnectionFailure as e:
    logger.error(f"❌ MongoDB connection failed: {e}")
    raise

# ─────────────────────────────────────────────
# 4. LOAD MODEL ONCE AT STARTUP (not per request)
# ─────────────────────────────────────────────
trained_models = {}
if os.path.exists(MODEL_PATH):
    try:
        trained_models = joblib.load(MODEL_PATH)
        logger.info(f"✅ Loaded models for: {list(trained_models.keys())}")
    except Exception as e:
        logger.warning(f"⚠️ Could not load model file: {e}")

# ─────────────────────────────────────────────
# 5. AUTH DECORATOR (protect /train endpoint)
# ─────────────────────────────────────────────
def require_api_key(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        key = request.headers.get("X-API-Key")
        if key != API_SECRET_KEY:
            logger.warning("⚠️ Unauthorized /train attempt")
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return decorated

# ─────────────────────────────────────────────
# 6. TRAIN LOGIC (Fixed feature engineering)
# ─────────────────────────────────────────────
FEATURES = ['day_of_week', 'is_weekend', 'sales_lag_7', 'rolling_mean_3']

def train_item_model(item_name):
    """Train a RandomForest model for a single menu item."""
    try:
        cursor = db.sales.find(
            {"item_name": item_name},
            {"_id": 0, "date": 1, "qty_sold": 1}
        )
        df = pd.DataFrame(list(cursor))
    except OperationFailure as e:
        logger.error(f"DB error fetching sales for {item_name}: {e}")
        return None

    if df.empty or len(df) < 10:
        logger.warning(f"⚠️ Not enough data for {item_name} (need ≥10 rows, got {len(df)})")
        return None

    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date").reset_index(drop=True)

    # Feature Engineering
    df["day_of_week"]    = df["date"].dt.dayofweek
    df["is_weekend"]     = df["day_of_week"].isin([4, 5, 6]).astype(int)
    df["sales_lag_7"]    = df["qty_sold"].shift(7)
    df["rolling_mean_3"] = df["qty_sold"].shift(1).rolling(window=3).mean()
    df = df.dropna()

    if len(df) < 5:
        logger.warning(f"⚠️ After feature engineering, too few rows for {item_name}")
        return None

    # FIX: Use ALL engineered features (not just 2)
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(df[FEATURES], df["qty_sold"])

    # Store last known lag values for future predictions
    model.last_lag_7         = df["qty_sold"].iloc[-7:].tolist()
    model.last_rolling_mean3 = df["rolling_mean_3"].iloc[-1]

    logger.info(f"✅ Trained model for {item_name}")
    return model


# ─────────────────────────────────────────────
# 7. PREDICT HELPER (uses lag features properly)
# ─────────────────────────────────────────────
def build_day_features(future_date, model):
    """Build feature row for a future date using stored lag values."""
    lag_7 = model.last_lag_7[-7] if len(model.last_lag_7) >= 7 else np.mean(model.last_lag_7)
    rolling_mean = model.last_rolling_mean3

    return pd.DataFrame([{
        "day_of_week":    future_date.weekday(),
        "is_weekend":     1 if future_date.weekday() in [4, 5, 6] else 0,
        "sales_lag_7":    lag_7,
        "rolling_mean_3": rolling_mean,
    }])


# ─────────────────────────────────────────────
# 8. ROUTES
# ─────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint for monitoring."""
    return jsonify({
        "status": "ok",
        "models_loaded": list(trained_models.keys()),
        "timestamp": datetime.now().isoformat()
    })


@app.route("/train", methods=["POST"])
@require_api_key  # 🔐 Protected — pass X-API-Key header
def train_all():
    """Train models for all items in the sales collection."""
    global trained_models

    try:
        items = db.sales.distinct("item_name")
    except OperationFailure as e:
        logger.error(f"DB error: {e}")
        return jsonify({"error": "Database error"}), 500

    if not items:
        return jsonify({"error": "No items found in sales collection"}), 404

    logger.info(f"🔄 Training models for: {items}")
    new_models = {}

    for item in items:
        model = train_item_model(item)
        if model:
            new_models[item] = model

    if not new_models:
        return jsonify({"error": "No models could be trained. Check your data."}), 500

    joblib.dump(new_models, MODEL_PATH)
    trained_models = new_models  # Update in-memory models

    logger.info(f"✅ Training complete for: {list(new_models.keys())}")
    return jsonify({
        "status": "success",
        "trained_items": list(new_models.keys()),
        "skipped_items": [i for i in items if i not in new_models]
    })


@app.route("/predict-orders", methods=["GET"])
def predict_orders():
    """Predict demand and generate a smart shopping list."""
    if not trained_models:
        return jsonify({"error": "Models not trained. POST to /train first."}), 400

    today = datetime.now()

    # ── STEP A: Forecast Next 30 Days ──
    forecast_calendar = {}

    for day_offset in range(1, 31):
        future_date = today + timedelta(days=day_offset)
        date_str = future_date.strftime("%Y-%m-%d")

        daily_preds = {}
        for item, model in trained_models.items():
            try:
                features = build_day_features(future_date, model)
                pred = max(0, int(model.predict(features)[0]))  # No negative predictions
                daily_preds[item] = pred
            except Exception as e:
                logger.warning(f"Prediction failed for {item} on {date_str}: {e}")
                daily_preds[item] = 0

        forecast_calendar[date_str] = daily_preds

    # ── STEP B: Load Ingredients & Recipes ──
    try:
        all_ingredients = list(db.ingredients.find({}, {"_id": 0}))
        all_recipes     = list(db.recipes.find({}, {"_id": 0}))
    except OperationFailure as e:
        logger.error(f"DB error loading ingredients/recipes: {e}")
        return jsonify({"error": "Database error"}), 500

    recipe_map = {r["item_name"]: r["ingredients"] for r in all_recipes}

    # ── STEP C: Calculate Orders ──
    todays_orders = []

    for ing_data in all_ingredients:
        ing_name      = ing_data.get("name")
        lead_time     = ing_data.get("lead_time", 1)
        current_stock = ing_data.get("stock", 0)
        unit          = ing_data.get("unit", "units")

        arrival_date     = today + timedelta(days=lead_time)
        arrival_date_str = arrival_date.strftime("%Y-%m-%d")

        total_needed = 0

        if arrival_date_str in forecast_calendar:
            for menu_item, predicted_sales in forecast_calendar[arrival_date_str].items():
                if menu_item in recipe_map:
                    for ing in recipe_map[menu_item]:
                        if ing["name"] == ing_name:
                            total_needed += predicted_sales * ing["qty"]

        if current_stock < total_needed:
            qty_to_order = total_needed - current_stock
            todays_orders.append({
                "ingredient":        ing_name,
                "unit":              unit,
                "lead_time_days":    lead_time,
                "target_date":       arrival_date_str,
                "needed_for_target": total_needed,
                "current_stock":     current_stock,
                "order_qty":         qty_to_order,
                "status":            "URGENT" if lead_time <= 1 else "ORDER"
            })

    todays_orders.sort(key=lambda x: x["lead_time_days"])  # Urgent first

    logger.info(f"📦 Generated {len(todays_orders)} order recommendations")
    return jsonify({
        "generated_at":  today.isoformat(),
        "forecast_days": 30,
        "forecast":      forecast_calendar,
        "shopping_list": todays_orders,
        "total_items_to_order": len(todays_orders)
    })


# ─────────────────────────────────────────────
# 9. ERROR HANDLERS
# ─────────────────────────────────────────────
@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Route not found"}), 404

@app.errorhandler(500)
def server_error(e):
    logger.error(f"Server error: {e}")
    return jsonify({"error": "Internal server error"}), 500


# ─────────────────────────────────────────────
# 10. RUN
# ─────────────────────────────────────────────
if __name__ == "__main__":
    port  = int(os.environ.get("PORT", 3900))
    debug = os.environ.get("DEBUG", "false").lower() == "true"  # FIX: debug=False in production
    logger.info(f"🚀 Starting server on port {port} | debug={debug}")
    app.run(host="0.0.0.0", port=port, debug=debug)