const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const nodemailer = require('nodemailer');

const app = express();

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'itrack-mobile-session-secret-key-2025',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: 'mongodb+srv://itrack_user:itrack123@cluster0.py8s8pl.mongodb.net/itrackDB?retryWrites=true&w=majority&appName=Cluster0',
    touchAfter: 24 * 3600 // lazy session update
  }),
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
  }
}));

app.use(cors({
  credentials: true,
  origin: true // Configure properly for production
}));
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

// ==================== EMAIL CONFIGURATION ====================

// Gmail configuration for sending emails
let transporter;

function initializeEmailService() {
  console.log('📧 Initializing Gmail service...');
  
  const emailConfig = {
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER || 'your-email@gmail.com',
      pass: process.env.GMAIL_APP_PASSWORD || 'your-app-password'
    }
  };

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.log('⚠️  Gmail credentials not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD environment variables.');
    console.log('📝 To set up Gmail App Password:');
    console.log('   1. Go to Google Account settings');
    console.log('   2. Enable 2-Factor Authentication');
    console.log('   3. Generate an App Password for "Mail"');
    console.log('   4. Set GMAIL_USER=your-email@gmail.com');
    console.log('   5. Set GMAIL_APP_PASSWORD=your-16-digit-app-password');
    return;
  }

  try {
    transporter = nodemailer.createTransporter(emailConfig);
    console.log('✅ Gmail service initialized successfully');
    
    // Test the connection
    transporter.verify((error, success) => {
      if (error) {
        console.log('❌ Gmail connection failed:', error.message);
      } else {
        console.log('✅ Gmail is ready to send emails');
      }
    });
  } catch (error) {
    console.error('❌ Failed to initialize Gmail service:', error);
  }
}

// Initialize email service
initializeEmailService();

// Email sending utility function
async function sendPasswordResetEmail(userEmail, username, temporaryPassword) {
  if (!transporter) {
    console.log('❌ Email service not configured');
    return { success: false, message: 'Email service not configured' };
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .temp-password { background: #fff; padding: 20px; border: 2px solid #667eea; border-radius: 8px; font-size: 18px; font-weight: bold; text-align: center; margin: 20px 0; letter-spacing: 2px; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
            .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Password Reset - I-Track Mobile</h1>
                <p>Temporary access credentials</p>
            </div>
            <div class="content">
                <h2>Hello ${username},</h2>
                <p>You have requested a password reset for your I-Track Mobile account. Here are your temporary login credentials:</p>
                
                <div class="temp-password">
                    ${temporaryPassword}
                </div>
                
                <div class="warning">
                    <strong>⚠️ Important Security Notice:</strong>
                    <ul>
                        <li>This temporary password expires in 1 hour</li>
                        <li>You will be required to change your password immediately after logging in</li>
                        <li>Do not share this password with anyone</li>
                        <li>If you didn't request this reset, please contact your administrator</li>
                    </ul>
                </div>
                
                <h3>Next Steps:</h3>
                <ol>
                    <li>Open your I-Track Mobile app</li>
                    <li>Log in using your username and the temporary password above</li>
                    <li>You will be prompted to set a new permanent password</li>
                    <li>Choose a strong password with at least 8 characters</li>
                </ol>
                
                <div class="footer">
                    <p>This email was sent automatically by I-Track Mobile System</p>
                    <p>If you need assistance, please contact your system administrator</p>
                    <p><strong>I-Track Mobile © ${new Date().getFullYear()}</strong></p>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"I-Track Mobile System" <${process.env.GMAIL_USER}>`,
    to: userEmail,
    subject: '🔐 I-Track Mobile - Password Reset Request',
    html: htmlContent,
    text: `Hello ${username},\n\nYour temporary password for I-Track Mobile is: ${temporaryPassword}\n\nThis password expires in 1 hour. Please log in and change your password immediately.\n\nI-Track Mobile System`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent successfully to:', userEmail);
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return { success: false, message: 'Failed to send email', error: error.message };
  }
}

// MongoDB URI for your MongoDB Atlas cluster
const mongoURI = 'mongodb+srv://itrack_user:itrack123@cluster0.py8s8pl.mongodb.net/itrackDB?retryWrites=true&w=majority&appName=Cluster0';

// Connect to MongoDB
mongoose.connect(mongoURI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// User Schema with Role Validation and Enhanced Password Management
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'supervisor', 'manager', 'salesAgent'], default: 'salesAgent' },
  accountName: { type: String, required: true },
  email: { type: String, required: false }, // For password reset functionality
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Enhanced password management fields
  temporaryPassword: { type: String },
  temporaryPasswordExpires: { type: Date },
  lastLogin: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
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

// Enhanced Login with Temporary Password Support
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('📥 Login attempt for:', username);

    // Check admin credentials first
    if (username === 'isuzupasigadmin' && password === 'Isuzu_Pasig1') {
      req.session.user = {
        username: 'isuzupasigadmin',
        role: 'admin',
        accountName: 'Isuzu Pasig Admin'
      };
      return res.json({ success: true, role: 'admin', accountName: 'Isuzu Pasig Admin' });
    }

    // Find user in database - check both email and username
    const user = await User.findOne({
      $or: [
        { email: username.toLowerCase() },
        { username: username.toLowerCase() }
      ]
    });
    
    if (!user) {
      console.log('❌ User not found with identifier:', username);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    console.log('✅ User found:', user.email || user.username, 'Role:', user.role);

    let isValidLogin = false;
    let isTemporaryPassword = false;

    // Check if using temporary password
    if (user.temporaryPassword && 
        user.temporaryPasswordExpires && 
        user.temporaryPasswordExpires > Date.now()) {
      
      if (password === user.temporaryPassword) {
        isValidLogin = true;
        isTemporaryPassword = true;
        
        console.log('🔑 User logged in with temporary password:', username);
        
        // Clear temporary password after successful use
        user.temporaryPassword = undefined;
        user.temporaryPasswordExpires = undefined;
        await user.save();
      }
    }

    // If not using temporary password, check regular password
    if (!isValidLogin && user.password) {
      // Try bcrypt comparison first (for hashed passwords)
      try {
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
          isValidLogin = true;
          console.log('🔑 User logged in with hashed password:', user.email || user.username);
        }
      } catch (bcryptError) {
        console.log('🔍 bcrypt failed, trying plain text comparison');
        
        // If bcrypt fails, try plain text comparison (for legacy passwords)
        if (password === user.password) {
          isValidLogin = true;
          console.log('🔑 User logged in with plain text password:', user.email || user.username);
          console.log('⚠️  Consider hashing this password for security');
        }
      }
    }

    if (!isValidLogin) {
      console.log('❌ Login failed - Invalid password for:', user.email || user.username);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Create session
    const sessionUser = {
      id: user._id,
      username: user.username,
      role: user.role,
      accountName: user.accountName,
      assignedTo: user.assignedTo
    };

    req.session.user = sessionUser;

    const response = {
      success: true,
      role: user.role,
      accountName: user.accountName,
      user: sessionUser
    };

    // If temporary password was used, notify frontend to prompt password change
    if (isTemporaryPassword) {
      response.requirePasswordChange = true;
      response.message = 'Login successful with temporary password. Please change your password immediately.';
      console.log('⚠️  User should change password immediately:', username);
    }

    console.log('✅ Login successful for:', user.email || user.username);
    res.json(response);
  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// ==================== PASSWORD MANAGEMENT ROUTES ====================

// Forgot Password - Send temporary password via email
app.post('/forgot-password', async (req, res) => {
  try {
    const { username } = req.body;
    console.log('🔑 Forgot password request for:', username);

    if (!username) {
      return res.status(400).json({ success: false, message: 'Username is required' });
    }

    // Find user by username
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({ 
        success: true, 
        message: 'If the username exists and has an email, a temporary password has been sent.' 
      });
    }

    if (!user.email) {
      return res.json({ 
        success: true, 
        message: 'If the username exists and has an email, a temporary password has been sent.' 
      });
    }

    // Generate temporary password (8 characters, alphanumeric)
    const temporaryPassword = Math.random().toString(36).slice(-8).toUpperCase();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Save temporary password to user
    user.temporaryPassword = temporaryPassword;
    user.temporaryPasswordExpires = expiresAt;
    await user.save();

    // Send email with temporary password
    const emailResult = await sendPasswordResetEmail(user.email, user.username, temporaryPassword);
    
    if (emailResult.success) {
      console.log('✅ Temporary password sent to:', user.email);
      res.json({ 
        success: true, 
        message: 'Temporary password sent to your email address. Please check your inbox.' 
      });
    } else {
      console.error('❌ Failed to send email:', emailResult.message);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send email. Please contact administrator.' 
      });
    }

  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Change Password - For logged-in users
app.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    console.log('🔐 Change password request for user:', req.session?.user?.username);

    // Check if user is logged in
    if (!req.session?.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
    }

    // Find user
    const user = await User.findById(req.session.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    user.password = hashedNewPassword;
    user.updatedAt = new Date();
    await user.save();

    console.log('✅ Password changed successfully for user:', user.username);
    res.json({ success: true, message: 'Password changed successfully' });

  } catch (error) {
    console.error('❌ Change password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get current user info (for profile)
app.get('/profile', (req, res) => {
  try {
    if (!req.session?.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    res.json({ 
      success: true, 
      user: req.session.user 
    });
  } catch (error) {
    console.error('❌ Profile fetch error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Logout
app.post('/logout', (req, res) => {
  try {
    console.log('👋 Logout request from:', req.session?.user?.username);
    
    req.session.destroy((err) => {
      if (err) {
        console.error('❌ Logout error:', err);
        return res.status(500).json({ success: false, message: 'Could not log out' });
      }
      
      res.json({ success: true, message: 'Logged out successfully' });
    });
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
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

// ========== USER MANAGEMENT ENDPOINTS ==========

// Get all users (mobile app endpoint)
app.get('/getUsers', async (req, res) => {
  try {
    const users = await User.find({}).select('-password -temporaryPassword');
    console.log(`📊 Found ${users.length} users`);
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('❌ Get users error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API Get Users route (for web compatibility)
app.get('/api/getUsers', async (req, res) => {
  try {
    const users = await User.find({}).select('-password -temporaryPassword');
    console.log(`📊 API Found ${users.length} users`);
    res.json(users); // Web version expects direct array, not wrapped in success object
  } catch (error) {
    console.error('❌ API Get users error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== INVENTORY MANAGEMENT ENDPOINTS ==========

// Inventory Schema
const InventorySchema = new mongoose.Schema({
  unitName: String,
  unitId: String,
  bodyColor: String,
  variation: String,
  engineNumber: String,
  chassisNumber: String,
  location: {
    latitude: Number,
    longitude: Number,
    address: String,
    lastUpdated: Date
  }
}, { timestamps: true });
const Inventory = mongoose.model('Inventory', InventorySchema);

// Get all inventory/stock
app.get('/getStock', async (req, res) => {
  try {
    const inventory = await Inventory.find({});
    console.log(`📦 Found ${inventory.length} inventory items`);
    res.json({ success: true, data: inventory });
  } catch (error) {
    console.error('❌ Get inventory error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create inventory item
app.post('/createStock', async (req, res) => {
  try {
    const newItem = new Inventory(req.body);
    await newItem.save();
    console.log('📦 Created new inventory item:', newItem.unitId);
    res.json({ success: true, data: newItem });
  } catch (error) {
    console.error('❌ Create inventory error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== ALLOCATION MANAGEMENT ENDPOINTS ==========

// Get all allocations
app.get('/getAllocation', async (req, res) => {
  try {
    const allocations = await DriverAllocation.find({});
    console.log(`🚛 Found ${allocations.length} allocations`);
    res.json({ success: true, data: allocations });
  } catch (error) {
    console.error('❌ Get allocations error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create allocation
app.post('/createAllocation', async (req, res) => {
  try {
    const newAllocation = new DriverAllocation(req.body);
    await newAllocation.save();
    console.log('🚛 Created new allocation:', newAllocation.unitId);
    res.json({ success: true, data: newAllocation });
  } catch (error) {
    console.error('❌ Create allocation error:', error);
    res.status(500).json({ success: false, error: error.message });
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
