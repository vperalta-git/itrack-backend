const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

console.log('🚀 Starting I-Track Mobile Backend Server...');

const app = express();

// ================== API CONFIGURATION ==================
const API_CONFIG = {
  // Development/Local Backend (current server)
  LOCAL_BACKEND: {
    BASE_URL: 'http://192.168.254.147:5000',
    NAME: 'Local Development Backend'
  },
  
  // Production Render Backend
  RENDER_BACKEND: {
    BASE_URL: 'https://itrack-backend-1.onrender.com',
    NAME: 'Render Production Backend'
  }
};

// Current active backend (this server)
const ACTIVE_BACKEND = API_CONFIG.LOCAL_BACKEND;

// API endpoints mapping
const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/login',
  LOGOUT: '/logout',
  CHECK_AUTH: '/checkAuth',
  
  // Users
  GET_USERS: '/getUsers',
  CREATE_USER: '/createUser',
  DELETE_USER: '/deleteUser',
  UPDATE_USER: '/updateUser',
  
  // Driver Allocations
  GET_ALLOCATION: '/getAllocation',
  CREATE_ALLOCATION: '/createAllocation',
  
  // Service Requests
  GET_REQUEST: '/getRequest',
  CREATE_REQUEST: '/createRequest',
  GET_COMPLETED_REQUESTS: '/getCompletedRequests',
  
  // Inventory/Stock
  GET_STOCK: '/getStock',
  CREATE_STOCK: '/createStock',
  
  // Password Reset
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password'
};

console.log(`📱 API Server: ${ACTIVE_BACKEND.NAME}`);
console.log(`🔗 Base URL: ${ACTIVE_BACKEND.BASE_URL}`);

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

// MongoDB connection
const mongoURI = process.env.MONGODB_URI || 
  'mongodb+srv://itrack_user:itrack123@cluster0.py8s8pl.mongodb.net/itrackDB?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB Atlas'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// ================== SCHEMAS (Original Working Versions) ==================

// User Schema
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  accountName: { type: String, required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

// Driver Allocation Schema
const DriverAllocationSchema = new mongoose.Schema({
  unitName: String,
  conductionNumber: String, 
  unitId: String,
  bodyColor: String,
  variation: String,
  assignedDriver: String,
  status: String,
  date: { type: Date, default: Date.now },
  allocatedBy: String,
}, { timestamps: true });

// Inventory Schema  
const InventorySchema = new mongoose.Schema({
  unitName: String,
  unitId: String,
  bodyColor: String,
  variation: String,
  quantity: { type: Number, default: 1 },
}, { timestamps: true });

// Vehicle Stock Schema
const VehicleStockSchema = new mongoose.Schema({
  unitName: String,
  bodyColor: String,
  variation: String,
  unitId: String,
}, { timestamps: true });

// Service Request Schema
const ServiceRequestSchema = new mongoose.Schema({
  dateCreated: Date,
  vehicleRegNo: String,
  service: Array,
  status: String,
  inProgressAt: Date,
  completedAt: Date,
  serviceDurationMinutes: Number,
  preparedBy: String,
}, { timestamps: true });

// Completed Request Schema
const CompletedRequestSchema = new mongoose.Schema({
  dateCreated: Date,
  vehicleRegNo: String,
  service: Array,
  status: String,
  inProgressAt: Date,
  completedAt: Date,
  serviceDurationMinutes: Number,
  preparedBy: String,
}, { timestamps: true });

// ================== MODELS ==================
const User = mongoose.model('User', UserSchema);
const DriverAllocation = mongoose.model('DriverAllocation', DriverAllocationSchema);
const Inventory = mongoose.model('Inventory', InventorySchema);
const VehicleStock = mongoose.model('VehicleStock', VehicleStockSchema);
const ServiceRequest = mongoose.model('ServiceRequest', ServiceRequestSchema);
const CompletedRequest = mongoose.model('CompletedRequest', CompletedRequestSchema);

// ================== MOBILE APP ROUTES (Original Working) ==================

// API Configuration endpoint - provides config to mobile app
app.get('/api/config', (req, res) => {
  res.json({
    success: true,
    config: {
      backend: ACTIVE_BACKEND,
      endpoints: API_ENDPOINTS,
      serverInfo: {
        name: 'I-Track Mobile Backend',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      }
    }
  });
});

// Login endpoint
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('📥 Login attempt:', username);
    
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password required' });
    }

    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        username: user.username,
        role: user.role,
        accountName: user.accountName,
        assignedTo: user.assignedTo
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get Users
app.get('/getUsers', async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    console.log(`📊 Found ${users.length} users`);
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('❌ Get users error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Driver Allocations
app.get('/getAllocation', async (req, res) => {
  try {
    const allocations = await DriverAllocation.find({}).sort({ createdAt: -1 });
    console.log(`📊 Found ${allocations.length} allocations`);
    res.json({ success: true, data: allocations });
  } catch (error) {
    console.error('❌ Get allocations error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create Driver Allocation
app.post('/createAllocation', async (req, res) => {
  try {
    const { unitName, unitId, bodyColor, variation, assignedDriver, status, allocatedBy } = req.body;
    
    const newAllocation = new DriverAllocation({
      unitName,
      unitId,
      bodyColor,
      variation,
      assignedDriver,
      status: status || 'Pending',
      allocatedBy: allocatedBy || 'Admin',
      date: new Date()
    });

    await newAllocation.save();
    console.log('✅ Created allocation:', newAllocation.unitName);
    res.json({ success: true, message: 'Allocation created successfully', data: newAllocation });
  } catch (error) {
    console.error('❌ Create allocation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Stock/Inventory
app.get('/getStock', async (req, res) => {
  try {
    const inventory = await Inventory.find({}).sort({ createdAt: -1 });
    console.log(`📊 Found ${inventory.length} inventory items`);
    res.json({ success: true, data: inventory });
  } catch (error) {
    console.error('❌ Get stock error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create Stock
app.post('/createStock', async (req, res) => {
  try {
    const { unitName, unitId, bodyColor, variation, quantity } = req.body;
    
    const newStock = new Inventory({
      unitName,
      unitId,
      bodyColor,
      variation,
      quantity: quantity || 1
    });

    await newStock.save();
    console.log('✅ Created stock:', newStock.unitName);
    res.json({ success: true, message: 'Stock created successfully', data: newStock });
  } catch (error) {
    console.error('❌ Create stock error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Service Requests
app.get('/getRequest', async (req, res) => {
  try {
    const requests = await ServiceRequest.find({}).sort({ createdAt: -1 });
    console.log(`📊 Found ${requests.length} service requests`);
    res.json({ success: true, data: requests });
  } catch (error) {
    console.error('❌ Get requests error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Completed Requests
app.get('/getCompletedRequests', async (req, res) => {
  try {
    const completed = await CompletedRequest.find({}).sort({ completedAt: -1 });
    console.log(`📊 Found ${completed.length} completed requests`);
    res.json({ success: true, data: completed });
  } catch (error) {
    console.error('❌ Get completed requests error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Dashboard Stats (for reports)
app.get('/dashboard/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalAllocations = await DriverAllocation.countDocuments();
    const activeAllocations = await DriverAllocation.countDocuments({ status: 'In Transit' });
    const totalStock = await Inventory.countDocuments();
    
    console.log(`📊 Dashboard stats - Users: ${totalUsers}, Allocations: ${totalAllocations}, Stock: ${totalStock}`);
    
    res.json({
      success: true,
      data: {
        totalUsers,
        totalAllocations,
        activeAllocations,
        totalStock,
        totalVehicles: totalStock,
        totalDrivers: await User.countDocuments({ role: 'Driver' }),
        totalAgents: await User.countDocuments({ role: 'Sales Agent' })
      }
    });
  } catch (error) {
    console.error('❌ Dashboard stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ success: true, message: 'Mobile backend server is running!' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ================== START SERVER ==================
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Mobile Backend Server running on port ${PORT}`);
  console.log('� Available endpoints:');
  console.log('  - POST /login');
  console.log('  - GET  /getUsers');
  console.log('  - GET  /getAllocation');
  console.log('  - POST /createAllocation');
  console.log('  - GET  /getStock');
  console.log('  - POST /createStock');
  console.log('  - GET  /getRequest');
  console.log('  - GET  /getCompletedRequests');
  console.log('  - GET  /dashboard/stats');
  console.log('  - GET  /test');
  console.log('  - GET  /health');
  console.log('✅ Ready for mobile app connections!');
});

// Error handling
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err.message);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
});
