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
  },
  // Driver assignment fields for allocation tracking
  assignedDriver: { type: String },
  assignedAgent: { type: String },
  dateAssigned: { type: Date },
  allocationId: { type: mongoose.Schema.Types.ObjectId, ref: 'DriverAllocation' }
}, { 
  timestamps: true,
  collection: 'inventories' // Use the exact collection name from MongoDB
});

// ================== MODELS ==================
const User = mongoose.model('User', UserSchema);
const Vehicle = mongoose.model('Vehicle', VehicleSchema);
const VehicleStock = mongoose.model('VehicleStock', VehicleStockSchema);
const VehiclePreparation = mongoose.model('VehiclePreparation', VehiclePreparationSchema);
const DriverAllocation = mongoose.model('DriverAllocation', DriverAllocationSchema);
const CompletedRequest = mongoose.model('CompletedRequest', CompletedRequestSchema);
const AuditTrail = mongoose.model('AuditTrail', AuditTrailSchema);
const InProgressRequest = mongoose.model('InProgressRequest', InProgressRequestSchema);
const DispatchAssignment = mongoose.model('DispatchAssignment', DispatchAssignmentSchema);
const Inventories = mongoose.model('Inventories', InventoriesSchema);

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

// === USER MANAGEMENT ===
app.post('/admin/create-user', async (req, res) => {
  try {
    console.log('👤 Creating new user:', req.body);
    const { username, password, role, assignedTo, accountName } = req.body;
    
    // Validate required fields
    if (!username || !password || !role || !accountName) {
      console.log('❌ Missing required fields:', { username: !!username, password: !!password, role: !!role, accountName: !!accountName });
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields', 
        required: ['username', 'password', 'role', 'accountName']
      });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username: username.toLowerCase().trim() });
    if (existingUser) {
      console.log('❌ Username already exists:', username);
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }

    const newUser = new User({
      username: username.toLowerCase().trim(),
      password,
      role,
      assignedTo: assignedTo || null,
      accountName,
    });

    const savedUser = await newUser.save();
    console.log('✅ User created successfully:', savedUser._id);
    
    // Return user without password
    const userResponse = {
      _id: savedUser._id,
      username: savedUser.username,
      role: savedUser.role,
      accountName: savedUser.accountName,
      assignedTo: savedUser.assignedTo,
      createdAt: savedUser.createdAt,
      updatedAt: savedUser.updatedAt
    };
    
    res.status(201).json({ 
      success: true, 
      message: 'User created successfully', 
      user: userResponse 
    });
  } catch (err) {
    console.error('❌ Error creating user:', err);
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }
    res.status(500).json({ 
      success: false, 
      message: 'Error creating user', 
      error: err.message 
    });
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

// ================== ESSENTIAL INVENTORY API ENDPOINTS ==================
// Get all inventories (this is the correct collection with inventory data)
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

// Create new inventory item
app.post('/api/inventories', async (req, res) => {
  try {
    console.log('📝 Creating new inventory item:', req.body);
    const inventoryData = req.body;
    
    const newInventory = new Inventories(inventoryData);
    const savedInventory = await newInventory.save();
    
    console.log('✅ Inventory item created:', savedInventory._id);
    res.status(201).json({ success: true, data: savedInventory, message: 'Inventory item created successfully' });
  } catch (err) {
    console.error('❌ Error creating inventory:', err);
    if (err.code === 11000) {
      res.status(400).json({ success: false, error: 'Duplicate inventory item' });
    } else {
      res.status(500).json({ success: false, error: err.message });
    }
  }
});

// Get vehicle stock (for compatibility)
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

// Get stock for compatibility with AgentDashboard
app.get('/api/getStock', async (req, res) => {
  try {
    const inventories = await Inventories.find({});
    res.json({ success: true, data: inventories });
  } catch (err) {
    console.error('Error fetching stock:', err);
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
    
    console.log('✅ Inventory updated successfully');
    res.json({ success: true, data: updatedItem, message: 'Inventory updated successfully' });
  } catch (err) {
    console.error('Error updating inventory:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete inventory item
app.delete('/api/inventories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Deleting inventory item: ${id}`);
    
    const deletedItem = await Inventories.findByIdAndDelete(id);
    if (!deletedItem) {
      return res.status(404).json({ success: false, error: 'Inventory item not found' });
    }
    
    console.log('✅ Inventory item deleted successfully');
    res.json({ success: true, message: 'Inventory item deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting inventory:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Enhanced createAllocation endpoint with inventory status update
app.post('/createAllocation', async (req, res) => {
  try {
    console.log('📝 Creating allocation with inventory update:', req.body);
    
    const allocationData = req.body;
    
    // Create the allocation
    const allocation = new DriverAllocation(allocationData);
    const savedAllocation = await allocation.save();
    
    // If there's a vehicleId/inventoryId, update the inventory status
    if (allocationData.vehicleId || allocationData.inventoryId) {
      const inventoryId = allocationData.vehicleId || allocationData.inventoryId;
      
      const inventoryUpdate = {
        status: 'In Use',
        assignedDriver: allocationData.assignedDriver,
        assignedAgent: allocationData.assignedAgent,
        dateAssigned: new Date(),
        allocationId: savedAllocation._id
      };
      
      const updatedInventory = await Inventories.findByIdAndUpdate(
        inventoryId, 
        inventoryUpdate, 
        { new: true }
      );
      
      if (updatedInventory) {
        console.log(`✅ Updated inventory ${inventoryId} status to "In Use"`);
      }
    }
    
    console.log('✅ Allocation created with inventory update:', savedAllocation._id);
    res.json({ success: true, data: savedAllocation });
  } catch (err) {
    console.error('❌ Error creating allocation:', err);
    res.status(500).json({ success: false, message: 'Error creating allocation', error: err.message });
  }
});

// API version of createAllocation
app.post('/api/createAllocation', async (req, res) => {
  try {
    console.log('📝 Creating allocation (API) with inventory update:', req.body);
    
    const allocationData = req.body;
    
    // Create the allocation
    const allocation = new DriverAllocation(allocationData);
    const savedAllocation = await allocation.save();
    
    // If there's a vehicleId/inventoryId, update the inventory status
    if (allocationData.vehicleId || allocationData.inventoryId) {
      const inventoryId = allocationData.vehicleId || allocationData.inventoryId;
      
      const inventoryUpdate = {
        status: 'In Use',
        assignedDriver: allocationData.assignedDriver,
        assignedAgent: allocationData.assignedAgent,
        dateAssigned: new Date(),
        allocationId: savedAllocation._id
      };
      
      const updatedInventory = await Inventories.findByIdAndUpdate(
        inventoryId, 
        inventoryUpdate, 
        { new: true }
      );
      
      if (updatedInventory) {
        console.log(`✅ Updated inventory ${inventoryId} status to "In Use"`);
      }
    }
    
    console.log('✅ Allocation created with inventory update:', savedAllocation._id);
    res.json({ success: true, data: savedAllocation });
  } catch (err) {
    console.error('❌ Error creating allocation:', err);
    res.status(500).json({ success: false, message: 'Error creating allocation', error: err.message });
  }
});

// ================== DISPATCH MANAGEMENT ENDPOINTS ==================
// Get all dispatch assignments
app.get('/api/dispatch-assignments', async (req, res) => {
  try {
    const assignments = await DispatchAssignment.find({}).sort({ createdAt: -1 });
    console.log(`📋 Found ${assignments.length} dispatch assignments`);
    res.json({ success: true, data: assignments });
  } catch (err) {
    console.error('Error fetching dispatch assignments:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new dispatch assignment
app.post('/api/dispatch-assignments', async (req, res) => {
  try {
    console.log('📝 Creating dispatch assignment:', req.body);
    const assignmentData = req.body;
    
    const newAssignment = new DispatchAssignment(assignmentData);
    const savedAssignment = await newAssignment.save();
    
    console.log('✅ Dispatch assignment created:', savedAssignment._id);
    res.status(201).json({ success: true, data: savedAssignment });
  } catch (err) {
    console.error('❌ Error creating dispatch assignment:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update dispatch assignment status
app.put('/api/dispatch-assignments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updatedAt: new Date() };
    console.log(`🔄 Updating dispatch assignment ${id}:`, updateData);
    
    const updatedAssignment = await DispatchAssignment.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedAssignment) {
      return res.status(404).json({ success: false, error: 'Dispatch assignment not found' });
    }
    
    res.json({ success: true, data: updatedAssignment });
  } catch (err) {
    console.error('Error updating dispatch assignment:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get dispatch assignments by status
app.get('/api/dispatch-assignments/status/:status', async (req, res) => {
  try {
    const { status } = req.params;
    const assignments = await DispatchAssignment.find({ status }).sort({ createdAt: -1 });
    console.log(`📋 Found ${assignments.length} dispatch assignments with status: ${status}`);
    res.json({ success: true, data: assignments });
  } catch (err) {
    console.error('Error fetching dispatch assignments by status:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get allocations by driver
app.get('/api/allocations/driver/:driverName', async (req, res) => {
  try {
    const { driverName } = req.params;
    const allocations = await DriverAllocation.find({ 
      assignedDriver: driverName 
    }).sort({ createdAt: -1 });
    console.log(`🚛 Found ${allocations.length} allocations for driver: ${driverName}`);
    res.json({ success: true, data: allocations });
  } catch (err) {
    console.error('Error fetching driver allocations:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin assign vehicle to driver
app.post('/admin/assign-vehicle', async (req, res) => {
  try {
    console.log('🔧 Admin assigning vehicle:', req.body);
    const { vehicleId, driverId, driverName, assignedBy, notes } = req.body;
    
    if (!vehicleId || !driverName) {
      return res.status(400).json({ success: false, error: 'Vehicle ID and driver name are required' });
    }
    
    // Update inventory status
    const updatedInventory = await Inventories.findByIdAndUpdate(
      vehicleId,
      {
        status: 'Assigned to Dispatch',
        assignedDriver: driverName,
        assignedAgent: assignedBy,
        dateAssigned: new Date()
      },
      { new: true }
    );
    
    if (!updatedInventory) {
      return res.status(404).json({ success: false, error: 'Vehicle not found' });
    }
    
    // Create allocation record
    const allocationData = {
      unitName: updatedInventory.unitName,
      unitId: updatedInventory.unitId,
      bodyColor: updatedInventory.bodyColor,
      variation: updatedInventory.variation,
      assignedDriver: driverName,
      status: 'Assigned',
      date: new Date(),
      assignedBy: assignedBy,
      notes: notes
    };
    
    const allocation = new DriverAllocation(allocationData);
    const savedAllocation = await allocation.save();
    
    console.log('✅ Vehicle assigned successfully:', savedAllocation._id);
    res.json({ 
      success: true, 
      data: { inventory: updatedInventory, allocation: savedAllocation },
      message: 'Vehicle assigned to driver successfully'
    });
  } catch (err) {
    console.error('❌ Error assigning vehicle:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get users endpoints for compatibility
app.get('/api/getUsers', async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json({ success: true, data: users });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

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
  console.log('  - GET  /api/users');
  console.log('  - GET  /api/getUsers');
  console.log('  - GET  /api/inventories');
  console.log('  - POST /api/inventories');
  console.log('  - PUT  /api/inventories/:id');
  console.log('  - DELETE /api/inventories/:id');
  console.log('  - GET  /api/vehicle-stock');
  console.log('  - GET  /api/getStock');
  console.log('  - POST /createAllocation');
  console.log('  - POST /api/createAllocation');
  console.log('  - GET  /api/allocations/driver/:driverName');
  console.log('  - POST /admin/assign-vehicle');
  console.log('  - GET  /api/dispatch-assignments');
  console.log('  - POST /api/dispatch-assignments');
  console.log('  - PUT  /api/dispatch-assignments/:id');
  console.log('  - GET  /api/dispatch-assignments/status/:status');
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
