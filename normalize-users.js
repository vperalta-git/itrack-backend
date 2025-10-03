const mongoose = require('mongoose');

// MongoDB connection string
const mongoURI = 'mongodb+srv://itrack_user:itrack123@cluster0.py8s8pl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// User Schema (same as server.js)
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

async function normalizeUsers() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB Atlas');

    // Get all users
    const users = await User.find({});
    console.log(`📊 Found ${users.length} users to normalize`);

    let updatedCount = 0;

    for (const user of users) {
      let needsUpdate = false;
      const updates = {};

      // Normalize role to lowercase
      if (user.role) {
        const normalizedRole = user.role.toLowerCase();
        if (normalizedRole !== user.role) {
          updates.role = normalizedRole;
          needsUpdate = true;
        }
      }

      // Move 'name' field to 'accountName' if accountName is missing
      if (!user.accountName && user.name) {
        updates.accountName = user.name;
        needsUpdate = true;
      }

      // Set default accountName if both are missing
      if (!user.accountName && !user.name) {
        updates.accountName = user.username || 'Unknown User';
        needsUpdate = true;
      }

      // Ensure phoneno field is properly named (some might have variations)
      if (user.phoneno && !user.phone) {
        // Keep phoneno as is - this is correct
      }

      if (needsUpdate) {
        await User.findByIdAndUpdate(user._id, updates);
        console.log(`✅ Updated user: ${user.username} - Role: ${updates.role || user.role}, AccountName: ${updates.accountName || user.accountName}`);
        updatedCount++;
      } else {
        console.log(`⚠️  User already normalized: ${user.username}`);
      }
    }

    console.log(`\n🎉 Normalization complete!`);
    console.log(`📊 Total users: ${users.length}`);
    console.log(`🔄 Users updated: ${updatedCount}`);
    console.log(`✅ Users already normalized: ${users.length - updatedCount}`);

    // Show final user list
    const normalizedUsers = await User.find({}).select('-password -temporaryPassword');
    console.log('\n📋 Final user list:');
    normalizedUsers.forEach(user => {
      console.log(`   - ${user.username} (${user.role}) - ${user.accountName || user.name}`);
    });

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error normalizing users:', error);
    await mongoose.disconnect();
  }
}

normalizeUsers();