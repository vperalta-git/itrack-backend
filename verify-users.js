const mongoose = require('mongoose');

// MongoDB connection
const mongoURI = 'mongodb+srv://itrack_user:itrack123@cluster0.py8s8pl.mongodb.net/itrackDB?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(mongoURI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// User Schema - same as server
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'Dispatch', 'Driver', 'Supervisor', 'Manager', 'SalesAgent'], default: 'SalesAgent' },
  accountName: { type: String, required: true },
  email: { type: String, required: false },
  name: { type: String, required: false },
  isActive: { type: Boolean, default: true },
  profilePicture: { type: String, default: null },
  phoneNumber: { type: String, required: false },
  phoneno: { type: String, required: false },
  createdBy: { type: String, default: 'System' },
  updatedBy: { type: String, default: 'System' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  temporaryPassword: { type: String },
  temporaryPasswordExpires: { type: Date },
  lastLogin: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

async function verifyUsers() {
  try {
    const users = await User.find({}, { password: 0 }); // Exclude passwords for security
    
    console.log('📋 Current users in database:');
    console.log('========================================');
    
    users.forEach(user => {
      console.log(`👤 Username: ${user.username}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Account Name: ${user.accountName}`);
      console.log(`   Email: ${user.email || 'N/A'}`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('   ---');
    });
    
    console.log(`\n✅ Total users: ${users.length}`);
    
    // Test password verification
    const bcrypt = require('bcryptjs');
    const testUser = await User.findOne({ username: 'admin' });
    if (testUser) {
      const isValidPassword = await bcrypt.compare('admin123', testUser.password);
      console.log(`🔐 Password hash test (admin/admin123): ${isValidPassword ? '✅ VALID' : '❌ INVALID'}`);
      
      // Also test other common passwords
      const isOldPassword = await bcrypt.compare('password', testUser.password);
      console.log(`🔐 Password hash test (admin/password): ${isOldPassword ? '✅ VALID' : '❌ INVALID'}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

verifyUsers();