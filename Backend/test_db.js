const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Recipe = require('./models/Recipe');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { dbName: 'restaurant_db' });
    console.log("Connected");
    const recipes = await Recipe.find();
    console.log("Found", recipes.length, "recipes");
  } catch(e) {
    console.error("Error:", e);
  } finally {
    mongoose.disconnect();
  }
}
run();
