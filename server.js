const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());

// API Configuration for I-Track Mobile App
const API_CONFIG = {
  // Development Mobile Backend (current)
  MOBILE_BACKEND: {
    BASE_URL: 'http://192.168.254.147:5000',
    NAME: 'Mobile Development Backend'
  },
  
  // Production Render Backend
  RENDER_BACKEND: {
    BASE_URL: 'https://itrack-backend-1.onrender.com',
    NAME: 'Render Production Backend'
  }
};

// Current active backend - Use local development backend
const ACTIVE_BACKEND = API_CONFIG.MOBILE_BACKEND;

// Helper function to build full API URL
const buildApiUrl = (endpoint) => {
  return `${ACTIVE_BACKEND.BASE_URL}${endpoint}`;
};

console.log(`📱 Mobile App connected to: ${ACTIVE_BACKEND.NAME}`);
console.log(`🔗 Base URL: ${ACTIVE_BACKEND.BASE_URL}`);

// MongoDB URI for your MongoDB Atlas cluster
const mongoURI = 'mongodb+srv://itrack_user:itrack123@cluster0.py8s8pl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Connect to MongoDB
mongoose.connect(mongoURI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// User Schema with Role Validation
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'supervisor', 'manager', 'salesAgent'], default: 'salesAgent' },
  accountName: { type: String, required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});
const User = mongoose.model('User', UserSchema);

// Vehicle Schema
const VehicleSchema = new mongoose.Schema({
  vin: String,
  unitId: String, // Added for consistency with DriverAllocation
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
  customer_name: String, // Added for agent dashboard
  customer_number: String, // Added for agent dashboard
});
const Vehicle = mongoose.model('Vehicle', VehicleSchema);

// Driver Allocation Schema (needed for DriverDashboard)
const DriverAllocationSchema = new mongoose.Schema({
  unitName: String,
  unitId: String,
  bodyColor: String,
  variation: String,
  assignedDriver: String,
  status: String,
}, { timestamps: true });
const DriverAllocation = mongoose.model('DriverAllocation', DriverAllocationSchema);

// ======================== AUTH =========================

// Admin Login with Hardcoded Credentials
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (username === 'isuzupasigadmin' && password === 'Isuzu_Pasig1') {
      return res.json({ success: true, role: 'admin', name: 'Isuzu Pasig Admin' });
    }

    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid username' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid password' });

    res.json({ success: true, role: user.role, name: user.accountName });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// (Other routes remain unchanged...)

// ========== VEHICLE ROUTES FOR DRIVER DASHBOARD ==========

// Get vehicle by unitId (for driver dashboard)
app.get('/vehicles/unit/:unitId', async (req, res) => {
  try {
    console.log(`Looking for vehicle with unitId: ${req.params.unitId}`);
    
    // Try to find by unitId first, then fallback to vin
    let vehicle = await Vehicle.findOne({ unitId: req.params.unitId });
    if (!vehicle) {
      vehicle = await Vehicle.findOne({ vin: req.params.unitId });
    }
    
    if (!vehicle) {
      console.log(`Vehicle not found for unitId: ${req.params.unitId}`);
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }
    
    console.log(`Found vehicle:`, vehicle);
    res.json(vehicle);
  } catch (err) {
    console.error('Error fetching vehicle by unitId:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update vehicle location by unitId (for driver dashboard)
app.patch('/vehicles/:unitId', async (req, res) => {
  try {
    const { location } = req.body;
    console.log(`Updating location for unitId: ${req.params.unitId}`, location);
    
    // Try to update by unitId first, then fallback to vin
    let vehicle = await Vehicle.findOneAndUpdate(
      { unitId: req.params.unitId },
      { $set: { location } },
      { new: true }
    );
    
    if (!vehicle) {
      vehicle = await Vehicle.findOneAndUpdate(
        { vin: req.params.unitId },
        { $set: { location } },
        { new: true, upsert: true }
      );
    }
    
    console.log('Updated vehicle location:', vehicle);
    res.json({ success: true, vehicle });
  } catch (err) {
    console.error('Error updating vehicle location:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all vehicles (for general use)
app.get('/vehicles', async (req, res) => {
  try {
    const vehicles = await Vehicle.find();
    res.json({ success: true, vehicles });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create or update vehicle (for agent dashboard)
app.post('/vehicles', async (req, res) => {
  try {
    console.log('Creating/updating vehicle:', req.body);
    
    const existing = await Vehicle.findOne({ vin: req.body.vin });
    if (existing) {
      Object.assign(existing, req.body);
      await existing.save();
      return res.json({ success: true, vehicle: existing });
    }

    const vehicle = new Vehicle(req.body);
    await vehicle.save();
    res.json({ success: true, vehicle });
  } catch (err) {
    console.error('Error creating vehicle:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ========== DRIVER ALLOCATION ROUTES ==========

// Get driver allocations (with filtering for specific driver)
app.get('/driver-allocations', async (req, res) => {
  try {
    const { assignedDriver } = req.query;
    let query = {};
    
    // Filter by assigned driver if provided
    if (assignedDriver) {
      query.assignedDriver = assignedDriver;
    }
    
    console.log('Driver allocations query:', query);
    const allocations = await DriverAllocation.find(query);
    console.log('Found allocations:', allocations.length);
    
    res.json({ success: true, data: allocations });
  } catch (err) {
    console.error('Error fetching driver allocations:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create driver allocation
app.post('/driver-allocations', async (req, res) => {
  try {
    console.log('Creating driver allocation:', req.body);
    const newAllocation = new DriverAllocation(req.body);
    await newAllocation.save();
    res.json({ success: true, allocation: newAllocation });
  } catch (err) {
    console.error('Error creating driver allocation:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update driver allocation status
app.patch('/driver-allocations/:id', async (req, res) => {
  try {
    console.log(`Updating allocation ${req.params.id} with:`, req.body);
    const updated = await DriverAllocation.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Allocation not found' });
    res.json({ success: true, allocation: updated });
  } catch (err) {
    console.error('Error updating driver allocation:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ========== TEST DATA CREATION ==========

// Create sample data for testing
app.post('/test/create-sample-data', async (req, res) => {
  try {
    console.log('Creating sample data for testing...');
    
    // Create sample driver allocation
    const sampleAllocation = new DriverAllocation({
      unitName: 'Isuzu D-Max',
      unitId: 'TEST001',
      bodyColor: 'Red',
      variation: 'LS-A 4x2',
      assignedDriver: 'Driver A',
      status: 'Pending'
    });
    await sampleAllocation.save();
    
    // Create sample vehicle with location
    const sampleVehicle = new Vehicle({
      vin: 'TEST001',
      unitId: 'TEST001',
      model: 'D-Max',
      driver: 'Driver A',
      current_status: 'Ready',
      location: { lat: 14.5791, lng: 121.0655 }, // Isuzu Pasig location
      customer_name: 'Test Customer',
      customer_number: '09123456789'
    });
    await sampleVehicle.save();
    
    console.log('Sample data created successfully');
    res.json({ 
      success: true, 
      message: 'Sample data created',
      allocation: sampleAllocation,
      vehicle: sampleVehicle
    });
  } catch (err) {
    console.error('Error creating sample data:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Test endpoint
app.get('/test', (req, res) => {
  res.send('Server test successful!');
});

// Server listening on localhost
const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
