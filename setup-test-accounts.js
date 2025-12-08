const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection
const mongoUri = 'mongodb+srv://itrack_user:itrack123@cluster0.py8s8pl.mongodb.net/itrackDB?retryWrites=true&w=majority&appName=Cluster0';

// User Schema (from server.js)
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  accountName: { type: String },
  email: { type: String, required: true },
  name: { type: String },
  isActive: { type: Boolean, default: true },
  profilePicture: { type: String },
  phoneNumber: { type: String },
  phoneno: { type: String },
  createdBy: { type: String },
  updatedBy: { type: String },
  assignedTo: { type: String },
  lastLogin: { type: Date },
  temporaryPassword: { type: String },
  temporaryPasswordExpires: { type: Date }
}, {
  timestamps: true
});

const User = mongoose.model('User', UserSchema);

const testAccounts = [
  {
    username: 'admin',
    email: 'admin@itrack.com',
    password: 'admin123',
    role: 'Admin',
    name: 'Test Admin User',
    accountName: 'Test Admin',
    phoneNumber: '+1234567890',
    isActive: true
  },
  {
    username: 'driver',
    email: 'driver@itrack.com', 
    password: 'driver123',
    role: 'Driver',
    name: 'Test Driver User',
    accountName: 'Test Driver',
    phoneNumber: '+1234567892',
    isActive: true
  },
  {
    username: 'dispatch',
    email: 'dispatch@itrack.com',
    password: 'dispatch123', 
    role: 'Dispatch',
    name: 'Test Dispatch User',
    accountName: 'Test Dispatch',
    phoneNumber: '+1234567891',
    isActive: true
  },
  {
    username: 'agent',
    email: 'agent@itrack.com',
    password: 'agent123',
    role: 'Sales Agent',
    name: 'Test Sales Agent',
    accountName: 'Test Agent', 
    phoneNumber: '+1234567893',
    isActive: true
  },
  {
    username: 'manager',
    email: 'manager@itrack.com',
    password: 'manager123',
    role: 'Manager',
    name: 'Test Manager User',
    accountName: 'Test Manager',
    phoneNumber: '+1234567894',
    isActive: true
  }
];

async function setupTestAccounts() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    for (const accountData of testAccounts) {
      console.log(`\n🔄 Processing ${accountData.role}: ${accountData.email}`);
      
      // Check if user already exists
      const existingUser = await User.findOne({ email: accountData.email });
      
      if (existingUser) {
        console.log(`📝 Updating existing user: ${accountData.email}`);
        
        // Hash password
        const hashedPassword = await bcrypt.hash(accountData.password, 12);
        
        // Update user
        await User.updateOne(
          { email: accountData.email },
          { 
            ...accountData,
            password: hashedPassword,
            updatedAt: new Date(),
            updatedBy: 'Setup Script'
          }
        );
        
        console.log(`✅ Updated ${accountData.role}: ${accountData.email}`);
      } else {
        console.log(`🆕 Creating new user: ${accountData.email}`);
        
        // Hash password
        const hashedPassword = await bcrypt.hash(accountData.password, 12);
        
        // Create new user
        const newUser = new User({
          ...accountData,
          password: hashedPassword,
          phoneno: accountData.phoneNumber,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'Setup Script',
          updatedBy: 'Setup Script'
        });
        
        await newUser.save();
        console.log(`✅ Created ${accountData.role}: ${accountData.email}`);
      }
    }
    
    console.log('\n🎉 All test accounts setup completed!');
    console.log('\n📋 Login Credentials:');
    testAccounts.forEach(account => {
      console.log(`   ${account.role}: ${account.email} / ${account.password}`);
    });
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

setupTestAccounts();