const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();

console.log('🚀 Starting I-Track Backend Server (New Version)...');

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

console.log('✅ Middleware configured');

// MongoDB Connection
const mongoURI = 'mongodb+srv://itrack_user:itrack123@cluster0.py8s8pl.mongodb.net/itrackDB?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(mongoURI)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
    initializeDatabase();
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Enhanced Schemas
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['Admin', 'Supervisor', 'Manager', 'Sales Agent', 'Driver', 'Dispatch'], 
    default: 'Sales Agent' 
  },
  accountName: { type: String, required: true },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const VehicleSchema = new mongoose.Schema({
  vin: { type: String, required: true, unique: true },
  unitId: { type: String, default: '' },
  model: { type: String, required: true },
  brand: { type: String, default: 'Isuzu' },
  year: { type: Number, default: 2024 },
  color: { type: String, default: '' },
  driver: { type: String, default: '' },
  current_status: { 
    type: String, 
    enum: ['Available', 'Assigned', 'In Transit', 'Delivered', 'Under Maintenance'],
    default: 'Available' 
  },
  requested_processes: [String],
  preparation_status: {
    tinting: { type: Boolean, default: false },
    carwash: { type: Boolean, default: false },
    ceramic_coating: { type: Boolean, default: false },
    accessories: { type: Boolean, default: false },
    rust_proof: { type: Boolean, default: false },
    ready_for_release: { type: Boolean, default: false }
  },
  location: { 
    lat: { type: Number, default: 14.5547 }, 
    lng: { type: Number, default: 121.0244 } 
  },
  customer_name: { type: String, default: '' },
  customer_number: { type: String, default: '' },
  assignedAgent: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const DriverAllocationSchema = new mongoose.Schema({
  unitName: { type: String, required: true },
  unitId: { type: String, required: true },
  vin: { type: String, default: '' },
  bodyColor: { type: String, default: 'White' },
  variation: { type: String, default: 'Standard' },
  assignedDriver: { type: String, required: true },
  driverPhone: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Pending' 
  },
  startLocation: { lat: Number, lng: Number },
  endLocation: { lat: Number, lng: Number },
  estimatedDelivery: { type: Date },
  actualDelivery: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Models
const User = mongoose.model('User', UserSchema);
const Vehicle = mongoose.model('Vehicle', VehicleSchema);
const DriverAllocation = mongoose.model('DriverAllocation', DriverAllocationSchema);

// Helper Functions
function capitalizeWords(string) {
  return string ? string.split(' ').map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(' ') : '';
}

// Initialize Database with Sample Data
async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database...');
    
    // Check if admin exists
    const adminExists = await User.findOne({ role: 'Admin' });
    if (!adminExists) {
      console.log('📝 Creating default admin user...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        username: 'admin',
        password: hashedPassword,
        role: 'Admin',
        accountName: 'System Administrator',
        email: 'admin@itrack.com'
      });
      console.log('✅ Admin user created');
    }

    // Create sample users if database is empty
    const userCount = await User.countDocuments();
    if (userCount < 5) {
      console.log('📝 Creating sample users...');
      
      const sampleUsers = [
        { username: 'manager1', password: 'pass123', role: 'Manager', accountName: 'John Manager', email: 'john@itrack.com' },
        { username: 'agent1', password: 'pass123', role: 'Sales Agent', accountName: 'Sarah Agent', email: 'sarah@itrack.com' },
        { username: 'agent2', password: 'pass123', role: 'Sales Agent', accountName: 'Mike Agent', email: 'mike@itrack.com' },
        { username: 'driver1', password: 'pass123', role: 'Driver', accountName: 'Carlos Driver', phone: '09123456789' },
        { username: 'driver2', password: 'pass123', role: 'Driver', accountName: 'Maria Driver', phone: '09987654321' },
        { username: 'dispatch1', password: 'pass123', role: 'Dispatch', accountName: 'Tom Dispatch', email: 'tom@itrack.com' }
      ];

      for (const userData of sampleUsers) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        await User.create({
          ...userData,
          password: hashedPassword
        });
      }
      console.log('✅ Sample users created');
    }

    // Create sample vehicles
    const vehicleCount = await Vehicle.countDocuments();
    if (vehicleCount < 5) {
      console.log('📝 Creating sample vehicles...');
      
      const sampleVehicles = [
        { vin: 'ISU001', unitId: 'DMAX001', model: 'D-Max LS-A 4x2', color: 'White', current_status: 'Available' },
        { vin: 'ISU002', unitId: 'DMAX002', model: 'D-Max LS-E 4x4', color: 'Red', current_status: 'Available' },
        { vin: 'ISU003', unitId: 'MUX001', model: 'mu-X LS-A 4x2', color: 'Black', current_status: 'Available' },
        { vin: 'ISU004', unitId: 'MUX002', model: 'mu-X LS-E 4x4', color: 'Silver', current_status: 'Available' },
        { vin: 'ISU005', unitId: 'TRAVIZ001', model: 'Traviz EX', color: 'Blue', current_status: 'Available' }
      ];

      for (const vehicleData of sampleVehicles) {
        await Vehicle.create(vehicleData);
      }
      console.log('✅ Sample vehicles created');
    }

    console.log('✅ Database initialization complete');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  }
}

// ========= AUTHENTICATION ROUTES =========
app.post('/login', async (req, res) => {
  try {
    console.log('🔐 Login attempt:', req.body.username);
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password required' });
    }

    const user = await User.findOne({ username, isActive: true });
    if (!user) {
      console.log('❌ User not found:', username);
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      console.log('❌ Password mismatch for:', username);
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    console.log('✅ Login successful:', username);
    res.json({ 
      success: true, 
      role: capitalizeWords(user.role), 
      name: user.accountName, 
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        accountName: user.accountName,
        email: user.email
      }
    });
  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// ========= ADMIN ROUTES =========
app.get('/admin/users', async (req, res) => {
  try {
    console.log('📋 Fetching all users...');
    const users = await User.find({ isActive: true }).select('-password');
    console.log(`✅ Found ${users.length} users`);
    res.json({ success: true, users });
  } catch (err) {
    console.error('❌ Fetch users error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/admin/managers', async (req, res) => {
  try {
    console.log('👔 Fetching managers...');
    const managers = await User.find({ role: 'Manager', isActive: true }).select('_id accountName email');
    console.log(`✅ Found ${managers.length} managers`);
    res.json({ success: true, managers });
  } catch (err) {
    console.error('❌ Fetch managers error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/admin/assign', async (req, res) => {
  try {
    console.log('👤 Creating new user:', req.body.username);
    const { username, password, role, assignedTo, accountName, email, phone } = req.body;
    
    if (!username || !password || !role || !accountName) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const exists = await User.findOne({ username });
    if (exists) {
      return res.status(409).json({ success: false, message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      password: hashedPassword,
      role,
      accountName,
      email: email || '',
      phone: phone || '',
      assignedTo: assignedTo || null,
    });

    await newUser.save();
    console.log('✅ User created:', username);
    
    const userResponse = { ...newUser.toObject() };
    delete userResponse.password;
    
    res.json({ success: true, user: userResponse });
  } catch (err) {
    console.error('❌ Create user error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/admin/users/:userId', async (req, res) => {
  try {
    console.log('🗑️ Deleting user:', req.params.userId);
    const deleted = await User.findByIdAndUpdate(
      req.params.userId, 
      { isActive: false }, 
      { new: true }
    );
    
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    console.log('✅ User deactivated:', deleted.username);
    res.json({ success: true, message: 'User deactivated successfully' });
  } catch (err) {
    console.error('❌ Delete user error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ========= VEHICLE ROUTES =========
app.get('/vehicles', async (req, res) => {
  try {
    console.log('🚗 Fetching vehicles...');
    const vehicles = await Vehicle.find({});
    console.log(`✅ Found ${vehicles.length} vehicles`);
    res.json({ success: true, vehicles });
  } catch (err) {
    console.error('❌ Fetch vehicles error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/vehicles/:vin', async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ vin: req.params.vin });
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }
    res.json({ success: true, vehicle });
  } catch (err) {
    console.error('❌ Get vehicle error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/vehicles', async (req, res) => {
  try {
    console.log('🚗 Creating/updating vehicle:', req.body.vin);
    const existing = await Vehicle.findOne({ vin: req.body.vin });
    
    if (existing) {
      Object.assign(existing, req.body);
      existing.updatedAt = new Date();
      await existing.save();
      console.log('✅ Vehicle updated:', req.body.vin);
      return res.json({ success: true, vehicle: existing });
    }

    const vehicle = new Vehicle(req.body);
    await vehicle.save();
    console.log('✅ Vehicle created:', req.body.vin);
    res.json({ success: true, vehicle });
  } catch (err) {
    console.error('❌ Create vehicle error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ========= DRIVER ALLOCATION ROUTES =========
app.get('/driver-allocations', async (req, res) => {
  try {
    console.log('🚛 Fetching driver allocations...');
    const { assignedDriver } = req.query;
    let query = {};
    
    if (assignedDriver) {
      query.assignedDriver = assignedDriver;
    }
    
    const allocations = await DriverAllocation.find(query).sort({ createdAt: -1 });
    console.log(`✅ Found ${allocations.length} allocations`);
    res.json({ success: true, data: allocations });
  } catch (err) {
    console.error('❌ Fetch allocations error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/driver-allocations', async (req, res) => {
  try {
    console.log('🚛 Creating driver allocation:', req.body);
    const newAllocation = new DriverAllocation(req.body);
    await newAllocation.save();
    console.log('✅ Allocation created:', newAllocation._id);
    res.json({ success: true, allocation: newAllocation });
  } catch (err) {
    console.error('❌ Create allocation error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ========= TEST ROUTES =========
app.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'I-Track Backend Server is running!', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/health', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const vehicleCount = await Vehicle.countDocuments();
    const allocationCount = await DriverAllocation.countDocuments();
    
    res.json({
      success: true,
      status: 'healthy',
      database: 'connected',
      counts: {
        users: userCount,
        vehicles: vehicleCount,
        allocations: allocationCount
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: err.message
    });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 I-Track Backend Server running on http://localhost:${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/test`);
});

// Error Handling
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});
