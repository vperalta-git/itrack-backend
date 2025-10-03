const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

console.log('🚀 Starting I-Track Backend Server (CLEAN VERSION)...');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const mongoURI = process.env.MONGODB_URI || 
  'mongodb+srv://itrack_user:itrack123@cluster0.py8s8pl.mongodb.net/itrackDB?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(mongoURI)
.then(() => console.log('✅ Connected to MongoDB Atlas'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// ================== UNIFIED SCHEMAS (FIXED) ==================

// User Schema - FIXED to match actual database
const UserSchema = new mongoose.Schema({
  // Core fields that exist in database
  username: { type: String, required: true, unique: true },
  email: { type: String },
  password: { type: String, required: true },
  name: { type: String }, // Full name field from database
  phoneno: { type: String }, // Phone number field from database
  role: {
    type: String,
    enum: ['Admin', 'Supervisor', 'Manager', 'Sales Agent', 'Driver', 'Dispatch'],
    default: 'Sales Agent',
  },
  accountName: { type: String }, // Made optional since some users don't have it
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date }
}, { timestamps: true });

// Inventory Schema - FIXED field names
const InventorySchema = new mongoose.Schema({
  unitName: { type: String, required: true },
  unitId: { type: String, required: true },
  bodyColor: { type: String },
  variation: { type: String },
  location: {
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    address: { type: String, default: 'Isuzu Dealership' },
    lastUpdated: { type: Date, default: Date.now }
  },
  status: { 
    type: String, 
    enum: ['Available', 'Reserved', 'Sold', 'Assigned to Dispatch', 'In Process', 'In Dispatch', 'Allocated', 'Assigned to Driver'], 
    default: 'Available' 
  },
  quantity: { type: Number, default: 1 },
  model: String,
  year: Number,
  vin: String
}, { timestamps: true });

// Driver Allocation Schema - FIXED with location tracking
const DriverAllocationSchema = new mongoose.Schema({
  unitName: { type: String, required: true },
  unitId: { type: String, required: true },
  bodyColor: String,
  variation: String,
  assignedDriver: String,
  assignedAgent: String,
  status: { type: String, default: 'Pending' },
  allocatedBy: String,
  
  // REAL LOCATION TRACKING
  currentLocation: {
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
    address: String,
    lastUpdated: { type: Date, default: Date.now }
  },
  
  deliveryDestination: {
    latitude: { type: Number, min: -90, max: 90, default: 14.5791 },
    longitude: { type: Number, min: -180, max: 180, default: 121.0614 },
    address: { type: String, default: 'Isuzu Pasig' },
  },
  
  locationHistory: [{
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
    address: String,
    timestamp: { type: Date, default: Date.now },
    speed: Number,
    bearing: Number
  }],
  
  requestedProcesses: [String],
  processStatus: {
    type: Map,
    of: Boolean,
    default: {}
  },
  
  date: { type: Date, default: Date.now }
}, { timestamps: true });

// Service Request Schema
const ServiceRequestSchema = new mongoose.Schema({
  dateCreated: { type: Date, default: Date.now },
  vehicleRegNo: String,
  service: [{ serviceTime: String, status: String }],
  status: { 
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  completedAt: Date,
  completedBy: String
}, { timestamps: true });

// ================== MODELS ==================
const User = mongoose.model('User', UserSchema);
const Inventory = mongoose.model('Inventory', InventorySchema, 'inventories');
const DriverAllocation = mongoose.model('DriverAllocation', DriverAllocationSchema, 'driverallocations');
const ServiceRequest = mongoose.model('ServiceRequest', ServiceRequestSchema, 'servicerequests');

// ================== AUTHENTICATION ==================

// Mobile app login
app.post('/login', async (req, res) => {
  try {
    const { email, username, password, role } = req.body;
    const loginField = email || username;
    
    console.log(`🔐 Login attempt for: ${loginField}`);
    
    const user = await User.findOne({
      $or: [
        { email: loginField },
        { username: loginField }
      ]
    });

    if (!user) {
      console.log('❌ User not found');
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.password !== password) {
      console.log('❌ Password mismatch');
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    await user.save();

    console.log(`✅ Login successful for ${user.username} (${user.role})`);

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        phoneno: user.phoneno,
        role: user.role,
        accountName: user.accountName || user.name || user.username
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Web app login
app.post('/api/login', async (req, res) => {
  try {
    const { email, username, password, role } = req.body;
    const loginField = email || username;
    
    console.log(`🔐 API Login attempt for: ${loginField}`);
    
    const user = await User.findOne({
      $or: [
        { email: loginField },
        { username: loginField }
      ]
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        phoneno: user.phoneno,
        role: user.role,
        accountName: user.accountName || user.name || user.username
      }
    });
  } catch (error) {
    console.error('❌ API Login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================== USER MANAGEMENT ==================

// Get Users (Mobile)
app.get('/admin/users', async (req, res) => {
  try {
    const users = await User.find({ isActive: true }).select('-password');
    console.log(`👥 Retrieved ${users.length} users`);
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('❌ Get users error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Users (Web)
app.get('/api/getUsers', async (req, res) => {
  try {
    const users = await User.find({ isActive: true }).select('-password');
    console.log(`👥 API Retrieved ${users.length} users`);
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('❌ API Get users error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================== INVENTORY MANAGEMENT ==================

// Get Inventory (Mobile)
app.get('/vehicle-stocks', async (req, res) => {
  try {
    const inventory = await Inventory.find({});
    console.log(`📦 Retrieved ${inventory.length} inventory items`);
    res.json({ success: true, data: inventory });
  } catch (error) {
    console.error('❌ Get inventory error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Inventory (Web)
app.get('/api/getStock', async (req, res) => {
  try {
    const inventory = await Inventory.find({});
    console.log(`📦 API Retrieved ${inventory.length} inventory items`);
    res.json({ success: true, data: inventory });
  } catch (error) {
    console.error('❌ API Get inventory error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================== DRIVER ALLOCATION MANAGEMENT ==================

// Get Driver Allocations (Mobile)
app.get('/driver-allocations', async (req, res) => {
  try {
    const allocations = await DriverAllocation.find({}).sort({ createdAt: -1 });
    console.log(`🚛 Retrieved ${allocations.length} driver allocations`);
    res.json({ success: true, data: allocations });
  } catch (error) {
    console.error('❌ Get allocations error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Driver Allocations (Web)
app.get('/api/getAllocation', async (req, res) => {
  try {
    const allocations = await DriverAllocation.find({}).sort({ createdAt: -1 });
    console.log(`🚛 API Retrieved ${allocations.length} driver allocations`);
    res.json({ success: true, data: allocations });
  } catch (error) {
    console.error('❌ API Get allocations error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================== ALLOCATION CREATION & UPDATES ==================

// Create Driver Allocation (Mobile & Web)
app.post('/createAllocation', async (req, res) => {
  try {
    const allocationData = req.body;
    console.log('🚛 Creating driver allocation:', allocationData);
    
    // Create new allocation
    const newAllocation = new DriverAllocation(allocationData);
    await newAllocation.save();
    
    console.log(`✅ Driver allocation created: ${newAllocation._id}`);
    res.json({ 
      success: true, 
      message: 'Driver allocation created successfully',
      data: newAllocation 
    });
  } catch (error) {
    console.error('❌ Create allocation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create Driver Allocation (API version)
app.post('/api/createAllocation', async (req, res) => {
  try {
    const allocationData = req.body;
    console.log('🚛 API Creating driver allocation:', allocationData);
    
    // Create new allocation
    const newAllocation = new DriverAllocation(allocationData);
    await newAllocation.save();
    
    console.log(`✅ API Driver allocation created: ${newAllocation._id}`);
    res.json({ 
      success: true, 
      message: 'Driver allocation created successfully',
      data: newAllocation 
    });
  } catch (error) {
    console.error('❌ API Create allocation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update Inventory Stock Status
app.put('/updateStock/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    console.log(`📦 Updating stock ${id}:`, updateData);
    
    const updatedItem = await Inventory.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true }
    );
    
    if (!updatedItem) {
      return res.status(404).json({ 
        success: false, 
        message: 'Inventory item not found' 
      });
    }
    
    console.log(`✅ Stock updated: ${updatedItem._id}`);
    res.json({ 
      success: true, 
      message: 'Stock updated successfully',
      data: updatedItem 
    });
  } catch (error) {
    console.error('❌ Update stock error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update Inventory Stock Status (API version)
app.put('/api/updateStock/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    console.log(`📦 API Updating stock ${id}:`, updateData);
    
    const updatedItem = await Inventory.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true }
    );
    
    if (!updatedItem) {
      return res.status(404).json({ 
        success: false, 
        message: 'Inventory item not found' 
      });
    }
    
    console.log(`✅ API Stock updated: ${updatedItem._id}`);
    res.json({ 
      success: true, 
      message: 'Stock updated successfully',
      data: updatedItem 
    });
  } catch (error) {
    console.error('❌ API Update stock error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================== LOCATION TRACKING ROUTES (FIXED) ==================

// Update driver location
app.post('/api/tracking/update-location', async (req, res) => {
  try {
    const { unitId, latitude, longitude, address, speed, bearing } = req.body;
    
    if (!unitId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'unitId, latitude, and longitude are required' 
      });
    }

    const allocation = await DriverAllocation.findOne({ unitId });
    if (!allocation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Driver allocation not found' 
      });
    }

    // Update current location
    allocation.currentLocation = {
      latitude,
      longitude,
      address: address || 'Address not provided',
      lastUpdated: new Date()
    };

    // Add to location history
    if (!allocation.locationHistory) {
      allocation.locationHistory = [];
    }
    allocation.locationHistory.push({
      latitude,
      longitude,
      address: address || 'Address not provided',
      timestamp: new Date(),
      speed: speed || 0,
      bearing: bearing || 0
    });

    // Keep only last 100 location points
    if (allocation.locationHistory.length > 100) {
      allocation.locationHistory = allocation.locationHistory.slice(-100);
    }

    await allocation.save();
    
    console.log(`📍 Updated location for ${unitId}: ${latitude}, ${longitude}`);
    res.json({ 
      success: true, 
      message: 'Location updated successfully',
      location: allocation.currentLocation
    });
  } catch (error) {
    console.error('❌ Update location error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get live locations for all active drivers
app.get('/api/tracking/live-locations', async (req, res) => {
  try {
    const allocations = await DriverAllocation.find({
      status: { $in: ['In Transit', 'Assigned to Driver', 'Assigned to Dispatch'] },
      'currentLocation.latitude': { $ne: null },
      'currentLocation.longitude': { $ne: null }
    }).select('unitId unitName assignedDriver currentLocation deliveryDestination status');

    console.log(`🗺️ Retrieved ${allocations.length} live locations`);
    res.json({ 
      success: true, 
      data: allocations 
    });
  } catch (error) {
    console.error('❌ Get live locations error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get location history for specific vehicle (FIXED route parameter)
app.get('/api/tracking/history/:unitId', async (req, res) => {
  try {
    const unitId = req.params.unitId;
    const allocation = await DriverAllocation.findOne({ unitId: unitId })
      .select('unitId unitName assignedDriver locationHistory');

    if (!allocation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Vehicle not found' 
      });
    }

    console.log(`📊 Retrieved location history for ${unitId}: ${allocation.locationHistory?.length || 0} points`);
    res.json({ 
      success: true, 
      data: allocation 
    });
  } catch (error) {
    console.error('❌ Get location history error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================== SERVICE REQUESTS ==================

// Get Service Requests (Mobile)
app.get('/getRequest', async (req, res) => {
  try {
    const requests = await ServiceRequest.find({}).sort({ createdAt: -1 });
    console.log(`📋 Retrieved ${requests.length} service requests`);
    res.json({ success: true, data: requests });
  } catch (error) {
    console.error('❌ Get requests error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Service Requests (Web)
app.get('/api/getRequest', async (req, res) => {
  try {
    const requests = await ServiceRequest.find({}).sort({ createdAt: -1 });
    console.log(`📋 API Retrieved ${requests.length} service requests`);
    res.json({ success: true, data: requests });
  } catch (error) {
    console.error('❌ API Get requests error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Completed Requests (Web & Mobile)
app.get('/api/getCompletedRequests', async (req, res) => {
  try {
    const completedRequests = await ServiceRequest.find({ 
      status: 'Completed' 
    }).sort({ completedAt: -1 });
    console.log(`✅ Retrieved ${completedRequests.length} completed requests`);
    res.json({ success: true, data: completedRequests });
  } catch (error) {
    console.error('❌ Get completed requests error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Completed Requests (Alternative endpoint for compatibility)
app.get('/getCompletedRequests', async (req, res) => {
  try {
    const completedRequests = await ServiceRequest.find({ 
      status: 'Completed' 
    }).sort({ completedAt: -1 });
    console.log(`✅ Retrieved ${completedRequests.length} completed requests`);
    res.json({ success: true, data: completedRequests });
  } catch (error) {
    console.error('❌ Get completed requests error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Completed Requests (Mobile fallback)
app.get('/getCompletedRequests', async (req, res) => {
  try {
    const completedRequests = await ServiceRequest.find({ 
      status: 'Completed' 
    }).sort({ completedAt: -1 });
    console.log(`✅ Mobile Retrieved ${completedRequests.length} completed requests`);
    res.json({ success: true, data: completedRequests });
  } catch (error) {
    console.error('❌ Mobile Get completed requests error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================== DISPATCH ASSIGNMENT ENDPOINTS ==================

// Create Dispatch Assignment Schema
const DispatchAssignmentSchema = new mongoose.Schema({
  unitName: { type: String, required: true },
  unitId: { type: String, required: true },
  bodyColor: String,
  variation: String,
  status: { 
    type: String, 
    enum: ['Assigned to Dispatch', 'In Progress', 'Ready for Release', 'Released'],
    default: 'Assigned to Dispatch' 
  },
  processes: [String], // Array of process names
  processStatus: {
    type: Map,
    of: Boolean,
    default: {}
  },
  assignedBy: String,
  assignedTo: String, // Dispatch personnel
  createdAt: { type: Date, default: Date.now },
  completedAt: Date,
  notes: [String]
});

const DispatchAssignment = mongoose.model('DispatchAssignment', DispatchAssignmentSchema, 'dispatchassignments');

// Get Dispatch Assignments
app.get('/api/dispatch/assignments', async (req, res) => {
  try {
    const assignments = await DispatchAssignment.find({}).sort({ createdAt: -1 });
    console.log(`🚐 Retrieved ${assignments.length} dispatch assignments`);
    res.json({ success: true, data: assignments });
  } catch (error) {
    console.error('❌ Get dispatch assignments error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create Dispatch Assignment
app.post('/api/dispatch/assignments', async (req, res) => {
  try {
    const assignmentData = req.body;
    console.log('🚐 Creating dispatch assignment:', assignmentData);
    
    // Initialize process status map
    if (assignmentData.processes && assignmentData.processes.length > 0) {
      assignmentData.processStatus = {};
      assignmentData.processes.forEach(process => {
        assignmentData.processStatus[process] = false;
      });
    }
    
    const newAssignment = new DispatchAssignment(assignmentData);
    await newAssignment.save();
    
    console.log(`✅ Dispatch assignment created: ${newAssignment._id}`);
    res.json({ 
      success: true, 
      message: 'Dispatch assignment created successfully',
      data: newAssignment 
    });
  } catch (error) {
    console.error('❌ Create dispatch assignment error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update Dispatch Assignment Process Status
app.patch('/api/dispatch/assignments/:id/process', async (req, res) => {
  try {
    const { id } = req.params;
    const { processName, completed } = req.body;
    
    const assignment = await DispatchAssignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }
    
    assignment.processStatus.set(processName, completed);
    await assignment.save();
    
    console.log(`🔄 Updated process ${processName} for assignment ${id}: ${completed}`);
    res.json({ 
      success: true, 
      message: 'Process status updated',
      data: assignment 
    });
  } catch (error) {
    console.error('❌ Update dispatch process error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update Dispatch Assignment Status
app.patch('/api/dispatch/assignments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const assignment = await DispatchAssignment.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true }
    );
    
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }
    
    console.log(`✅ Dispatch assignment updated: ${assignment._id}`);
    res.json({ 
      success: true, 
      message: 'Assignment updated successfully',
      data: assignment 
    });
  } catch (error) {
    console.error('❌ Update dispatch assignment error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================== DASHBOARD STATS ==================

app.get('/dashboard/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ isActive: true });
    const totalAllocations = await DriverAllocation.countDocuments();
    const activeAllocations = await DriverAllocation.countDocuments({ 
      status: { $in: ['In Transit', 'Assigned to Driver'] } 
    });
    const totalStock = await Inventory.countDocuments();
    const totalDrivers = await User.countDocuments({ role: 'Driver', isActive: true });
    const totalAgents = await User.countDocuments({ role: 'Sales Agent', isActive: true });

    res.json({
      success: true,
      data: {
        totalUsers,
        totalAllocations,
        activeAllocations,
        totalStock,
        totalVehicles: totalStock,
        totalDrivers,
        totalAgents
      }
    });
  } catch (error) {
    console.error('❌ Dashboard stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================== ENHANCED ALLOCATION SYSTEM ==================

// Enhanced Driver Allocation Schema
const EnhancedDriverAllocationSchema = new mongoose.Schema({
  // Vehicle Information
  unitName: { type: String, required: true },
  unitId: { type: String, required: true },
  bodyColor: { type: String, required: true },
  variation: { type: String, required: true },
  model: { type: String, required: true },
  
  // Assignment Information
  assignedDriver: { type: String, required: true },
  assignedAgent: { type: String, required: true },
  assignedManager: { type: String, default: null },
  assignedSupervisor: { type: String, default: null },
  
  // Location Information with Presets
  pickupLocation: {
    id: { type: String, required: true },
    name: { type: String, required: true },
    address: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    type: { type: String, enum: ['warehouse', 'dealership', 'showroom', 'custom'], required: true },
    contactPerson: { type: String, default: null },
    contactNumber: { type: String, default: null },
    color: { type: String, default: '#1E40AF' }
  },
  
  deliveryLocation: {
    id: { type: String, required: true },
    name: { type: String, required: true },
    address: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    type: { type: String, enum: ['warehouse', 'dealership', 'showroom', 'custom'], required: true },
    contactPerson: { type: String, default: null },
    contactNumber: { type: String, default: null },
    color: { type: String, default: '#DC2626' }
  },
  
  // Status and Tracking
  status: {
    type: String,
    enum: [
      'Pending Assignment',
      'Driver Notified',
      'En Route to Pickup',
      'At Pickup Location',
      'Vehicle Loaded',
      'En Route to Delivery',
      'At Delivery Location',
      'Delivered',
      'Completed',
      'Cancelled',
      'On Hold'
    ],
    default: 'Pending Assignment'
  },
  
  // Priority Level
  priority: {
    type: String,
    enum: ['Low', 'Normal', 'High', 'Urgent', 'Critical'],
    default: 'Normal'
  },
  
  // Real-time Location Tracking
  currentLocation: {
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    address: { type: String, default: null },
    timestamp: { type: Date, default: null },
    accuracy: { type: Number, default: null },
    speed: { type: Number, default: null },
    heading: { type: Number, default: null }
  },
  
  // Location History for Route Tracking
  locationHistory: [{
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
    address: { type: String, default: null },
    accuracy: { type: Number, default: null },
    speed: { type: Number, default: null },
    heading: { type: Number, default: null },
    milestone: { type: String, default: null } // 'pickup_start', 'pickup_complete', 'delivery_start', 'delivery_complete'
  }],
  
  // Time Tracking
  estimatedTimes: {
    pickupETA: { type: Date, default: null },
    deliveryETA: { type: Date, default: null },
    totalEstimatedDuration: { type: Number, default: null } // in minutes
  },
  
  actualTimes: {
    assignmentAccepted: { type: Date, default: null },
    departureToPickup: { type: Date, default: null },
    arrivedAtPickup: { type: Date, default: null },
    pickupCompleted: { type: Date, default: null },
    departureToDelivery: { type: Date, default: null },
    arrivedAtDelivery: { type: Date, default: null },
    deliveryCompleted: { type: Date, default: null }
  },
  
  // Multi-level Tracking Visibility
  trackingVisibility: {
    driver: { type: Boolean, default: true },
    agent: { type: Boolean, default: true },
    manager: { type: Boolean, default: true },
    supervisor: { type: Boolean, default: true },
    admin: { type: Boolean, default: true }
  },
  
  // Notes and Communication
  notes: [{
    author: { type: String, required: true },
    authorRole: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    isSystemGenerated: { type: Boolean, default: false }
  }],
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null }
});

// Update the updatedAt field on save
EnhancedDriverAllocationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const EnhancedDriverAllocation = mongoose.model('EnhancedDriverAllocation', EnhancedDriverAllocationSchema);

// Isuzu Location Presets
const ISUZU_LOCATIONS = {
  ISUZU_PHILIPPINES: {
    id: 'isuzu_ph',
    name: "Isuzu Philippines (Main Warehouse)",
    address: "Isuzu Philippines Corporation, Laguna",
    latitude: 14.2162,
    longitude: 121.1624,
    type: "warehouse",
    isDefault: true,
    color: "#1E40AF"
  },
  ISUZU_PASIG: {
    id: 'isuzu_pasig',
    name: "Isuzu Pasig Dealership",
    address: "Isuzu Pasig Dealership, Ortigas Ave, Pasig City",
    latitude: 14.5791,
    longitude: 121.0655,
    type: "dealership",
    isDefault: true,
    color: "#DC2626"
  },
  ISUZU_BGC: {
    id: 'isuzu_bgc',
    name: "Isuzu BGC Showroom",
    address: "Isuzu BGC Showroom, Bonifacio Global City",
    latitude: 14.6048,
    longitude: 121.0215,
    type: "showroom",
    color: "#059669"
  },
  ISUZU_MAKATI: {
    id: 'isuzu_makati',
    name: "Isuzu Makati Dealership",
    address: "Isuzu Makati Showroom, Ayala Avenue, Makati City",
    latitude: 14.5547,
    longitude: 121.0244,
    type: "dealership",
    color: "#059669"
  },
  ISUZU_MANILA: {
    id: 'isuzu_manila',
    name: "Isuzu Manila Main Branch",
    address: "Isuzu Manila Main Branch, Manila",
    latitude: 14.5371,
    longitude: 121.0020,
    type: "dealership",
    color: "#059669"
  },
  ISUZU_TAGUIG: {
    id: 'isuzu_taguig',
    name: "Isuzu Taguig Branch",
    address: "Isuzu Taguig Branch, C6 Road, Taguig City",
    latitude: 14.5176,
    longitude: 121.0509,
    type: "dealership",
    color: "#059669"
  },
  ISUZU_MANDALUYONG: {
    id: 'isuzu_mandaluyong',
    name: "Isuzu Mandaluyong Showroom",
    address: "Isuzu Mandaluyong Showroom, EDSA, Mandaluyong City",
    latitude: 14.5794,
    longitude: 121.0359,
    type: "showroom",
    color: "#059669"
  }
};

// ===== ENHANCED ALLOCATION API ENDPOINTS =====

// Get Isuzu Location Presets
app.get('/api/locations/presets', (req, res) => {
  try {
    console.log('📍 Fetching Isuzu location presets...');
    res.json({
      success: true,
      locations: ISUZU_LOCATIONS,
      defaultPickup: ISUZU_LOCATIONS.ISUZU_PHILIPPINES,
      defaultDelivery: ISUZU_LOCATIONS.ISUZU_PASIG
    });
  } catch (error) {
    console.error('❌ Error fetching location presets:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch location presets',
      error: error.message 
    });
  }
});

// Create New Enhanced Allocation
app.post('/api/allocations', async (req, res) => {
  try {
    const allocationData = req.body;
    console.log('🚛 Creating new enhanced allocation:', allocationData.unitId);
    
    // Validate required fields
    if (!allocationData.unitId || !allocationData.assignedDriver || !allocationData.assignedAgent) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: unitId, assignedDriver, assignedAgent'
      });
    }
    
    // Check if vehicle is already allocated
    const existingAllocation = await EnhancedDriverAllocation.findOne({
      unitId: allocationData.unitId,
      status: { $nin: ['Completed', 'Cancelled'] }
    });
    
    if (existingAllocation) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle is already allocated to another driver'
      });
    }
    
    // Add system note for creation
    allocationData.notes = [{
      author: 'System',
      authorRole: 'Admin',
      message: `Enhanced allocation created for ${allocationData.unitName} (${allocationData.unitId})`,
      timestamp: new Date(),
      isSystemGenerated: true
    }];
    
    const newAllocation = new EnhancedDriverAllocation(allocationData);
    await newAllocation.save();
    
    console.log('✅ Enhanced allocation created successfully:', newAllocation._id);
    res.status(201).json({
      success: true,
      message: 'Enhanced allocation created successfully',
      allocation: newAllocation
    });
  } catch (error) {
    console.error('❌ Error creating enhanced allocation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create enhanced allocation',
      error: error.message
    });
  }
});

// Get All Enhanced Allocations with Filters
app.get('/api/allocations', async (req, res) => {
  try {
    const { status, priority, driver, agent, limit = 50, page = 1 } = req.query;
    console.log('📋 Fetching enhanced allocations with filters:', { status, priority, driver, agent });
    
    let filter = {};
    
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (driver) filter.assignedDriver = driver;
    if (agent) filter.assignedAgent = agent;
    
    const allocations = await EnhancedDriverAllocation.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const totalCount = await EnhancedDriverAllocation.countDocuments(filter);
    
    console.log(`📊 Retrieved ${allocations.length} enhanced allocations`);
    res.json({
      success: true,
      allocations,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('❌ Error fetching enhanced allocations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch enhanced allocations',
      error: error.message
    });
  }
});

// Get Single Enhanced Allocation by ID
app.get('/api/allocations/:id', async (req, res) => {
  try {
    console.log('🔍 Fetching enhanced allocation:', req.params.id);
    const allocation = await EnhancedDriverAllocation.findById(req.params.id);
    
    if (!allocation) {
      return res.status(404).json({
        success: false,
        message: 'Enhanced allocation not found'
      });
    }
    
    res.json({
      success: true,
      allocation
    });
  } catch (error) {
    console.error('❌ Error fetching enhanced allocation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch enhanced allocation',
      error: error.message
    });
  }
});

// Update Enhanced Allocation Status
app.patch('/api/allocations/:id/status', async (req, res) => {
  try {
    const { status, note, author, authorRole } = req.body;
    console.log('🔄 Updating allocation status:', req.params.id, 'to', status);
    
    const allocation = await EnhancedDriverAllocation.findById(req.params.id);
    
    if (!allocation) {
      return res.status(404).json({
        success: false,
        message: 'Enhanced allocation not found'
      });
    }
    
    const oldStatus = allocation.status;
    allocation.status = status;
    
    // Add system note for status change
    allocation.notes.push({
      author: author || 'System',
      authorRole: authorRole || 'Admin',
      message: note || `Status changed from ${oldStatus} to ${status}`,
      timestamp: new Date(),
      isSystemGenerated: !note
    });
    
    // Update actual times based on status
    const now = new Date();
    switch (status) {
      case 'Driver Notified':
        allocation.actualTimes.assignmentAccepted = now;
        break;
      case 'En Route to Pickup':
        allocation.actualTimes.departureToPickup = now;
        break;
      case 'At Pickup Location':
        allocation.actualTimes.arrivedAtPickup = now;
        break;
      case 'Vehicle Loaded':
        allocation.actualTimes.pickupCompleted = now;
        break;
      case 'En Route to Delivery':
        allocation.actualTimes.departureToDelivery = now;
        break;
      case 'At Delivery Location':
        allocation.actualTimes.arrivedAtDelivery = now;
        break;
      case 'Delivered':
      case 'Completed':
        allocation.actualTimes.deliveryCompleted = now;
        allocation.completedAt = now;
        break;
    }
    
    await allocation.save();
    
    console.log('✅ Enhanced allocation status updated successfully');
    res.json({
      success: true,
      message: 'Status updated successfully',
      allocation
    });
  } catch (error) {
    console.error('❌ Error updating enhanced allocation status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update enhanced allocation status',
      error: error.message
    });
  }
});

// Update Real-time Location for Enhanced Allocation
app.patch('/api/allocations/:id/location', async (req, res) => {
  try {
    const { latitude, longitude, address, accuracy, speed, heading, milestone } = req.body;
    console.log('📍 Updating real-time location for allocation:', req.params.id);
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }
    
    const allocation = await EnhancedDriverAllocation.findById(req.params.id);
    
    if (!allocation) {
      return res.status(404).json({
        success: false,
        message: 'Enhanced allocation not found'
      });
    }
    
    const now = new Date();
    
    // Update current location
    allocation.currentLocation = {
      latitude,
      longitude,
      address,
      timestamp: now,
      accuracy,
      speed,
      heading
    };
    
    // Add to location history
    allocation.locationHistory.push({
      latitude,
      longitude,
      timestamp: now,
      address,
      accuracy,
      speed,
      heading,
      milestone
    });
    
    // If milestone is provided, add a note
    if (milestone) {
      const milestoneMessages = {
        'pickup_start': 'Driver has started moving towards pickup location',
        'pickup_arrived': 'Driver has arrived at pickup location',
        'pickup_complete': 'Vehicle pickup completed, en route to delivery',
        'delivery_arrived': 'Driver has arrived at delivery location',
        'delivery_complete': 'Vehicle delivery completed successfully'
      };
      
      allocation.notes.push({
        author: 'GPS System',
        authorRole: 'System',
        message: milestoneMessages[milestone] || `Milestone reached: ${milestone}`,
        timestamp: now,
        isSystemGenerated: true
      });
    }
    
    await allocation.save();
    
    console.log('📍 Enhanced allocation location updated successfully');
    res.json({
      success: true,
      message: 'Location updated successfully',
      currentLocation: allocation.currentLocation
    });
  } catch (error) {
    console.error('❌ Error updating enhanced allocation location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update location',
      error: error.message
    });
  }
});

// Get Active Enhanced Allocations for Driver
app.get('/api/allocations/driver/:driverUsername', async (req, res) => {
  try {
    console.log('👤 Fetching active allocations for driver:', req.params.driverUsername);
    const allocations = await EnhancedDriverAllocation.find({
      assignedDriver: req.params.driverUsername,
      status: { $nin: ['Completed', 'Cancelled'] }
    }).sort({ createdAt: -1 });
    
    console.log(`📋 Found ${allocations.length} active allocations for driver`);
    res.json({
      success: true,
      allocations
    });
  } catch (error) {
    console.error('❌ Error fetching driver allocations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch driver allocations',
      error: error.message
    });
  }
});

// Get Enhanced Allocation Statistics
app.get('/api/allocations/stats/overview', async (req, res) => {
  try {
    console.log('📊 Fetching enhanced allocation statistics...');
    const totalAllocations = await EnhancedDriverAllocation.countDocuments();
    const activeAllocations = await EnhancedDriverAllocation.countDocuments({
      status: { $nin: ['Completed', 'Cancelled'] }
    });
    const completedToday = await EnhancedDriverAllocation.countDocuments({
      status: 'Completed',
      completedAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999))
      }
    });
    
    const statusCounts = await EnhancedDriverAllocation.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    const priorityCounts = await EnhancedDriverAllocation.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);
    
    res.json({
      success: true,
      stats: {
        totalAllocations,
        activeAllocations,
        completedToday,
        statusBreakdown: statusCounts,
        priorityBreakdown: priorityCounts
      }
    });
  } catch (error) {
    console.error('❌ Error fetching enhanced allocation stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch enhanced allocation statistics',
      error: error.message
    });
  }
});

// ================== HEALTH CHECK ==================

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    enhancedLocationTracking: 'Active'
  });
});

// ================== ERROR HANDLING ==================

app.all('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Route not found' 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ I-Track Server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`📍 Location tracking ready!`);
});