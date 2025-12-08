const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection
const mongoURI = 'mongodb+srv://itrack_user:itrack123@cluster0.py8s8pl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(mongoURI)
  .then(() => console.log('✅ Connected to MongoDB for user update'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Updated User Schema with correct roles
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'Dispatch', 'Driver', 'Supervisor', 'Manager', 'SalesAgent'], default: 'SalesAgent' },
  accountName: { type: String, required: true },
  email: { type: String, required: false },
  name: { type: String, required: false }, // Additional name field
  isActive: { type: Boolean, default: true },
  profilePicture: { type: String, default: null },
  phoneNumber: { type: String, required: false },
  phoneno: { type: String, required: false }, // Alternative phone field
  createdBy: { type: String, default: 'System' },
  updatedBy: { type: String, default: 'System' },
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

// Define the users to create/update
const usersToUpdate = [
  {
    _id: new mongoose.Types.ObjectId("68efddaf0730288a12a16d9a"),
    username: "vionne",
    password: "password",
    role: "Admin",
    accountName: "Vionne Peralta",
    email: "vionneulrichp@gmail.com",
    name: "Vionne Peralta",
    isActive: true,
    profilePicture: null,
    phoneNumber: "09478516430",
    phoneno: "09478516430",
    createdBy: "System",
    updatedBy: "System",
    assignedTo: null
  },
  {
    _id: new mongoose.Types.ObjectId("68efddaf0730288a12a16d9d"),
    username: "valenzuela",
    password: "valenzuela",
    role: "Admin",
    accountName: "Yuri",
    email: "yuri@itrack.com",
    name: "Yuri Valenzuela",
    isActive: true,
    profilePicture: null,
    phoneNumber: "+639123456790",
    phoneno: "+639123456790",
    createdBy: "System",
    updatedBy: "System",
    assignedTo: null
  },
  {
    _id: new mongoose.Types.ObjectId("68ff73ee6934f520e07a5f45"),
    username: "admin",
    password: "password",
    role: "Admin",
    accountName: "Test Admin",
    email: "admin@itrack.com",
    name: "Test Admin User",
    isActive: true,
    profilePicture: null,
    phoneNumber: "+1234567890",
    phoneno: "+1234567890",
    createdBy: "System",
    updatedBy: "System"
  },
  {
    _id: new mongoose.Types.ObjectId("68ff73ee6934f520e07a5f4c"),
    username: "dispatch",
    password: "password",
    role: "Dispatch",
    accountName: "Test Dispatch",
    email: "dispatch@itrack.com",
    name: "Test Dispatch User",
    isActive: true,
    profilePicture: null,
    phoneNumber: "+1234567891",
    phoneno: "+1234567891",
    createdBy: "System",
    updatedBy: "System"
  },
  {
    _id: new mongoose.Types.ObjectId("68ff73ee6934f520e07a5f4f"),
    username: "driver",
    password: "password",
    role: "Driver",
    accountName: "Test Driver",
    email: "driver@itrack.com",
    name: "Test Driver User",
    isActive: true,
    profilePicture: null,
    phoneNumber: "+1234567892",
    phoneno: "+1234567892",
    createdBy: "System",
    updatedBy: "System"
  }
];

async function updateUsers() {
  try {
    console.log('🚀 Starting user accounts update...\n');

    // Clear existing users first
    const deleteResult = await User.deleteMany({});
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing user(s)`);

    // Insert new users with hashed passwords
    const saltRounds = 10;
    for (const userData of usersToUpdate) {
      try {
        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
        userData.password = hashedPassword;
        
        const user = new User(userData);
        await user.save();
        console.log(`✅ Created/Updated user: ${userData.username} (${userData.role})`);
      } catch (error) {
        console.error(`❌ Error creating user ${userData.username}:`, error.message);
      }
    }

    console.log('\n🎉 User accounts update completed successfully!');
    
    // Verify the users were created
    const allUsers = await User.find({}, { password: 0 }); // Exclude passwords from output
    console.log('\n📋 Current users in database:');
    allUsers.forEach(user => {
      console.log(`   - ${user.username} (${user.role}) - ${user.accountName}`);
    });

  } catch (error) {
    console.error('❌ Error updating users:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the update
updateUsers();