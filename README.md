# Pantri - AI-Powered Restaurant Management System

Pantri is a modern, full-stack restaurant management application designed to handle inventory tracking, recipe management, sales analytics, and staff administration. It features a cutting-edge **AI Assistant (Pantri AI)** that acts as a virtual manager, answering complex questions about sales history, ingredient stock, and menu items using Retrieval-Augmented Generation (RAG).

## 🚀 Features

- **Inventory Management**: Track stock levels, ingredient costs, and lead times.
- **Recipe Engine**: Manage menu items, their required ingredients, and calculate profit margins.
- **Sales Tracking**: Record daily sales and track lifetime historical performance.
- **Role-Based Access**: Secure JWT authentication for Managers and Waitstaff.
- **Pantri AI (RAG Chatbot)**: 
  - Chat with your database in real-time.
  - Powered by **Google Gemini 3.5 Flash** and **ChromaDB**.
  - Automatically syncs with MongoDB to know your current stock, recipes, sales, and staff.
- **AI Sales Predictions**: Uses machine learning lag features to forecast future orders.

## 🛠 Tech Stack

The project is split into three main microservices:

1. **Frontend (`/Frontend`)**
   - React + Vite
   - Tailwind CSS for modern styling
   - Recharts for data visualization
   - Deployed on **Vercel**

2. **Backend (`/Backend`)**
   - Node.js + Express.js
   - MongoDB + Mongoose (Database)
   - JWT for Authentication
   - Optimized for **Vercel Serverless Functions** (Connection pooling)

3. **ML Service (`/ML`)**
   - Python 3 + Flask
   - LangChain + ChromaDB (Vector Database)
   - Google Generative AI (`gemini-3.5-flash` and `gemini-embedding-2`)
   - Deployed on **Render**

## ⚙️ Local Development

### 1. Database Setup
You will need a MongoDB Atlas cluster. Create one and get your connection string.

### 2. Backend Setup
```bash
cd Backend
npm install
```
Create a `.env` file in the `Backend` directory:
```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster...
JWT_SECRET=your_jwt_secret
```
Run the server:
```bash
npm run dev
```

### 3. ML Service Setup
```bash
cd ML
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```
Create a `.env` file in the `ML` directory:
```env
MONGO_URI=mongodb+srv://<user>:<password>@cluster...
GEMINI_API_KEY=your_google_gemini_api_key
API_SECRET_KEY=your_sync_secret_key # e.g. "abc"
```
Run the Flask server:
```bash
python app.py
```

### 4. Frontend Setup
```bash
cd Frontend
npm install
```
Create a `.env` file in the `Frontend` directory:
```env
VITE_API_SECRET_KEY=your_sync_secret_key # Must match the ML API_SECRET_KEY
```
Run the React app:
```bash
npm run dev
```

## 🤖 How Pantri AI Works

Pantri AI uses **Retrieval-Augmented Generation (RAG)**. 
When the chat is opened, the frontend triggers a sync (`/sync-db` on the ML server). The Python server fetches the latest Inventory, Sales history, Menu Recipes, and Staff from MongoDB, converts them into high-dimensional vector embeddings using Google's `gemini-embedding-2`, and stores them in ChromaDB. 

When a user asks a question, ChromaDB retrieves the most mathematically relevant data chunks and feeds them into `gemini-3.5-flash` to generate a highly accurate, context-aware answer.
