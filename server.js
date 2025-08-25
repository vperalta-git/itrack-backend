console.log('📂 Loading server.js file...');
//sss
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

console.log('🚀 Starting I-Track Backend Server...');

const app = express();

// Enable CORS for all origins (adjust if needed)
app.use(cors());
app.use(express.json());

// MongoDB connection string
const mongoURI =
  process.env.MONGODB_URI ||
  'mongodb+srv://itrack_user:itrack123@cluster0.py8s8pl.mongodb.net/itrackDB?retryWrites=true&w=majority&appName=Cluster0';

console.log('🔌 Connecting to MongoDB...');
console.log('MongoDB URI:', mongoURI ? 'Set' : 'Not set');

// Connect to MongoDB Atlas
mongoose
  .connect(mongoURI, {
    serverSelectionTimeoutMS: 10000, // 10 seconds
    connectTimeoutMS: 10000, // 10 seconds
  })
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('⚠️ Starting server without MongoDB connection...');
  });

// ================== SCHEMAS ==================
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['Admin', 'Supervisor', 'Manager', 'Sales Agent', 'Driver', 'Dispatch'],
    default: 'Sales Agent',
  },
  accountName: { type: String, required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

const VehicleSchema = new mongoose.Schema({
  vin: String,
  unitId: String,
  model: String,
  driver: String,
  current_status: String,
  requested_processes: [String],
  preparation_status: {
    tinting: { type: Boolean, default: false },
    carwash: { type: Boolean, default: false },
    ceramic_coating: { type: Boolean, default: false },
    accessories: { type: Boolean, default: false },
    rust_proof: { type: Boolean, default: false },
    ready_for_release: { type: Boolean, default: false },
  },
  location: { lat: Number, lng: Number },
  customer_name: String,
  customer_number: String,
});

const VehicleStockSchema = new mongoose.Schema(
  {
    unitName: String,
    conductionNumber: String,
    unitId: String,
    bodyColor: String,
    variation: String,
  },
  { timestamps: true }
);

const VehiclePreparationSchema = new mongoose.Schema(
  {
    dateCreated: Date,
    vehicleRegNo: String,
    service: [{ serviceTime: String, status: String }],
    status: String,
  },
  { timestamps: true }
);

const DriverAllocationSchema = new mongoose.Schema(
  {
    unitName: String,
    conductionNumber: String,
    unitId: String,
    bodyColor: String,
    variation: String,
    assignedDriver: String,
    status: String,
    date: Date,
  },
  { timestamps: true }
);

// ================== MODELS ==================
const User = mongoose.model('User', UserSchema);
const Vehicle = mongoose.model('Vehicle', VehicleSchema);
const VehicleStock = mongoose.model('VehicleStock', VehicleStockSchema);
const VehiclePreparation = mongoose.model('VehiclePreparation', VehiclePreparationSchema);
const DriverAllocation = mongoose.model('DriverAllocation', DriverAllocationSchema);

// ================== ROUTES ==================

// === AUTH ===
app.post('/login', async (req, res) => {
  try {
    let { username, password, role } = req.body;
    console.log('📥 Login Attempt:', { username, password: '***', role });

    if (!username || !password) {
      return res
        .status(400)
        .json({ success: false, message: 'Username and password are required' });
    }

    username = username.toLowerCase().trim();
    console.log('🔍 Searching for user:', username);

    // Try both lowercase and original case
    let user = await User.findOne({ username });
    if (!user) {
      // Try with original case if lowercase doesn't work
      user = await User.findOne({ username: req.body.username.trim() });
    }
    console.log('👤 User found:', user ? `Yes - Role: ${user.role}` : 'No');
    
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    console.log('🔐 Password check:', password === user.password ? 'Match' : 'No match');
    if (password !== user.password)
      return res.status(401).json({ success: false, message: 'Invalid password' });

    if (role && user.role !== role) {
      console.log('🚫 Role mismatch:', { expected: role, actual: user.role });
      return res
        .status(403)
        .json({ success: false, message: `Access denied for role: ${role}` });
    }

    console.log('✅ Login successful for:', user.accountName || user.username);
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        username: user.username,
        role: user.role,
        accountName: user.accountName,
        assignedTo: user.assignedTo,
      },
    });
  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// === USER MANAGEMENT ===
app.post('/admin/create-user', async (req, res) => {
  try {
    const { username, password, role, assignedTo, accountName } = req.body;
    if (!username || !password || !role || !accountName) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const newUser = new User({
      username: username.toLowerCase().trim(),
      password,
      role,
      assignedTo,
      accountName,
    });

    await newUser.save();
    res.json({ success: true, message: 'User created successfully', user: newUser });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }
    res.status(500).json({ success: false, message: 'Error creating user', error: err.message });
  }
});

// === GET ALL USERS ===
app.get('/admin/users', async (req, res) => {
  try {
    const users = await User.find({}, '-password'); // Exclude password from response
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching users', error: err.message });
  }
});

// === GET MANAGERS ===
app.get('/admin/managers', async (req, res) => {
  try {
    const managers = await User.find({ role: 'Manager' }, '-password');
    res.json({ success: true, managers });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching managers', error: err.message });
  }
});

// === VEHICLES ===
app.get('/vehicles', async (req, res) => {
  try {
    const vehicles = await Vehicle.find({});
    res.json({ success: true, vehicles });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// === POST VEHICLES ===
app.post('/vehicles', async (req, res) => {
  try {
    const vehicleData = req.body;
    
    // Check if vehicle already exists
    const existingVehicle = await Vehicle.findOne({ vin: vehicleData.vin });
    if (existingVehicle) {
      // Update existing vehicle
      const updatedVehicle = await Vehicle.findOneAndUpdate(
        { vin: vehicleData.vin },
        vehicleData,
        { new: true }
      );
      res.json({ success: true, vehicle: updatedVehicle });
    } else {
      // Create new vehicle
      const newVehicle = new Vehicle(vehicleData);
      await newVehicle.save();
      res.json({ success: true, vehicle: newVehicle });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// === GET VEHICLE BY UNIT ID ===
app.get('/vehicles/unit/:unitId', async (req, res) => {
  try {
    // Decode the unitId to handle spaces and special characters
    const unitId = decodeURIComponent(req.params.unitId);
    console.log(`[VEHICLES] Searching for vehicle with unitId: ${unitId}`);
    
    // Mock vehicle data for now since we don't have real vehicle data
    const mockVehicle = {
      unitId: unitId,
      location: {
        lat: 14.5995 + (Math.random() - 0.5) * 0.01, // Manila area with slight variation
        lng: 120.9842 + (Math.random() - 0.5) * 0.01
      },
      status: 'active',
      lastUpdate: new Date().toISOString()
    };
    
    console.log(`[VEHICLES] Returning mock vehicle data for ${unitId}`);
    res.json(mockVehicle);
  } catch (err) {
    console.error(`[VEHICLES] Error fetching vehicle ${req.params.unitId}:`, err);
    res.status(500).json({ error: err.message });
  }
});

// === GET VEHICLE BY ID ===
app.get('/vehicles/:id', async (req, res) => {
  try {
    const id = decodeURIComponent(req.params.id);
    console.log(`[VEHICLES] Getting vehicle ${id}`);
    
    // Mock response for vehicle get
    res.json({ 
      success: true, 
      message: 'Vehicle found',
      vehicleId: id 
    });
  } catch (err) {
    console.error(`[VEHICLES] Error getting vehicle ${req.params.id}:`, err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// === PATCH VEHICLE LOCATION ===
app.patch('/vehicles/:id', async (req, res) => {
  try {
    const id = decodeURIComponent(req.params.id);
    const { location } = req.body;
    console.log(`[VEHICLES] Updating vehicle ${id} location:`, location);
    
    // Mock response for vehicle location update
    res.json({ 
      success: true, 
      message: 'Vehicle location updated',
      vehicleId: id,
      location: location
    });
  } catch (err) {
    console.error(`[VEHICLES] Error updating vehicle ${req.params.id}:`, err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// === DRIVER ALLOCATIONS ===
app.get('/driver-allocations', async (req, res) => {
  try {
    const allocations = await DriverAllocation.find({});
    res.json({ success: true, data: allocations });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// === POST DRIVER ALLOCATIONS ===
app.post('/driver-allocations', async (req, res) => {
  try {
    const allocationData = req.body;
    const newAllocation = new DriverAllocation(allocationData);
    await newAllocation.save();
    res.json({ success: true, data: newAllocation });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// === VEHICLE STOCKS ===
app.get('/vehicle-stocks', async (req, res) => {
  try {
    console.log('[VEHICLE-STOCKS] Fetching vehicle stocks from database...');
    
    // Fetch real data from MongoDB vehiclestocks collection
    const vehicleStocks = await VehicleStock.find({}).sort({ createdAt: -1 });
    
    console.log(`[VEHICLE-STOCKS] Found ${vehicleStocks.length} vehicle stocks`);
    
    // Transform data to include additional fields that the frontend expects
    const transformedStocks = vehicleStocks.map(stock => ({
      _id: stock._id,
      unitName: stock.unitName,
      conductionNumber: stock.conductionNumber || stock.unitId || 'N/A',
      unitId: stock.unitId || stock.unitName,
      bodyColor: stock.bodyColor,
      variation: stock.variation,
      status: stock.status || 'Available',
      createdAt: stock.createdAt,
      updatedAt: stock.updatedAt
    }));

    res.json({ 
      success: true, 
      data: transformedStocks,
      count: transformedStocks.length
    });
  } catch (err) {
    console.error('[VEHICLE-STOCKS] Error fetching vehicle stocks:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/vehicle-stocks', async (req, res) => {
  try {
    const stockData = req.body;
    console.log('[VEHICLE-STOCKS] Adding new stock:', stockData);
    
    // Validate required fields
    if (!stockData.unitName || !stockData.bodyColor || !stockData.variation) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: unitName, bodyColor, and variation are required'
      });
    }
    
    // Create new vehicle stock in database
    const newStock = new VehicleStock({
      unitName: stockData.unitName,
      conductionNumber: stockData.conductionNumber,
      unitId: stockData.unitId || stockData.unitName,
      bodyColor: stockData.bodyColor,
      variation: stockData.variation
    });
    
    const savedStock = await newStock.save();
    console.log('[VEHICLE-STOCKS] Successfully saved stock:', savedStock._id);
    
    res.json({ 
      success: true, 
      data: {
        _id: savedStock._id,
        unitName: savedStock.unitName,
        conductionNumber: savedStock.conductionNumber,
        unitId: savedStock.unitId,
        bodyColor: savedStock.bodyColor,
        variation: savedStock.variation,
        status: 'Available',
        createdAt: savedStock.createdAt,
        updatedAt: savedStock.updatedAt
      }
    });
  } catch (err) {
    console.error('[VEHICLE-STOCKS] Error adding stock:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// === VEHICLE PREPARATIONS ===
app.get('/vehicle-preparations', async (req, res) => {
  try {
    // Mock data for vehicle preparations
    const mockPreps = [
      {
        _id: '1',
        unitId: 'FJ 3577',
        prepType: 'Basic Inspection',
        status: 'In Progress',
        assignedTechnician: 'Tech 1',
        startDate: new Date().toISOString(),
        estimatedCompletion: new Date(Date.now() + 24*60*60*1000).toISOString()
      },
      {
        _id: '2',
        unitId: 'FJ 3578',
        prepType: 'Full Service',
        status: 'Completed',
        assignedTechnician: 'Tech 2',
        startDate: new Date(Date.now() - 48*60*60*1000).toISOString(),
        completedDate: new Date().toISOString()
      }
    ];
    res.json({ success: true, data: mockPreps });
  } catch (err) {
    console.error('[VEHICLE-PREP] Error fetching vehicle preparations:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// === DASHBOARD STATS ===
app.get('/dashboard/stats', async (req, res) => {
  try {
    const totalStocks = await VehicleStock.countDocuments();
    const finishedVehiclePreps = await VehiclePreparation.countDocuments({ status: 'Completed' });
    const ongoingShipments = await DriverAllocation.countDocuments({ status: 'In Transit' });
    const ongoingVehiclePreps = await VehiclePreparation.countDocuments({ status: 'In Progress' });
    const recentVehiclePreps = await VehiclePreparation.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    });

    res.json({
      totalStocks,
      finishedVehiclePreps,
      ongoingShipments,
      ongoingVehiclePreps,
      recentVehiclePreps,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// === ROOT ROUTE (for Render health check) ===
app.get('/', (req, res) => {
  res.send('I-Track Backend is running 🚀');
});

// === TEST ===
app.get('/test', (req, res) => {
  res.send('Server test successful!');
});

// ================== START SERVER ==================
const PORT = process.env.PORT || 5000;

console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🌐 Starting server on port ${PORT}...`);

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log('📚 Available endpoints:');
  console.log('  - GET  /');
  console.log('  - GET  /test');
  console.log('  - POST /login');
  console.log('  - POST /admin/create-user');
  console.log('  - GET  /admin/users');
  console.log('  - GET  /admin/managers');
  console.log('  - GET  /vehicles');
  console.log('  - GET  /vehicles/unit/:unitId');
  console.log('  - GET  /vehicles/:id');
  console.log('  - PATCH /vehicles/:id');
  console.log('  - POST /vehicles');
  console.log('  - GET  /vehicle-stocks');
  console.log('  - POST /vehicle-stocks');
  console.log('  - GET  /vehicle-preparations');
  console.log('  - GET  /driver-allocations');
  console.log('  - POST /driver-allocations');
  console.log('  - GET  /dashboard/stats');
  console.log('✅ Server initialization complete!');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use!`);
    console.log('💡 Try using a different port: PORT=5001 node server.js');
    process.exit(1);
  } else {
    console.error('🔥 Server error:', err);
  }
});

// ================== ERROR HANDLING ==================
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err.message);
});
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
});