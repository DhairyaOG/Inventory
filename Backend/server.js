const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// 1. Load environment variables first
dotenv.config();

// 2. Initialize the Express app
const app = express();

// 3. Connect to Database
connectDB();

// 4. Configure and apply CORS
const corsOptions = {
  origin: [
    'http://localhost:5173',    // Local development
    'https://pantri.co.in',    
    'https://www.pantri.co.in'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions)); 

// 5. Other Middleware
app.use(express.json()); // Parse JSON bodies

// 6. Routes
app.use('/api/auth', require('./routes/authRoutes')); // ✅ NEW: Auth routes
app.use('/api', require('./routes/api'));

// Root endpoint
app.get('/', (req, res) => {
  res.send('Pantri Node API with JWT Auth is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Node Server running on port ${PORT}`);
  console.log(`🔐 JWT Authentication enabled`);
});