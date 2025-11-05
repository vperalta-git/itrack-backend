// Quick script to create the user for testing
const mongoose = require('mongoose');

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

async function createTestUser() {
  try {
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');
    
    // Check if user exists
    const existingUser = await User.findOne({ 
      $or: [
        { email: 'vionneulrichp@gmail.com' },
        { username: 'vionne' },
        { username: 'vionneulrich' }
      ]
    });
    if (existingUser) {
      console.log('✅ User found:', existingUser.email || existingUser.username);
      console.log('   Username:', existingUser.username);
      console.log('   Password:', existingUser.password);
      console.log('   Email:', existingUser.email);
      console.log('   Account Name:', existingUser.accountName);
      process.exit(0);
    }
    
    // Create the user
    const newUser = new User({
      username: 'vionneulrich',
      password: 'password', // Use a simple password for testing
      role: 'salesAgent',
      accountName: 'Vionne Ulrich P',
      email: 'vionneulrichp@gmail.com'
    });
    
    await newUser.save();
    console.log('✅ User created successfully!');
    console.log('   Email:', newUser.email);
    console.log('   Username:', newUser.username);
    console.log('   Password:', newUser.password);
    console.log('   Role:', newUser.role);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createTestUser();