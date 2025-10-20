const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection string (same as server.js)
const mongoURI = 'mongodb+srv://vionne:4bgQHXOxMr2LLYfH@cluster0.fgzaa.mongodb.net/itrackDB?retryWrites=true&w=majority&appName=Cluster0';

// User Schema (same as server.js)
const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: String,
  accountName: String,
  assignedTo: String,
  email: String,
  phone: String,
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  createdBy: String,
  temporaryPassword: String,
  temporaryPasswordExpires: Date
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

async function addAdminUser() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB Atlas');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      await mongoose.disconnect();
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create admin user
    const adminUser = new User({
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
      accountName: 'System Administrator',
      email: 'admin@itrack.com',
      phone: '+63 2 8234 5678',
      isActive: true,
      createdBy: 'System'
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   Role: admin');
    console.log('   Account Name: System Administrator');

    // Verify the user was created
    const users = await User.find({});
    console.log(`\n📊 Total users in database: ${users.length}`);
    console.log('👥 Users:');
    users.forEach(user => {
      console.log(`   - ${user.username} (${user.role}) - ${user.accountName}`);
    });

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error adding admin user:', error);
    await mongoose.disconnect();
  }
}

addAdminUser();