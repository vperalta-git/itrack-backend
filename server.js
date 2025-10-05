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

// ================== ENHANCED DRIVER ALLOCATIONS SCHEMA ==================
const EnhancedDriverAllocationSchema = new mongoose.Schema({
  unitName: { type: String, required: true },
  unitId: { type: String, required: true },
  bodyColor: { type: String, required: true },
  variation: { type: String },
  model: { type: String },
  assignedDriver: { type: String, required: true },
  assignedAgent: { type: String },
  assignedManager: { type: String },
  assignedSupervisor: { type: String },
  pickupLocation: {
    address: String,
    lat: Number,
    lng: Number,
    timestamp: Date
  },
  deliveryLocation: {
    address: String,
    lat: Number,
    lng: Number,
    timestamp: Date
  },
  currentLocation: {
    lat: Number,
    lng: Number,
    timestamp: Date,
    address: String
  },
  status: { 
    type: String, 
    enum: ['Assigned', 'In Transit', 'Delivered', 'Cancelled', 'On Hold'],
    default: 'Assigned' 
  },
  priority: { 
    type: String, 
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium' 
  },
  estimatedTimes: {
    pickup: Date,
    delivery: Date,
    duration: Number // in minutes
  },
  actualTimes: {
    pickup: Date,
    delivery: Date,
    duration: Number // in minutes
  },
  trackingVisibility: {
    customer: { type: Boolean, default: true },
    agent: { type: Boolean, default: true },
    driver: { type: Boolean, default: true }
  },
  notes: [String],
  locationHistory: [{
    lat: Number,
    lng: Number,
    timestamp: Date,
    address: String,
    event: String // 'pickup', 'waypoint', 'delivery', 'update'
  }],
  vehicleAt: Date,
  lastUpdate: { type: Date, default: Date.now }
}, { 
  timestamps: true,
  collection: 'enhanceddriverallocations' // Use the exact collection name from MongoDB
});

// ================== COMPLETED REQUEST SCHEMA ==================
const CompletedRequestSchema = new mongoose.Schema({
  vehicleRegNo: { type: String, required: true },
  unitName: { type: String },
  service: [{
    type: String,
    enum: ['Tinting', 'Carwash', 'Ceramic Coating', 'Accessories', 'Rust Proof'],
    required: true
  }],
  status: { 
    type: String,
    enum: ['In Progress', 'Completed'],
    default: 'Completed'
  },
  preparedBy: { type: String, required: true },
  dateCreated: { type: String }, // Original format preservation
  inProgressAt: { type: Date },
  completedAt: { type: Date },
  serviceDurationMinutes: { type: Number },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { collection: 'completedrequests' });

CompletedRequestSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// ================== AUDIT TRAIL SCHEMA ==================
const AuditTrailSchema = new mongoose.Schema({
  action: { type: String, required: true },
  performedBy: { type: String, required: true },
  targetUser: { type: String },
  targetResource: { type: String },
  details: { type: String },
  timestamp: { type: Date, default: Date.now },
  ipAddress: { type: String },
  userAgent: { type: String }
}, { collection: 'audittrails' });

// ================== IN PROGRESS REQUESTS SCHEMA ==================
const InProgressRequestSchema = new mongoose.Schema({
  vehicleRegNo: { type: String, required: true },
  unitName: { type: String },
  service: [String],
  status: { type: String, default: 'In Progress' },
  preparedBy: { type: String, required: true },
  startedAt: { type: Date, default: Date.now },
  estimatedCompletion: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { collection: 'inprogressrequests' });

InProgressRequestSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Dispatch Assignment Schema
const DispatchAssignmentSchema = new mongoose.Schema({
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'VehicleStock' },
  unitName: { type: String, required: true },
  unitId: { type: String, required: true },
  bodyColor: { type: String, required: true },
  variation: { type: String, required: true },
  
  // Dispatch Process Management
  processes: [{
    type: String,
    enum: ['tinting', 'carwash', 'ceramic_coating', 'accessories', 'rust_proof'],
    required: true
  }],
  
  // Process Status Tracking
  processStatus: {
    tinting: { type: Boolean, default: false },
    carwash: { type: Boolean, default: false },
    ceramic_coating: { type: Boolean, default: false },
    accessories: { type: Boolean, default: false },
    rust_proof: { type: Boolean, default: false }
  },
  
  // Dispatch Status Workflow
  status: {
    type: String,
    enum: [
      'Assigned to Dispatch',
      'In Process',
      'Awaiting Dispatch', 
      'In Transit',
      'Arrived at Dealership',
      'Under Preparation',
      'Ready for Release',
      'Released to Customer',
      'Completed'
    ],
    default: 'Assigned to Dispatch'
  },
  
  // Assignment Information
  assignedBy: { type: String, required: true },
  assignedAt: { type: Date, default: Date.now },
  assignedTo: { type: String, default: null },
  
  // Progress Tracking
  processCompletedBy: { type: String, default: null },
  processCompletedAt: { type: Date, default: null },
  
  // Notes and Communication
  notes: [{
    author: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    processType: { type: String, default: null }
  }],
  
  // Customer Information
  customerInfo: {
    name: { type: String, default: null },
    contactNumber: { type: String, default: null },
    email: { type: String, default: null },
    address: { type: String, default: null }
  },
  
  // Release Information
  releasedAt: { type: Date, default: null },
  releasedBy: { type: String, default: null },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null }
}, { collection: 'dispatchassignments' });

DispatchAssignmentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// ================== INVENTORIES SCHEMA ==================
const InventoriesSchema = new mongoose.Schema({
  unitName: { type: String, required: true },
  unitId: { type: String, required: true },
  bodyColor: { type: String, required: true },
  variation: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  location: {
    model: { type: String },
    status: { type: String }
  },
  status: { 
    type: String, 
    enum: ['Available', 'Assigned to Dispatch', 'In Use', 'Reserved', 'Maintenance'],
    default: 'Available' 
  }
}, { 
  timestamps: true,
  collection: 'inventories' // Use the exact collection name from MongoDB
});

// ================== TEST DRIVES SCHEMA ==================
const TestDriveSchema = new mongoose.Schema({
  vehicleId: { type: mongoose.Schema.Types.ObjectId, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  name: { type: String, required: true },
  contact: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'No Show'],
    default: 'Pending' 
  },
  requestedBy: { type: String }, // Agent who requested
  approvedBy: { type: String }, // Admin who approved
  notes: { type: String }
}, { 
  timestamps: true,
  collection: 'testdrives' // Use the exact collection name from MongoDB
});

// ================== NOTIFICATIONS SCHEMA ==================
const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['test_drive_request', 'test_drive_approved', 'test_drive_rejected', 'allocation_update', 'general'],
    required: true 
  },
  data: {
    testDriveId: mongoose.Schema.Types.ObjectId,
    allocationId: mongoose.Schema.Types.ObjectId,
    requestedBy: String,
    customerName: String,
    date: String,
    time: String,
    additionalInfo: mongoose.Schema.Types.Mixed
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium' 
  },
  isRead: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  readAt: Date,
  actionTaken: String, // 'approved', 'rejected', 'completed', etc.
  actionBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  actionAt: Date
}, { 
  timestamps: true,
  collection: 'notifications'
});

// ================== MODELS ==================
const User = mongoose.model('User', UserSchema);
const Vehicle = mongoose.model('Vehicle', VehicleSchema);
const VehicleStock = mongoose.model('VehicleStock', VehicleStockSchema);
const VehiclePreparation = mongoose.model('VehiclePreparation', VehiclePreparationSchema);
const DriverAllocation = mongoose.model('DriverAllocation', DriverAllocationSchema);
const EnhancedDriverAllocation = mongoose.model('EnhancedDriverAllocation', EnhancedDriverAllocationSchema);
const CompletedRequest = mongoose.model('CompletedRequest', CompletedRequestSchema);
const AuditTrail = mongoose.model('AuditTrail', AuditTrailSchema);
const InProgressRequest = mongoose.model('InProgressRequest', InProgressRequestSchema);
const DispatchAssignment = mongoose.model('DispatchAssignment', DispatchAssignmentSchema);
const Inventories = mongoose.model('Inventories', InventoriesSchema);
const TestDrive = mongoose.model('TestDrive', TestDriveSchema);
const Notification = mongoose.model('Notification', NotificationSchema);

// Test Drive Vehicle Schema
const TestDriveVehicleSchema = new mongoose.Schema({
  brand: { type: String, required: true, default: 'Isuzu' },
  model: { type: String, required: true },
  year: { type: String, required: true },
  plateNumber: { type: String, required: true, unique: true },
  vin: { type: String },
  color: { type: String },
  mileage: { type: String },
  fuelType: { type: String, enum: ['Diesel', 'Gasoline'], default: 'Diesel' },
  transmission: { type: String, enum: ['Manual', 'Automatic'], default: 'Manual' },
  status: { type: String, enum: ['Available', 'In Use', 'Maintenance'], default: 'Available' },
  location: { type: String, default: 'Isuzu Pasig' },
  notes: { type: String },
  addedBy: { type: String, required: true },
  dateAdded: { type: Date, default: Date.now },
  lastMaintenanceDate: { type: Date },
  nextMaintenanceDate: { type: Date }
}, { timestamps: true });

const TestDriveVehicle = mongoose.model('TestDriveVehicle', TestDriveVehicleSchema);

// ================== ROUTES ==================

// === AUTH ===
app.post('/login', async (req, res) => {
  try {
    let { username, password, role } = req.body;
    console.log('📥 Login Attempt:', { username, role });

    if (!username || !password) {
      return res
        .status(400)
        .json({ success: false, message: 'Username and password are required' });
    }

    username = username.toLowerCase().trim();

    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    if (password !== user.password)
      return res.status(401).json({ success: false, message: 'Invalid password' });

    if (role && user.role !== role) {
      return res
        .status(403)
        .json({ success: false, message: `Access denied for role: ${role}` });
    }

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

// ================== MISSING CRITICAL ROUTES ==================

// Get all users
app.get('/users', async (req, res) => {
  try {
    console.log('🔍 Fetching all users...');
    const users = await User.find({}).select('-password');
    console.log(`📊 Found ${users.length} users`);
    res.json(users);
  } catch (err) {
    console.error('❌ Error fetching users:', err);
    res.status(500).json({ success: false, message: 'Error fetching users', error: err.message });
  }
});

// Get all users (API version)
app.get('/api/users', async (req, res) => {
  try {
    console.log('🔍 Fetching all users (API)...');
    const users = await User.find({}).select('-password');
    console.log(`📊 Found ${users.length} users`);
    res.json({ success: true, data: users });
  } catch (err) {
    console.error('❌ Error fetching users:', err);
    res.status(500).json({ success: false, message: 'Error fetching users', error: err.message });
  }
});

// Get vehicles with enhanced data
app.get('/api/vehicles', async (req, res) => {
  try {
    console.log('🚗 Fetching all vehicles...');
    const vehicles = await Vehicle.find({});
    console.log(`📊 Found ${vehicles.length} vehicles`);
    res.json({ success: true, data: vehicles });
  } catch (err) {
    console.error('❌ Error fetching vehicles:', err);
    res.status(500).json({ success: false, message: 'Error fetching vehicles', error: err.message });
  }
});

// Get vehicle stock
app.get('/api/vehicle-stock', async (req, res) => {
  try {
    console.log('📦 Fetching vehicle stock...');
    const stock = await VehicleStock.find({});
    console.log(`📊 Found ${stock.length} stock items`);
    res.json({ success: true, data: stock });
  } catch (err) {
    console.error('❌ Error fetching vehicle stock:', err);
    res.status(500).json({ success: false, message: 'Error fetching vehicle stock', error: err.message });
  }
});

// Create allocation
app.post('/createAllocation', async (req, res) => {
  try {
    console.log('📝 Creating allocation:', req.body);
    const allocation = new DriverAllocation(req.body);
    await allocation.save();
    console.log('✅ Allocation created:', allocation._id);
    res.json({ success: true, data: allocation });
  } catch (err) {
    console.error('❌ Error creating allocation:', err);
    res.status(500).json({ success: false, message: 'Error creating allocation', error: err.message });
  }
});

// Create allocation (API version)
app.post('/api/createAllocation', async (req, res) => {
  try {
    console.log('📝 Creating allocation (API):', req.body);
    const allocation = new DriverAllocation(req.body);
    await allocation.save();
    console.log('✅ Allocation created:', allocation._id);
    res.json({ success: true, data: allocation });
  } catch (err) {
    console.error('❌ Error creating allocation:', err);
    res.status(500).json({ success: false, message: 'Error creating allocation', error: err.message });
  }
});

// Update stock
app.patch('/updateStock/:id', async (req, res) => {
  try {
    console.log('📦 Updating stock:', req.params.id, req.body);
    const stock = await VehicleStock.findByIdAndUpdate(req.params.id, req.body, { new: true });
    console.log('✅ Stock updated:', stock._id);
    res.json({ success: true, data: stock });
  } catch (err) {
    console.error('❌ Error updating stock:', err);
    res.status(500).json({ success: false, message: 'Error updating stock', error: err.message });
  }
});

// Update stock (API version)  
app.patch('/api/updateStock/:id', async (req, res) => {
  try {
    console.log('📦 Updating stock (API):', req.params.id, req.body);
    const stock = await VehicleStock.findByIdAndUpdate(req.params.id, req.body, { new: true });
    console.log('✅ Stock updated:', stock._id);
    res.json({ success: true, data: stock });
  } catch (err) {
    console.error('❌ Error updating stock:', err);
    res.status(500).json({ success: false, message: 'Error updating stock', error: err.message });
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

// === VEHICLES ===
app.get('/vehicles', async (req, res) => {
  try {
    const vehicles = await Vehicle.find({});
    res.json(vehicles);
  } catch (err) {
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

// Get all allocations (History Screen compatibility)
app.get('/getAllocation', async (req, res) => {
  try {
    const allocations = await DriverAllocation.find({}).sort({ createdAt: -1 });
    console.log(`📊 Found ${allocations.length} allocations for history`);
    res.json({ success: true, data: allocations });
  } catch (error) {
    console.error('❌ Get allocations error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API version for getAllocation
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

// Get Driver Allocations by Driver Name (for driver dashboard)
app.get('/api/driver-allocations/:driverName', async (req, res) => {
  try {
    const { driverName } = req.params;
    console.log(`🚛 Fetching allocations for driver: ${driverName}`);
    
    const allocations = await DriverAllocation.find({ 
      assignedDriver: driverName 
    }).sort({ createdAt: -1 });
    
    console.log(`🚛 Found ${allocations.length} allocations for driver: ${driverName}`);
    res.json({ success: true, data: allocations });
  } catch (error) {
    console.error('❌ Get driver allocations error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Active Allocations for Driver (only pending/in-progress)
app.get('/api/driver-allocations/:driverName/active', async (req, res) => {
  try {
    const { driverName } = req.params;
    console.log(`🚛 Fetching active allocations for driver: ${driverName}`);
    
    const allocations = await DriverAllocation.find({ 
      assignedDriver: driverName,
      status: { $nin: ['Completed', 'Delivered', 'Cancelled'] }
    }).sort({ createdAt: -1 });
    
    console.log(`🚛 Found ${allocations.length} active allocations for driver: ${driverName}`);
    res.json({ success: true, data: allocations });
  } catch (error) {
    console.error('❌ Get driver active allocations error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update Driver Allocation Status
app.put('/updateAllocation/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    console.log(`🔄 Updating allocation ${id}:`, updateData);
    
    const updatedAllocation = await DriverAllocation.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true }
    );
    
    if (!updatedAllocation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Allocation not found' 
      });
    }
    
    console.log(`✅ Allocation updated: ${updatedAllocation._id}`);
    res.json({ 
      success: true, 
      message: 'Allocation updated successfully',
      data: updatedAllocation 
    });
  } catch (error) {
    console.error('❌ Update allocation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================== HISTORY ENDPOINTS ==================

// Get In Progress Requests
app.get('/getRequest', async (req, res) => {
  try {
    console.log('📋 Fetching in-progress requests...');
    const inProgressRequests = await InProgressRequest.find()
      .sort({ createdAt: -1 });
    
    console.log(`📊 Found ${inProgressRequests.length} in-progress requests`);
    res.json({ 
      success: true, 
      data: inProgressRequests 
    });
  } catch (error) {
    console.error('❌ Error fetching in-progress requests:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get Audit Trail
app.get('/api/audit-trail', async (req, res) => {
  try {
    console.log('📋 Fetching audit trail...');
    const auditTrail = await AuditTrail.find()
      .sort({ timestamp: -1 })
      .limit(100); // Limit to recent 100 entries
    
    console.log(`📊 Found ${auditTrail.length} audit trail entries`);
    res.json({ 
      success: true, 
      data: auditTrail 
    });
  } catch (error) {
    console.error('❌ Error fetching audit trail:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Alternative getRequest endpoint
app.get('/api/getRequest', async (req, res) => {
  try {
    console.log('📋 Fetching service requests (API)...');
    const inProgressRequests = await InProgressRequest.find()
      .sort({ createdAt: -1 });
    
    console.log(`📊 Found ${inProgressRequests.length} service requests`);
    res.json({ 
      success: true, 
      data: inProgressRequests 
    });
  } catch (error) {
    console.error('❌ Error fetching service requests:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ================== COMPLETED REQUESTS ENDPOINTS ==================

// Get Completed Requests
app.get('/getCompletedRequests', async (req, res) => {
  try {
    console.log('📋 Fetching completed requests...');
    const completedRequests = await CompletedRequest.find({ status: 'Completed' })
      .sort({ completedAt: -1 });
    
    console.log(`📊 Found ${completedRequests.length} completed requests`);
    res.json({ 
      success: true, 
      data: completedRequests,
      count: completedRequests.length
    });
  } catch (error) {
    console.error('❌ Error fetching completed requests:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get All Service Requests (including in-progress)
app.get('/api/service-requests', async (req, res) => {
  try {
    console.log('📋 Fetching all service requests...');
    const serviceRequests = await CompletedRequest.find()
      .sort({ createdAt: -1 });
    
    console.log(`📊 Found ${serviceRequests.length} service requests`);
    res.json({ 
      success: true, 
      data: serviceRequests,
      count: serviceRequests.length
    });
  } catch (error) {
    console.error('❌ Error fetching service requests:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create New Service Request
app.post('/api/service-requests', async (req, res) => {
  try {
    const { vehicleRegNo, unitName, service, preparedBy } = req.body;
    console.log('🚛 Creating service request for:', vehicleRegNo);
    
    if (!vehicleRegNo || !service || !preparedBy) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: vehicleRegNo, service, preparedBy'
      });
    }
    
    const newRequest = new CompletedRequest({
      vehicleRegNo,
      unitName,
      service: Array.isArray(service) ? service : [service],
      preparedBy,
      status: 'In Progress',
      inProgressAt: new Date(),
      dateCreated: new Date().toString()
    });
    
    await newRequest.save();
    
    console.log('✅ Service request created:', newRequest._id);
    res.status(201).json({
      success: true,
      data: newRequest,
      message: 'Service request created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating service request:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Complete Service Request
app.patch('/api/service-requests/:id/complete', async (req, res) => {
  try {
    const { serviceDurationMinutes } = req.body;
    console.log('✅ Completing service request:', req.params.id);
    
    const request = await CompletedRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Service request not found'
      });
    }
    
    request.status = 'Completed';
    request.completedAt = new Date();
    
    if (serviceDurationMinutes) {
      request.serviceDurationMinutes = serviceDurationMinutes;
    } else if (request.inProgressAt) {
      const duration = Math.round((new Date() - request.inProgressAt) / (1000 * 60));
      request.serviceDurationMinutes = duration;
    }
    
    await request.save();
    
    console.log('✅ Service request completed');
    res.json({
      success: true,
      data: request,
      message: 'Service request completed successfully'
    });
  } catch (error) {
    console.error('❌ Error completing service request:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ================== DISPATCH ASSIGNMENT ENDPOINTS ==================

// Get All Dispatch Assignments
app.get('/api/dispatch/assignments', async (req, res) => {
  try {
    console.log('📋 Fetching dispatch assignments...');
    const assignments = await DispatchAssignment.find()
      .sort({ createdAt: -1 });
    
    console.log(`📊 Retrieved ${assignments.length} dispatch assignments`);
    res.json({
      success: true,
      data: assignments,
      count: assignments.length
    });
  } catch (error) {
    console.error('❌ Error fetching dispatch assignments:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create New Dispatch Assignment
app.post('/api/dispatch/assignments', async (req, res) => {
  try {
    const { unitId, unitName, bodyColor, variation, processes, assignedBy } = req.body;
    console.log('🚛 Creating dispatch assignment for:', unitId);
    
    // Validate required fields
    if (!unitId || !unitName || !processes || !assignedBy) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: unitId, unitName, processes, assignedBy'
      });
    }
    
    // Check if vehicle already has an active dispatch assignment
    const existingAssignment = await DispatchAssignment.findOne({
      unitId: unitId,
      status: { $nin: ['Completed', 'Released to Customer'] }
    });
    
    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        error: 'Vehicle already has an active dispatch assignment'
      });
    }
    
    // Create new dispatch assignment
    const newAssignment = new DispatchAssignment({
      unitId,
      unitName,
      bodyColor,
      variation,
      processes,
      assignedBy,
      notes: [{
        author: assignedBy,
        message: `Vehicle assigned to dispatch for processes: ${processes.join(', ')}`,
        timestamp: new Date()
      }]
    });
    
    await newAssignment.save();
    
    console.log('✅ Dispatch assignment created:', newAssignment._id);
    res.status(201).json({
      success: true,
      data: newAssignment,
      message: 'Dispatch assignment created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating dispatch assignment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update Dispatch Assignment Status
app.patch('/api/dispatch/assignments/:id/status', async (req, res) => {
  try {
    const { status, updatedBy, note } = req.body;
    console.log('🔄 Updating dispatch assignment status:', req.params.id, 'to', status);
    
    const assignment = await DispatchAssignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Dispatch assignment not found'
      });
    }
    
    const oldStatus = assignment.status;
    assignment.status = status;
    
    // Add note for status change
    assignment.notes.push({
      author: updatedBy || 'System',
      message: note || `Status changed from ${oldStatus} to ${status}`,
      timestamp: new Date()
    });
    
    // Update completion tracking
    if (status === 'Completed' || status === 'Released to Customer') {
      assignment.completedAt = new Date();
      assignment.processCompletedBy = updatedBy;
      assignment.processCompletedAt = new Date();
    }
    
    await assignment.save();
    
    console.log('✅ Dispatch assignment status updated');
    res.json({
      success: true,
      data: assignment,
      message: 'Status updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating dispatch assignment status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update Process Status (Individual Process Completion)
app.patch('/api/dispatch/assignments/:id/process', async (req, res) => {
  try {
    const { processType, processId, completed, completedBy } = req.body;
    
    // Handle both processType and processId (frontend sends processId)
    const processKey = processId || processType;
    
    console.log('🔧 Updating process status:', processKey, 'to', completed);
    
    if (!processKey) {
      return res.status(400).json({
        success: false,
        error: 'Process identifier (processId or processType) is required'
      });
    }
    
    const assignment = await DispatchAssignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Dispatch assignment not found'
      });
    }
    
    // Validate that the process exists in the assignment
    if (!assignment.processes.includes(processKey)) {
      return res.status(400).json({
        success: false,
        error: `Process '${processKey}' not found in assignment processes`
      });
    }
    
    // Update process status using Map.set() method
    assignment.processStatus.set(processKey, completed);
    
    // Add note for process completion
    assignment.notes.push({
      author: completedBy || 'System',
      message: `Process ${processKey} ${completed ? 'completed' : 'marked incomplete'}`,
      timestamp: new Date(),
      processType: processKey
    });
    
    // Check if all processes are completed
    const allCompleted = assignment.processes.every(
      process => assignment.processStatus.get(process) === true
    );
    
    if (allCompleted && assignment.status === 'In Process') {
      assignment.status = 'Ready for Release';
      assignment.processCompletedBy = completedBy;
      assignment.processCompletedAt = new Date();
      
      assignment.notes.push({
        author: 'System',
        message: 'All processes completed - vehicle ready for release',
        timestamp: new Date()
      });
    }
    
    await assignment.save();
    
    console.log('✅ Process status updated');
    res.json({
      success: true,
      data: assignment,
      message: 'Process status updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating process status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ================== VEHICLE RELEASE ENDPOINTS ==================

// Get vehicles ready for release
app.get('/api/vehicles/ready-for-release', async (req, res) => {
  try {
    console.log('📋 Fetching vehicles ready for release...');
    
    // Get all dispatch assignments that are ready for release
    const readyAssignments = await DispatchAssignment.find({
      status: 'Ready for Release'
    }).sort({ processCompletedAt: -1 });
    
    console.log(`📊 Found ${readyAssignments.length} vehicles ready for release`);
    res.json({
      success: true,
      data: readyAssignments
    });
  } catch (error) {
    console.error('❌ Error fetching ready vehicles:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Release vehicle to customer
app.patch('/api/vehicles/:id/release', async (req, res) => {
  try {
    const { releasedBy, customerInfo, notes } = req.body;
    console.log('🚀 Releasing vehicle:', req.params.id);
    
    const assignment = await DispatchAssignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle assignment not found'
      });
    }
    
    if (assignment.status !== 'Ready for Release') {
      return res.status(400).json({
        success: false,
        error: 'Vehicle is not ready for release'
      });
    }
    
    // Update assignment status
    assignment.status = 'Released to Customer';
    assignment.releasedAt = new Date();
    assignment.releasedBy = releasedBy;
    
    if (customerInfo) {
      assignment.customerInfo = customerInfo;
    }
    
    // Add release note
    assignment.notes.push({
      author: releasedBy || 'System',
      message: notes || `Vehicle released to customer by ${releasedBy}`,
      timestamp: new Date()
    });
    
    await assignment.save();
    
    console.log('✅ Vehicle released successfully');
    res.json({
      success: true,
      data: assignment,
      message: 'Vehicle released to customer successfully'
    });
  } catch (error) {
    console.error('❌ Error releasing vehicle:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Bulk release vehicles
app.post('/api/vehicles/bulk-release', async (req, res) => {
  try {
    const { vehicleIds, releasedBy, notes } = req.body;
    console.log('🚀 Bulk releasing vehicles:', vehicleIds?.length);
    
    if (!vehicleIds || !Array.isArray(vehicleIds) || vehicleIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Vehicle IDs array is required'
      });
    }
    
    const results = {
      success: [],
      failed: []
    };
    
    for (const vehicleId of vehicleIds) {
      try {
        const assignment = await DispatchAssignment.findById(vehicleId);
        
        if (!assignment) {
          results.failed.push({
            vehicleId,
            error: 'Assignment not found'
          });
          continue;
        }
        
        if (assignment.status !== 'Ready for Release') {
          results.failed.push({
            vehicleId,
            unitId: assignment.unitId,
            error: 'Not ready for release'
          });
          continue;
        }
        
        // Update assignment
        assignment.status = 'Released to Customer';
        assignment.releasedAt = new Date();
        assignment.releasedBy = releasedBy;
        
        assignment.notes.push({
          author: releasedBy || 'System',
          message: notes || `Vehicle bulk released by ${releasedBy}`,
          timestamp: new Date()
        });
        
        await assignment.save();
        
        results.success.push({
          vehicleId,
          unitId: assignment.unitId,
          unitName: assignment.unitName
        });
        
      } catch (error) {
        results.failed.push({
          vehicleId,
          error: error.message
        });
      }
    }
    
    console.log(`✅ Bulk release completed: ${results.success.length} success, ${results.failed.length} failed`);
    res.json({
      success: true,
      data: results,
      message: `Released ${results.success.length} vehicles successfully`
    });
  } catch (error) {
    console.error('❌ Error in bulk release:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get Dispatch Assignment by ID
app.get('/api/dispatch/assignments/:id', async (req, res) => {
  try {
    console.log('🔍 Fetching dispatch assignment:', req.params.id);
    const assignment = await DispatchAssignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Dispatch assignment not found'
      });
    }
    
    res.json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('❌ Error fetching dispatch assignment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get Dispatch Statistics
app.get('/api/dispatch/stats', async (req, res) => {
  try {
    console.log('📊 Fetching dispatch statistics...');
    
    const totalAssignments = await DispatchAssignment.countDocuments();
    const activeAssignments = await DispatchAssignment.countDocuments({
      status: { $nin: ['Completed', 'Released to Customer'] }
    });
    const readyForRelease = await DispatchAssignment.countDocuments({
      status: 'Ready for Release'
    });
    const inProcess = await DispatchAssignment.countDocuments({
      status: 'In Process'
    });
    
    const statusBreakdown = await DispatchAssignment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    res.json({
      success: true,
      stats: {
        totalAssignments,
        activeAssignments,
        readyForRelease,
        inProcess,
        statusBreakdown
      }
    });
  } catch (error) {
    console.error('❌ Error fetching dispatch statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
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

    // Add completed requests data
    const completedRequests = await CompletedRequest.countDocuments({ status: 'Completed' });
    const inProgressRequests = await CompletedRequest.countDocuments({ status: 'In Progress' });
    const recentCompletedRequests = await CompletedRequest.countDocuments({
      completedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      totalStocks,
      finishedVehiclePreps,
      ongoingShipments,
      ongoingVehiclePreps,
      recentVehiclePreps,
      completedRequests,
      inProgressRequests,
      recentCompletedRequests,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// === MISSING API ENDPOINTS ===
// Add /api/getUsers endpoint (app calls this)
app.get('/api/getUsers', async (req, res) => {
  try {
    const users = await User.find({});
    res.json({ success: true, data: users });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add /admin/users endpoint (some screens call this)
app.get('/admin/users', async (req, res) => {
  try {
    const users = await User.find({});
    res.json({ success: true, data: users });
  } catch (err) {
    console.error('Error fetching admin users:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add /api/getStock endpoint (app calls this for inventory)
app.get('/api/getStock', async (req, res) => {
  try {
    const vehicles = await VehicleStock.find({});
    res.json({ success: true, data: vehicles });
  } catch (err) {
    console.error('Error fetching vehicle stock:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================== INVENTORIES ENDPOINTS ==================
// Get all inventories (this is the correct collection with 18 documents)
app.get('/api/inventories', async (req, res) => {
  try {
    const inventories = await Inventories.find({}).sort({ createdAt: -1 });
    console.log(`📦 Found ${inventories.length} inventory items`);
    res.json({ success: true, data: inventories });
  } catch (err) {
    console.error('Error fetching inventories:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update inventory status
app.put('/api/inventories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    console.log(`📋 Updating inventory ${id}:`, updateData);
    
    const updatedItem = await Inventories.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedItem) {
      return res.status(404).json({ success: false, error: 'Inventory item not found' });
    }
    
    res.json({ success: true, data: updatedItem });
  } catch (err) {
    console.error('Error updating inventory:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================== TEST DRIVE ENDPOINTS ==================
// Get all test drives
app.get('/api/testdrives', async (req, res) => {
  try {
    const testDrives = await TestDrive.find({}).sort({ createdAt: -1 });
    console.log(`🚗 Found ${testDrives.length} test drive records`);
    res.json({ success: true, data: testDrives });
  } catch (err) {
    console.error('Error fetching test drives:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new test drive request
app.post('/api/testdrives', async (req, res) => {
  try {
    const testDriveData = req.body;
    console.log('📝 Creating new test drive request:', testDriveData);
    
    const newTestDrive = new TestDrive(testDriveData);
    const savedTestDrive = await newTestDrive.save();
    
    // Create notifications for admins and supervisors
    const adminsAndSupervisors = await User.find({
      role: { $in: ['Admin', 'Supervisor'] }
    });
    
    for (const user of adminsAndSupervisors) {
      const notification = new Notification({
        userId: user._id,
        title: 'New Test Drive Request',
        message: `${testDriveData.requestedBy} has requested a test drive for ${testDriveData.name}`,
        type: 'test_drive_request',
        data: {
          testDriveId: savedTestDrive._id,
          requestedBy: testDriveData.requestedBy,
          customerName: testDriveData.name,
          date: testDriveData.date,
          time: testDriveData.time
        },
        priority: 'medium'
      });
      await notification.save();
    }
    
    console.log('✅ Test drive request created with notifications:', savedTestDrive._id);
    res.status(201).json({ 
      success: true, 
      data: savedTestDrive,
      message: 'Test drive request submitted and notifications sent to admins'
    });
  } catch (err) {
    console.error('Error creating test drive request:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Approve or reject test drive request
app.put('/api/testdrives/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, approvedBy, rejectionReason, notes } = req.body; // action: 'approve' or 'reject'
    
    console.log(`🔄 ${action === 'approve' ? 'Approving' : 'Rejecting'} test drive ${id} by ${approvedBy}`);
    
    const updateData = {
      status: action === 'approve' ? 'Confirmed' : 'Rejected',
      approvedBy,
      lastUpdate: new Date()
    };
    
    if (action === 'reject' && rejectionReason) {
      updateData.notes = rejectionReason;
    }
    if (notes) {
      updateData.notes = notes;
    }
    
    const updatedTestDrive = await TestDrive.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedTestDrive) {
      return res.status(404).json({ success: false, error: 'Test drive not found' });
    }
    
    // Create notification for the requesting agent
    const requestingAgent = await User.findOne({ accountName: updatedTestDrive.requestedBy });
    if (requestingAgent) {
      const notification = new Notification({
        userId: requestingAgent._id,
        title: `Test Drive ${action === 'approve' ? 'Approved' : 'Rejected'}`,
        message: action === 'approve' 
          ? `Your test drive request for ${updatedTestDrive.name} has been approved by ${approvedBy}`
          : `Your test drive request for ${updatedTestDrive.name} has been rejected by ${approvedBy}${rejectionReason ? ': ' + rejectionReason : ''}`,
        type: action === 'approve' ? 'test_drive_approved' : 'test_drive_rejected',
        data: {
          testDriveId: updatedTestDrive._id,
          customerName: updatedTestDrive.name,
          date: updatedTestDrive.date,
          time: updatedTestDrive.time,
          approvedBy,
          rejectionReason
        },
        priority: 'high'
      });
      await notification.save();
    }
    
    res.json({ 
      success: true, 
      data: updatedTestDrive,
      message: `Test drive ${action === 'approve' ? 'approved' : 'rejected'} successfully`
    });
  } catch (err) {
    console.error('Error updating test drive approval:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get pending test drive requests (for admins/supervisors)
app.get('/api/testdrives/pending', async (req, res) => {
  try {
    const pendingTestDrives = await TestDrive.find({ 
      status: 'Pending' 
    }).sort({ createdAt: -1 });
    console.log(`📋 Found ${pendingTestDrives.length} pending test drive requests`);
    res.json({ success: true, data: pendingTestDrives });
  } catch (err) {
    console.error('Error fetching pending test drives:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update test drive status
app.put('/api/testdrives/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    console.log(`🔄 Updating test drive ${id}:`, updateData);
    
    const updatedTestDrive = await TestDrive.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedTestDrive) {
      return res.status(404).json({ success: false, error: 'Test drive not found' });
    }
    
    res.json({ success: true, data: updatedTestDrive });
  } catch (err) {
    console.error('Error updating test drive:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================== ENHANCED DRIVER ALLOCATIONS ENDPOINTS ==================
// Get all enhanced driver allocations
app.get('/api/enhanced-driver-allocations', async (req, res) => {
  try {
    const allocations = await EnhancedDriverAllocation.find({}).sort({ createdAt: -1 });
    console.log(`🚛 Found ${allocations.length} enhanced driver allocation records`);
    res.json({ success: true, data: allocations });
  } catch (err) {
    console.error('Error fetching enhanced driver allocations:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get enhanced driver allocations by driver
app.get('/api/enhanced-driver-allocations/driver/:driverName', async (req, res) => {
  try {
    const { driverName } = req.params;
    const allocations = await EnhancedDriverAllocation.find({ 
      assignedDriver: driverName 
    }).sort({ createdAt: -1 });
    console.log(`🚛 Found ${allocations.length} allocations for driver: ${driverName}`);
    res.json({ success: true, data: allocations });
  } catch (err) {
    console.error('Error fetching driver allocations:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get enhanced driver allocations by agent
app.get('/api/enhanced-driver-allocations/agent/:agentName', async (req, res) => {
  try {
    const { agentName } = req.params;
    const allocations = await EnhancedDriverAllocation.find({ 
      assignedAgent: agentName 
    }).sort({ createdAt: -1 });
    console.log(`🚛 Found ${allocations.length} allocations for agent: ${agentName}`);
    res.json({ success: true, data: allocations });
  } catch (err) {
    console.error('Error fetching agent allocations:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new enhanced driver allocation
app.post('/api/enhanced-driver-allocations', async (req, res) => {
  try {
    const allocationData = req.body;
    console.log('📝 Creating new enhanced driver allocation:', allocationData);
    
    const newAllocation = new EnhancedDriverAllocation(allocationData);
    const savedAllocation = await newAllocation.save();
    
    console.log('✅ Enhanced driver allocation created:', savedAllocation._id);
    res.status(201).json({ success: true, data: savedAllocation });
  } catch (err) {
    console.error('Error creating enhanced driver allocation:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update enhanced driver allocation
app.put('/api/enhanced-driver-allocations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, lastUpdate: new Date() };
    console.log(`🔄 Updating enhanced driver allocation ${id}:`, updateData);
    
    const updatedAllocation = await EnhancedDriverAllocation.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedAllocation) {
      return res.status(404).json({ success: false, error: 'Enhanced driver allocation not found' });
    }
    
    res.json({ success: true, data: updatedAllocation });
  } catch (err) {
    console.error('Error updating enhanced driver allocation:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update location for enhanced driver allocation
app.put('/api/enhanced-driver-allocations/:id/location', async (req, res) => {
  try {
    const { id } = req.params;
    const { lat, lng, address, event } = req.body;
    
    const updateData = {
      currentLocation: {
        lat,
        lng,
        timestamp: new Date(),
        address
      },
      lastUpdate: new Date(),
      $push: {
        locationHistory: {
          lat,
          lng,
          timestamp: new Date(),
          address,
          event: event || 'update'
        }
      }
    };
    
    const updatedAllocation = await EnhancedDriverAllocation.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedAllocation) {
      return res.status(404).json({ success: false, error: 'Enhanced driver allocation not found' });
    }
    
    console.log(`📍 Location updated for allocation ${id}: ${address || `${lat}, ${lng}`}`);
    res.json({ success: true, data: updatedAllocation });
  } catch (err) {
    console.error('Error updating location:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================== TEST DRIVE VEHICLE ENDPOINTS ==================
// Get all test drive vehicles
app.get('/api/test-drive-vehicles', async (req, res) => {
  try {
    console.log('📋 Fetching test drive vehicles');
    const vehicles = await TestDriveVehicle.find().sort({ dateAdded: -1 });
    
    res.json({ 
      success: true, 
      data: vehicles,
      count: vehicles.length 
    });
  } catch (err) {
    console.error('Error fetching test drive vehicles:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add new test drive vehicle
app.post('/api/test-drive-vehicles', async (req, res) => {
  try {
    console.log('🚗 Adding new test drive vehicle:', req.body);
    
    const newVehicle = new TestDriveVehicle(req.body);
    const savedVehicle = await newVehicle.save();
    
    console.log('✅ Test drive vehicle added successfully:', savedVehicle._id);
    res.json({ 
      success: true, 
      message: 'Test drive vehicle added successfully',
      data: savedVehicle 
    });
  } catch (err) {
    console.error('Error adding test drive vehicle:', err);
    if (err.code === 11000) {
      res.status(400).json({ 
        success: false, 
        error: 'Plate number already exists' 
      });
    } else {
      res.status(500).json({ success: false, error: err.message });
    }
  }
});

// Update test drive vehicle status
app.put('/api/test-drive-vehicles/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log(`🔄 Updating test drive vehicle ${id} status to: ${status}`);
    
    const updatedVehicle = await TestDriveVehicle.findByIdAndUpdate(
      id, 
      { status, lastMaintenanceDate: status === 'Maintenance' ? new Date() : undefined },
      { new: true }
    );
    
    if (!updatedVehicle) {
      return res.status(404).json({ success: false, error: 'Vehicle not found' });
    }
    
    res.json({ 
      success: true, 
      message: `Vehicle status updated to ${status}`,
      data: updatedVehicle 
    });
  } catch (err) {
    console.error('Error updating vehicle status:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete test drive vehicle
app.delete('/api/test-drive-vehicles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Deleting test drive vehicle: ${id}`);
    
    const deletedVehicle = await TestDriveVehicle.findByIdAndDelete(id);
    
    if (!deletedVehicle) {
      return res.status(404).json({ success: false, error: 'Vehicle not found' });
    }
    
    res.json({ 
      success: true, 
      message: 'Test drive vehicle removed successfully' 
    });
  } catch (err) {
    console.error('Error deleting test drive vehicle:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get available test drive vehicles for agents
app.get('/api/test-drive-vehicles/available', async (req, res) => {
  try {
    console.log('🚙 Fetching available test drive vehicles');
    const availableVehicles = await TestDriveVehicle.find({ 
      status: 'Available' 
    }).sort({ model: 1 });
    
    res.json({ 
      success: true, 
      data: availableVehicles,
      count: availableVehicles.length 
    });
  } catch (err) {
    console.error('Error fetching available test drive vehicles:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================== NOTIFICATIONS ENDPOINTS ==================
// Get notifications for a user
app.get('/api/notifications/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, unreadOnly = false } = req.query;
    
    const filter = { 
      userId: userId,
      isDeleted: false
    };
    
    if (unreadOnly === 'true') {
      filter.isRead = false;
    }
    
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('userId', 'username accountName role');
      
    console.log(`🔔 Found ${notifications.length} notifications for user ${userId}`);
    res.json({ success: true, data: notifications });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Mark notification as read
app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedNotification = await Notification.findByIdAndUpdate(
      id, 
      { isRead: true, readAt: new Date() }, 
      { new: true }
    );
    
    if (!updatedNotification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }
    
    res.json({ success: true, data: updatedNotification });
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get unread notification count
app.get('/api/notifications/:userId/unread-count', async (req, res) => {
  try {
    const { userId } = req.params;
    const count = await Notification.countDocuments({
      userId: userId,
      isRead: false,
      isDeleted: false
    });
    
    res.json({ success: true, count });
  } catch (err) {
    console.error('Error getting unread notification count:', err);
    res.status(500).json({ success: false, error: err.message });
  }
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
  console.log('  - GET  /test');
  console.log('  - POST /login');
  console.log('  - POST /admin/create-user');
  console.log('  - GET  /admin/users');
  console.log('  - GET  /api/getUsers');
  console.log('  - GET  /api/getStock');
  console.log('  - GET  /api/inventories');
  console.log('  - PUT  /api/inventories/:id');
  console.log('  - GET  /api/testdrives');
  console.log('  - POST /api/testdrives');
  console.log('  - PUT  /api/testdrives/:id');
  console.log('  - PUT  /api/testdrives/:id/approve');
  console.log('  - GET  /api/testdrives/pending');
  console.log('  - GET  /api/notifications/:userId');
  console.log('  - PUT  /api/notifications/:id/read');
  console.log('  - GET  /api/notifications/:userId/unread-count');
  console.log('  - GET  /api/enhanced-driver-allocations');
  console.log('  - GET  /api/enhanced-driver-allocations/driver/:driverName');
  console.log('  - GET  /api/enhanced-driver-allocations/agent/:agentName');
  console.log('  - POST /api/enhanced-driver-allocations');
  console.log('  - PUT  /api/enhanced-driver-allocations/:id');
  console.log('  - PUT  /api/enhanced-driver-allocations/:id/location');
  console.log('  - GET  /vehicles');
  console.log('  - GET  /driver-allocations');
  console.log('  - GET  /getAllocation');
  console.log('  - GET  /getRequest');
  console.log('  - GET  /api/audit-trail');
  console.log('  - GET  /getCompletedRequests');
  console.log('  - GET  /api/service-requests');
  console.log('  - POST /api/service-requests');
  console.log('  - GET  /api/dispatch/assignments');
  console.log('  - POST /api/dispatch/assignments');
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
