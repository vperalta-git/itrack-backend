const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const DriverAllocation = require('./models/DriverAllocation');
const Inventory = require('./models/Inventory');

// MongoDB connection
const mongoURI = process.env.MONGODB_URI || 
  'mongodb+srv://itrack_user:' + (process.env.MONGODB_PASSWORD || 'fallback_password') + '@cluster0.py8s8pl.mongodb.net/itrackDB?retryWrites=true&w=majority&appName=Cluster0';

console.log('🚀 Connecting to MongoDB to add test data...');

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('✅ Connected to MongoDB Atlas');
  await addTestData();
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

async function addTestData() {
  try {
    console.log('📊 Adding test driver allocations...');
    
    const testAllocations = [
      {
        unitName: 'Isuzu NPR',
        unitId: 'NPR001',
        bodyColor: 'White',
        variation: 'Dropside',
        assignedDriver: 'Juan Cruz',
        assignedAgent: 'Maria Santos',
        status: 'In Transit',
        allocatedBy: 'Admin System',
        requestedProcesses: ['tinting', 'carwash'],
        processStatus: {
          tinting: true,
          carwash: false,
          ceramic_coating: false,
          accessories: false,
          rust_proof: false
        },
        readyForRelease: false
      },
      {
        unitName: 'Isuzu ELF',
        unitId: 'ELF002',
        bodyColor: 'Blue',
        variation: 'Closed Van',
        assignedDriver: 'Pedro Dela Cruz',
        assignedAgent: 'Ana Lopez',
        status: 'Pending',
        allocatedBy: 'Admin System',
        requestedProcesses: ['ceramic_coating', 'accessories'],
        processStatus: {
          tinting: false,
          carwash: false,
          ceramic_coating: false,
          accessories: false,
          rust_proof: false
        },
        readyForRelease: false
      },
      {
        unitName: 'Isuzu GIGA',
        unitId: 'GIGA003',
        bodyColor: 'Red',
        variation: 'Cargo',
        assignedDriver: 'Jose Rizal',
        assignedAgent: 'Carmen Garcia',
        status: 'Delivered',
        allocatedBy: 'Admin System',
        requestedProcesses: ['tinting', 'carwash', 'ceramic_coating', 'rust_proof'],
        processStatus: {
          tinting: true,
          carwash: true,
          ceramic_coating: true,
          accessories: false,
          rust_proof: true
        },
        readyForRelease: true,
        releasedAt: new Date('2024-09-15'),
        releasedBy: 'Admin System'
      },
      {
        unitName: 'Isuzu MU-X',
        unitId: 'MUX004',
        bodyColor: 'Silver',
        variation: 'SUV',
        assignedDriver: 'Antonio Luna',
        assignedAgent: 'Rosa Martinez',
        status: 'In Transit',
        allocatedBy: 'Admin System',
        requestedProcesses: ['accessories', 'rust_proof'],
        processStatus: {
          tinting: false,
          carwash: false,
          ceramic_coating: false,
          accessories: true,
          rust_proof: false
        },
        readyForRelease: false
      },
      {
        unitName: 'Isuzu D-MAX',
        unitId: 'DMAX005',
        bodyColor: 'Black',
        variation: 'Pickup',
        assignedDriver: 'Emilio Aguinaldo',
        assignedAgent: 'Sofia Reyes',
        status: 'Pending',
        allocatedBy: 'Admin System',
        requestedProcesses: ['tinting', 'ceramic_coating'],
        processStatus: {
          tinting: false,
          carwash: false,
          ceramic_coating: false,
          accessories: false,
          rust_proof: false
        },
        readyForRelease: false
      }
    ];

    // Clear existing allocations and add new ones
    await DriverAllocation.deleteMany({});
    const createdAllocations = await DriverAllocation.insertMany(testAllocations);
    console.log(`✅ Created ${createdAllocations.length} test driver allocations`);

    console.log('📦 Adding test inventory items...');
    
    const testInventory = [
      {
        unitName: 'Isuzu NPR',
        unitId: 'INV-NPR-001',
        bodyColor: 'White',
        variation: 'Dropside'
      },
      {
        unitName: 'Isuzu NPR',
        unitId: 'INV-NPR-002',
        bodyColor: 'Blue',
        variation: 'Dropside'
      },
      {
        unitName: 'Isuzu ELF',
        unitId: 'INV-ELF-001',
        bodyColor: 'White',
        variation: 'Closed Van'
      },
      {
        unitName: 'Isuzu ELF',
        unitId: 'INV-ELF-002',
        bodyColor: 'Gray',
        variation: 'Open Van'
      },
      {
        unitName: 'Isuzu GIGA',
        unitId: 'INV-GIGA-001',
        bodyColor: 'Yellow',
        variation: 'Cargo'
      },
      {
        unitName: 'Isuzu MU-X',
        unitId: 'INV-MUX-001',
        bodyColor: 'Silver',
        variation: 'SUV'
      },
      {
        unitName: 'Isuzu MU-X',
        unitId: 'INV-MUX-002',
        bodyColor: 'Black',
        variation: 'SUV'
      },
      {
        unitName: 'Isuzu D-MAX',
        unitId: 'INV-DMAX-001',
        bodyColor: 'Red',
        variation: 'Pickup'
      },
      {
        unitName: 'Isuzu D-MAX',
        unitId: 'INV-DMAX-002',
        bodyColor: 'Blue',
        variation: 'Pickup'
      },
      {
        unitName: 'Isuzu Traviz',
        unitId: 'INV-TRV-001',
        bodyColor: 'White',
        variation: 'Bus'
      }
    ];

    // Clear existing inventory and add new ones
    await Inventory.deleteMany({});
    const createdInventory = await Inventory.insertMany(testInventory);
    console.log(`✅ Created ${createdInventory.length} test inventory items`);

    console.log('🎉 Test data added successfully!');
    console.log('   Driver Allocations:', createdAllocations.length);
    console.log('   Inventory Items:', createdInventory.length);
    
  } catch (error) {
    console.error('❌ Error adding test data:', error);
  } finally {
    mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}