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
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null }
}, { collection: 'dispatchassignments' });

DispatchAssignmentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
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
    const { processType, completed, completedBy } = req.body;
    console.log('🔧 Updating process status:', processType, 'to', completed);
    
    const assignment = await DispatchAssignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Dispatch assignment not found'
      });
    }
    
    // Update process status
    assignment.processStatus[processType] = completed;
    
    // Add note for process completion
    assignment.notes.push({
      author: completedBy || 'System',
      message: `Process ${processType} ${completed ? 'completed' : 'marked incomplete'}`,
      timestamp: new Date(),
      processType: processType
    });
    
    // Check if all processes are completed
    const allCompleted = assignment.processes.every(
      process => assignment.processStatus[process] === true
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
