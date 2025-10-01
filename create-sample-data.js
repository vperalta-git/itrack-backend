// Create sample data for testing the app
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection
const mongoURI = 'mongodb+srv://itrack_user:itrack123@cluster0.py8s8pl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// User Schema
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'supervisor', 'manager', 'salesAgent', 'driver'], default: 'salesAgent' },
  accountName: { type: String, required: true },
  email: { type: String, required: false },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  temporaryPassword: { type: String },
  temporaryPasswordExpires: { type: Date },
  lastLogin: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Inventory Schema
const InventorySchema = new mongoose.Schema({
  unitName: String,
  unitId: String,
  bodyColor: String,
  variation: String,
  conductionNumber: String,
  quantity: { type: Number, default: 1 },
  status: { type: String, default: 'Available' }
}, { timestamps: true });

// Driver Allocation Schema
const DriverAllocationSchema = new mongoose.Schema({
  unitName: String,
  unitId: String,
  bodyColor: String,
  variation: String,
  assignedDriver: String,
  assignedAgent: String,
  status: { type: String, default: 'Pending' },
  allocatedBy: String,
  requestedProcesses: [String],
  processStatus: {
    type: Map,
    of: Boolean,
    default: {}
  },
  processCompletedBy: {
    type: Map,
    of: String,
    default: {}
  },
  processCompletedAt: {
    type: Map,
    of: Date,
    default: {}
  },
  overallProgress: {
    completed: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    isComplete: { type: Boolean, default: false }
  },
  readyForRelease: { type: Boolean, default: false },
  releasedAt: Date,
  releasedBy: String,
  date: { type: Date, default: Date.now }
}, { timestamps: true });

// Create models
const User = mongoose.model('User', UserSchema);
const Inventory = mongoose.model('Inventory', InventorySchema);
const DriverAllocation = mongoose.model('DriverAllocation', DriverAllocationSchema);

async function createSampleData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB Atlas');

    // Clear existing data (optional - comment out if you want to keep existing data)
    // await User.deleteMany({});
    // await Inventory.deleteMany({});
    // await DriverAllocation.deleteMany({});
    // console.log('🗑️ Cleared existing data');

    // Create sample users
    console.log('👥 Creating sample users...');
    
    const sampleUsers = [
      {
        username: 'admin',
        password: await bcrypt.hash('admin123', 10),
        role: 'admin',
        accountName: 'System Administrator',
        email: 'admin@isuzu.com'
      },
      {
        username: 'manager1',
        password: await bcrypt.hash('manager123', 10),
        role: 'manager',
        accountName: 'Operations Manager',
        email: 'manager@isuzu.com'
      },
      {
        username: 'agent1',
        password: await bcrypt.hash('agent123', 10),
        role: 'salesAgent',
        accountName: 'Sales Agent 1',
        email: 'agent1@isuzu.com'
      },
      {
        username: 'agent2',
        password: await bcrypt.hash('agent123', 10),
        role: 'salesAgent',
        accountName: 'Sales Agent 2',
        email: 'agent2@isuzu.com'
      },
      {
        username: 'driver1',
        password: await bcrypt.hash('driver123', 10),
        role: 'driver',
        accountName: 'Driver Juan',
        email: 'driver1@isuzu.com'
      },
      {
        username: 'driver2',
        password: await bcrypt.hash('driver123', 10),
        role: 'driver',
        accountName: 'Driver Pedro',
        email: 'driver2@isuzu.com'
      },
      {
        username: 'driver3',
        password: await bcrypt.hash('driver123', 10),
        role: 'driver',
        accountName: 'Driver Jose',
        email: 'driver3@isuzu.com'
      }
    ];

    // Check if users already exist
    for (const userData of sampleUsers) {
      const existingUser = await User.findOne({ username: userData.username });
      if (!existingUser) {
        const user = new User(userData);
        await user.save();
        console.log(`✅ Created user: ${userData.username} (${userData.role})`);
      } else {
        console.log(`⚠️ User already exists: ${userData.username}`);
      }
    }

    // Create sample inventory
    console.log('📦 Creating sample inventory...');
    
    const sampleInventory = [
      {
        unitName: 'Isuzu NPR',
        unitId: 'NPR-001',
        bodyColor: 'White',
        variation: 'Dropside',
        conductionNumber: 'CN-NPR-001',
        quantity: 1,
        status: 'Available'
      },
      {
        unitName: 'Isuzu NPR',
        unitId: 'NPR-002',
        bodyColor: 'Blue',
        variation: 'Closed Van',
        conductionNumber: 'CN-NPR-002',
        quantity: 1,
        status: 'Available'
      },
      {
        unitName: 'Isuzu ELF',
        unitId: 'ELF-001',
        bodyColor: 'White',
        variation: 'Cargo',
        conductionNumber: 'CN-ELF-001',
        quantity: 1,
        status: 'Available'
      },
      {
        unitName: 'Isuzu ELF',
        unitId: 'ELF-002',
        bodyColor: 'Silver',
        variation: 'Dropside',
        conductionNumber: 'CN-ELF-002',
        quantity: 1,
        status: 'Available'
      },
      {
        unitName: 'Isuzu D-MAX',
        unitId: 'DMAX-001',
        bodyColor: 'Red',
        variation: 'LS-A 4x2',
        conductionNumber: 'CN-DMAX-001',
        quantity: 1,
        status: 'Available'
      },
      {
        unitName: 'Isuzu D-MAX',
        unitId: 'DMAX-002',
        bodyColor: 'Black',
        variation: 'LS-E 4x4',
        conductionNumber: 'CN-DMAX-002',
        quantity: 1,
        status: 'Available'
      },
      {
        unitName: 'Isuzu MU-X',
        unitId: 'MUX-001',
        bodyColor: 'Silver',
        variation: 'Blue Power',
        conductionNumber: 'CN-MUX-001',
        quantity: 1,
        status: 'Available'
      },
      {
        unitName: 'Isuzu MU-X',
        unitId: 'MUX-002',
        bodyColor: 'White',
        variation: 'LS-A',
        conductionNumber: 'CN-MUX-002',
        quantity: 1,
        status: 'Available'
      },
      {
        unitName: 'Isuzu GIGA',
        unitId: 'GIGA-001',
        bodyColor: 'Yellow',
        variation: 'CYZ51Q',
        conductionNumber: 'CN-GIGA-001',
        quantity: 1,
        status: 'Available'
      },
      {
        unitName: 'Isuzu Traviz',
        unitId: 'TRV-001',
        bodyColor: 'White',
        variation: 'Standard',
        conductionNumber: 'CN-TRV-001',
        quantity: 1,
        status: 'Available'
      }
    ];

    for (const invData of sampleInventory) {
      const existingItem = await Inventory.findOne({ unitId: invData.unitId });
      if (!existingItem) {
        const item = new Inventory(invData);
        await item.save();
        console.log(`✅ Created inventory: ${invData.unitName} - ${invData.unitId}`);
      } else {
        console.log(`⚠️ Inventory already exists: ${invData.unitId}`);
      }
    }

    // Create sample allocations
    console.log('🚛 Creating sample allocations...');
    
    const sampleAllocations = [
      {
        unitName: 'Isuzu NPR',
        unitId: 'NPR-001',
        bodyColor: 'White',
        variation: 'Dropside',
        assignedDriver: 'driver1',
        assignedAgent: 'agent1',
        status: 'Pending',
        allocatedBy: 'admin',
        requestedProcesses: ['tinting', 'carwash'],
        processStatus: {
          tinting: false,
          carwash: false
        }
      },
      {
        unitName: 'Isuzu D-MAX',
        unitId: 'DMAX-001',
        bodyColor: 'Red',
        variation: 'LS-A 4x2',
        assignedDriver: 'driver2',
        assignedAgent: 'agent2',
        status: 'In Transit',
        allocatedBy: 'admin',
        requestedProcesses: ['ceramic_coating', 'accessories'],
        processStatus: {
          ceramic_coating: true,
          accessories: false
        }
      },
      {
        unitName: 'Isuzu MU-X',
        unitId: 'MUX-001',
        bodyColor: 'Silver',
        variation: 'Blue Power',
        assignedDriver: 'driver3',
        assignedAgent: 'agent1',
        status: 'Assigned to Dispatch',
        allocatedBy: 'admin',
        requestedProcesses: ['tinting', 'carwash', 'rust_proof'],
        processStatus: {
          tinting: false,
          carwash: false,
          rust_proof: false
        }
      }
    ];

    for (const allocData of sampleAllocations) {
      const existingAlloc = await DriverAllocation.findOne({ unitId: allocData.unitId });
      if (!existingAlloc) {
        const allocation = new DriverAllocation(allocData);
        await allocation.save();
        console.log(`✅ Created allocation: ${allocData.unitName} - ${allocData.unitId}`);
      } else {
        console.log(`⚠️ Allocation already exists: ${allocData.unitId}`);
      }
    }

    console.log('');
    console.log('🎉 Sample data creation completed!');
    console.log('');
    console.log('📊 Summary:');
    const userCount = await User.countDocuments();
    const inventoryCount = await Inventory.countDocuments();
    const allocationCount = await DriverAllocation.countDocuments();
    
    console.log(`   - Users: ${userCount}`);
    console.log(`   - Inventory Items: ${inventoryCount}`);
    console.log(`   - Allocations: ${allocationCount}`);
    console.log('');
    console.log('🔐 Login Credentials:');
    console.log('   - Admin: admin / admin123');
    console.log('   - Manager: manager1 / manager123');
    console.log('   - Agent: agent1 / agent123 or agent2 / agent123');
    console.log('   - Driver: driver1 / driver123, driver2 / driver123, driver3 / driver123');
    console.log('');
    console.log('✅ You can now test the app with real database data!');

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
createSampleData();