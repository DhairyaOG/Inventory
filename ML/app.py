import os
import joblib
import pandas as pd
import certifi
import numpy as np
from flask import Flask, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from sklearn.ensemble import RandomForestRegressor
from datetime import datetime, timedelta
from urllib.parse import quote_plus

app = Flask(__name__)
CORS(app)

# 1. CONFIGURATION
username = quote_plus("aroradhairya314")
password = quote_plus("@123#")
MONGO_URI = f"mongodb+srv://{username}:{password}@items.xws9ags.mongodb.net/?appName=Items"

client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
db = client['restaurant_db']

MODEL_PATH = 'multi_item_model.pkl'

# 2. TRAIN LOGIC
def train_item_model(item_name):
    # Get sales for specific item
    cursor = db.sales.find({"item_name": item_name}, {'_id': 0, 'date': 1, 'qty_sold': 1})
    df = pd.DataFrame(list(cursor))
    
    if df.empty or len(df) < 10: return None

    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date')
    
    # Feature Engineering
    df['day_of_week'] = df['date'].dt.dayofweek
    df['is_weekend'] = df['day_of_week'].isin([4, 5, 6]).astype(int)
    df['sales_lag_7'] = df['qty_sold'].shift(7)
    df['rolling_mean_3'] = df['qty_sold'].shift(1).rolling(window=3).mean()
    df = df.dropna()
    
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    # Train only on the columns we will have in the future
    model.fit(df[['day_of_week', 'is_weekend']], df['qty_sold'])
    return model

@app.route('/train', methods=['POST'])
def train_all():
    items = db.sales.distinct("item_name")
    models = {}
    print(f"🔄 Found items: {items}")
    
    for item in items:
        print(f"   Training {item}...")
        model = train_item_model(item)
        if model:
            models[item] = model
            
    joblib.dump(models, MODEL_PATH)
    return jsonify({"status": "success", "message": f"Trained models for {list(models.keys())}"})

# 3. PREDICT LOGIC (The "Smart Order" System)
@app.route('/predict-orders', methods=['GET'])
def predict_orders():
    if not os.path.exists(MODEL_PATH):
        return jsonify({"error": "Models not trained. Run /train first."}), 500

    models = joblib.load(MODEL_PATH)
    today = datetime.now()
    
    # --- STEP A: Forecast Next 7 Days ---
    forecast_calendar = {}
    
    for day_offset in range(1, 31):
        future_date = today + timedelta(days=day_offset)
        date_str = future_date.strftime('%Y-%m-%d')
        
        # Simple inputs for prediction
        # (For V2, you would calculate real lag/rolling means here)
        day_features = pd.DataFrame([{
            'day_of_week': future_date.weekday(),
            'is_weekend': 1 if future_date.weekday() in [4, 5, 6] else 0
        }])

        daily_preds = {}
        for item, model in models.items():
            pred = int(model.predict(day_features)[0])
            daily_preds[item] = pred
        
        forecast_calendar[date_str] = daily_preds

    # --- STEP B: Calculate Lead Times ---
    todays_orders = []
    
    # Load Data
    all_ingredients = list(db.ingredients.find())
    all_recipes = list(db.recipes.find())
    
    # Create lookup map for recipes: {'Burger': [{'name': 'Bun', 'qty': 2}, ...]}
    recipe_map = {r['item_name']: r['ingredients'] for r in all_recipes}

    for ing_data in all_ingredients:
        ing_name = ing_data['name']
        lead_time = ing_data.get('lead_time', 1)
        current_stock = ing_data.get('stock', 0)
        
        # 1. Target Date
        arrival_date = today + timedelta(days=lead_time)
        arrival_date_str = arrival_date.strftime('%Y-%m-%d')
        
        # 2. Demand on Arrival Date
        total_needed_on_arrival = 0
        
        if arrival_date_str in forecast_calendar:
            sales_forecast = forecast_calendar[arrival_date_str] # e.g. {'Burger': 40, 'Pizza': 50}
            
            # Check if any menu item uses this ingredient
            for menu_item, predicted_sales in sales_forecast.items():
                if menu_item in recipe_map:
                    # Look for ingredient in this recipe
                    for ing in recipe_map[menu_item]:
                        if ing['name'] == ing_name:
                            # Math: Sales * Qty Per Item
                            total_needed_on_arrival += (predicted_sales * ing['qty'])

        # 3. Decision
        if current_stock < total_needed_on_arrival:
            qty_to_order = total_needed_on_arrival - current_stock
            status = "URGENT"
        else:
            qty_to_order = 0
            status = "OK"

        if qty_to_order > 0:
            todays_orders.append({
                "ingredient": ing_name,
                "lead_time_days": lead_time,
                "target_date": arrival_date_str,
                "needed_for_target": total_needed_on_arrival,
                "current_stock": current_stock,
                "order_qty": qty_to_order
            })

    return jsonify({
        "forecast": forecast_calendar,
        "shopping_list": todays_orders
    })

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 3900))
    app.run(host='0.0.0.0', port=port, debug=True)