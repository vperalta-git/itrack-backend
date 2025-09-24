// create-test-users.js - Create test users for I-Track system
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import User model
const User = require('./models/User');

const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://itrack_user:itrack123@cluster0.py8s8pl.mongodb.net/itrackDB?retryWrites=true&w=majority&appName=Cluster0';

const testUsers = [
  {
    accountName: 'testadmin',
    password: 'admin123',
    role: 'Admin',
    profile: {
      firstName: 'Test',
      lastName: 'Administrator',
      email: 'admin@itrack.com',
      phoneNumber: '+63 917 123 4567'
    }
  },
  {
    accountName: 'testdriver1',
    password: 'driver123',
    role: 'Driver',
    profile: {
      firstName: 'Juan',
      lastName: 'Driver',
      email: 'juan@itrack.com',
      phoneNumber: '+63 917 234 5678'
    }
  },
  {
    accountName: 'testdriver2',
    password: 'driver123',
    role: 'Driver',
    profile: {
      firstName: 'Maria',
      lastName: 'Conductor',
      email: 'maria@itrack.com',
      phoneNumber: '+63 917 345 6789'
    }
  },
  {
    accountName: 'testagent1',
    password: 'agent123',
    role: 'Sales Agent',
    profile: {
      firstName: 'Carlos',
      lastName: 'Sales',
      email: 'carlos@itrack.com',
      phoneNumber: '+63 917 456 7890'
    }
  },
  {
    accountName: 'testagent2',
    password: 'agent123',
    role: 'Sales Agent',
    profile: {
      firstName: 'Ana',
      lastName: 'Marketing',
      email: 'ana@itrack.com',
      phoneNumber: '+63 917 567 8901'
    }
  },
  {
    accountName: 'testmanager',
    password: 'manager123',
    role: 'Manager',
    profile: {
      firstName: 'Robert',
      lastName: 'Manager',
      email: 'manager@itrack.com',
      phoneNumber: '+63 917 678 9012'
    }
  }
];

async function createTestUsers() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    console.log('🧹 Clearing existing test users...');
    await User.deleteMany({ accountName: { $in: testUsers.map(u => u.accountName) } });

    console.log('👥 Creating test users...');
    for (const userData of testUsers) {
      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      const user = new User({
        username: userData.accountName, // Use accountName as username
        accountName: userData.accountName,
        password: hashedPassword,
        role: userData.role,
        email: userData.profile.email,
        phoneNumber: userData.profile.phoneNumber,
        isActive: true,
        createdAt: new Date(),
        lastLogin: null
      });

      await user.save();
      console.log(`✅ Created ${userData.role}: ${userData.accountName} (${userData.profile.firstName} ${userData.profile.lastName})`);
    }

    console.log('\n🎉 Test users created successfully!');
    console.log('\n📋 Login Credentials:');
    testUsers.forEach(user => {
      console.log(`${user.role}: ${user.accountName} / ${user.password}`);
    });

    console.log('\n📊 Summary:');
    const userCount = await User.countDocuments();
    console.log(`Total users in database: ${userCount}`);

  } catch (error) {
    console.error('❌ Error creating test users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

createTestUsers();