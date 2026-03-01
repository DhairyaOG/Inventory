const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors()); // Allow frontend to talk to backend
app.use(express.json()); // Parse JSON bodies

// Routes
app.use('/api', require('./routes/api'));

// Root endpoint
app.get('/', (req, res) => {
  res.send('Pantri Node API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Node Server running on port ${PORT}`);
});