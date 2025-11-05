// Script to reset user password to a known value
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB URI
const mongoURI = 'mongodb+srv://itrack_user:itrack123@cluster0.py8s8pl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// User Schema
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

async function resetPassword() {
  try {
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');
    
    // Find the user
    const user = await User.findOne({ email: 'vionneulrichp@gmail.com' });
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }
    
    // Set a simple password
    const newPassword = 'test123';
    user.password = newPassword; // Set as plain text for now
    await user.save();
    
    console.log('✅ Password reset successfully!');
    console.log('   Email:', user.email);
    console.log('   New Password:', newPassword);
    console.log('   Now you can login with: vionneulrichp@gmail.com / test123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetPassword();