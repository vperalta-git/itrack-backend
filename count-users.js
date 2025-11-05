// Direct database query to count all users
const mongoose = require('mongoose');

// MongoDB URI
const mongoURI = 'mongodb+srv://itrack_user:itrack123@cluster0.py8s8pl.mongodb.net/itrackDB?retryWrites=true&w=majority&appName=Cluster0';

// User Schema - Exact same as server.js
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'supervisor', 'manager', 'salesAgent'], default: 'salesAgent' },
  accountName: { type: String, required: true },
  email: { type: String, required: false },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  temporaryPassword: { type: String },
  temporaryPasswordExpires: { type: Date },
  lastLogin: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

async function countAllUsers() {
  try {
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB Atlas');
    
    // Show current database info
    console.log(`🗄️  Database name: ${mongoose.connection.db.databaseName}`);
    console.log(`🔗 Connection string: ${mongoURI.split('@')[1]}`); // Hide credentials
    
    // Count total users
    const totalCount = await User.countDocuments({});
    console.log(`📊 Total users in database: ${totalCount}`);
    
    // Get all users with details
    const allUsers = await User.find({}).select('username email role accountName isActive');
    console.log(`📋 Retrieved ${allUsers.length} users:`);
    
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} | ${user.email || 'No email'} | ${user.role} | ${user.accountName} | Active: ${user.isActive !== false}`);
    });
    
    // Check for different collections or databases
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📁 Available collections:');
    collections.forEach(col => {
      console.log(`  - ${col.name}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

countAllUsers();