import numpy as np
import pandas as pd
from pymongo import MongoClient
import certifi
from datetime import datetime, timedelta
from urllib.parse import quote_plus

# 1. DATABASE CONNECTION
username = quote_plus("aroradhairya314")
password = quote_plus("@123#") 
MONGO_URI = f"mongodb+srv://{username}:{password}@items.xws9ags.mongodb.net/?appName=Items"

client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
db = client['restaurant_db']
sales_collection = db['sales']

print("🌱 Generating 365 days of realistic sales history...")

# 2. CONFIGURATION
items = ["Burger", "Pizza"]
data = []
end_date = datetime.now()
start_date = end_date - timedelta(days=365)

# 3. GENERATE LOOP
for i in range(366):
    current_date = start_date + timedelta(days=i)
    day_of_week = current_date.weekday() # 0=Monday, 6=Sunday
    month = current_date.month
    
    # Is it a weekend? (Fri, Sat, Sun)
    is_weekend = day_of_week in [4, 5, 6]
    
    # SEASONALITY LOGIC (Make it smart!)
    # Summer (June/July) = Lower sales (people travel)
    # Winter (Dec) = Higher sales (holidays)
    season_multiplier = 1.0
    if month in [6, 7]: season_multiplier = 0.8
    if month == 12: season_multiplier = 1.3
    
    for item in items:
        # Base Sales Logic
        if item == "Burger":
            base = 40 if is_weekend else 25
        else: # Pizza
            base = 50 if is_weekend else 30
            
        # Apply Logic: Base * Seasonality * Random Noise
        # Noise = Randomly +/- 15% to look natural
        noise = np.random.uniform(0.85, 1.15)
        final_qty = int(base * season_multiplier * noise)
        
        # Add a random "Viral Day" (1% chance of huge sales)
        if np.random.rand() < 0.01:
            final_qty *= 2
            print(f"🚀 Viral spike on {current_date.date()} for {item}!")

        record = {
            "date": current_date,
            "qty_sold": final_qty,
            "item_name": item
        }
        data.append(record)

# 4. INSERT INTO MONGO
# Optional: Clear old data first so you don't have duplicates
sales_collection.delete_many({}) 

sales_collection.insert_many(data)

print(f"✅ Successfully inserted {len(data)} records for the last year.")
print("📊 Stats:")
print(f"   - Total Burgers Sold: {sum(d['qty_sold'] for d in data if d['item_name']=='Burger')}")
print(f"   - Total Pizzas Sold: {sum(d['qty_sold'] for d in data if d['item_name']=='Pizza')}")
print("\n🚀 Now run: 'curl -X POST http://localhost:3900/train' to make the AI learn this!")