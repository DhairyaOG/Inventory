import pymongo
from datetime import datetime, timedelta
import random
import certifi
from urllib.parse import quote_plus

# --- CONFIGURATION ---
# REPLACE THESE WITH YOUR EXACT CREDENTIALS
username = quote_plus("aroradhairya314")
password = quote_plus("@123#")
MONGO_URI = f"mongodb+srv://{username}:{password}@items.xws9ags.mongodb.net/?appName=Items"

print("🔌 Connecting to MongoDB...")
client = pymongo.MongoClient(MONGO_URI, tlsCAFile=certifi.where())
db = client['restaurant_db']

# --- 1. POPULATE INGREDIENTS (WITH INDUSTRIAL PRICES) ---
print("🍅 Seeding Ingredients & Prices...")
db.ingredients.delete_many({})

ingredients = [
    # unit_price = Price per 1 unit (e.g. per kg, per piece)
    {"name": "Bun", "stock": 50, "unit": "pcs", "lead_time": 2, "unit_price": 0.50},  # $0.50 per bun
    {"name": "Patty", "stock": 40, "unit": "pcs", "lead_time": 3, "unit_price": 1.50}, # $1.50 per patty
    {"name": "Tomato", "stock": 2000, "unit": "g", "lead_time": 1, "unit_price": 0.005}, # $5.00 per kg -> $0.005 per g
    {"name": "Cheese", "stock": 5000, "unit": "g", "lead_time": 3, "unit_price": 0.012}, # $12.00 per kg
    {"name": "Dough Ball", "stock": 30, "unit": "pcs", "lead_time": 2, "unit_price": 0.80},
    {"name": "Pizza Sauce", "stock": 3000, "unit": "ml", "lead_time": 4, "unit_price": 0.008},
    {"name": "Pepperoni", "stock": 1000, "unit": "g", "lead_time": 5, "unit_price": 0.025},
    {"name": "Lettuce", "stock": 800, "unit": "g", "lead_time": 1, "unit_price": 0.004},
    {"name": "Chicken Breast", "stock": 10, "unit": "kg", "lead_time": 2, "unit_price": 8.00}, # $8.00 per kg
    {"name": "Fries", "stock": 10, "unit": "kg", "lead_time": 3, "unit_price": 3.50},
]
db.ingredients.insert_many(ingredients)

# --- 2. POPULATE RECIPES (Just Selling Price) ---
print("📖 Seeding Recipes...")
db.recipes.delete_many({})

recipes = [
    {
        "item_name": "Burger",
        "category": "Fast Food",
        "price": 12.00,
        "ingredients": [
            {"name": "Bun", "qty": 1},
            {"name": "Patty", "qty": 1},
            {"name": "Tomato", "qty": 30},
            {"name": "Cheese", "qty": 20},
            {"name": "Lettuce", "qty": 10}
        ]
    },
    {
        "item_name": "Pizza",
        "category": "Italian",
        "price": 18.00,
        "ingredients": [
            {"name": "Dough Ball", "qty": 1},
            {"name": "Pizza Sauce", "qty": 100},
            {"name": "Cheese", "qty": 150},
            {"name": "Pepperoni", "qty": 50}
        ]
    },
    {
        "item_name": "Caesar Salad",
        "category": "Healthy",
        "price": 9.00,
        "ingredients": [
            {"name": "Lettuce", "qty": 150},
            {"name": "Chicken Breast", "qty": 0.2}, # Note: In ingredients this is kg, here 0.2 kg
            {"name": "Cheese", "qty": 10},
            {"name": "Tomato", "qty": 50}
        ]
    }
]
db.recipes.insert_many(recipes)

# --- 3. GENERATE 60 DAYS OF FAKE SALES HISTORY ---
print("📈 Generating 60 Days of Sales History (for AI Training)...")
db.sales.delete_many({})

sales_data = []
end_date = datetime.now()
start_date = end_date - timedelta(days=60)

current_date = start_date
while current_date <= end_date:
    # Logic: Weekends are busier
    day_of_week = current_date.weekday() # 0=Mon, 6=Sun
    is_weekend = day_of_week >= 4 
    
    # Random sales volume based on day
    burger_sales = random.randint(40, 60) if is_weekend else random.randint(20, 35)
    pizza_sales = random.randint(35, 55) if is_weekend else random.randint(15, 30)
    salad_sales = random.randint(15, 25) # Stable demand
    
    sales_data.append({"date": current_date, "item_name": "Burger", "qty_sold": burger_sales})
    sales_data.append({"date": current_date, "item_name": "Pizza", "qty_sold": pizza_sales})
    sales_data.append({"date": current_date, "item_name": "Caesar Salad", "qty_sold": salad_sales})
    
    current_date += timedelta(days=1)

db.sales.insert_many(sales_data)

print("✅ Database Populated Successfully!")
print(f"   - {len(ingredients)} Ingredients Added")
print(f"   - {len(recipes)} Recipes Added")
print(f"   - {len(sales_data)} Sales Records Added")