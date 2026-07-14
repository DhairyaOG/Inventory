// config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      dbName: 'restaurant_db',
      serverSelectionTimeoutMS: 5000 // Fail fast if DB isn't reachable
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📂 Using Database: ${conn.connection.name}`); 
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // process.exit(1); // Removed: Do not exit process in serverless environments
  }
};

module.exports = connectDB;