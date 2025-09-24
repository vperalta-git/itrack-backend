// create-test-allocations.js - Create test vehicle allocations for drivers
const mongoose = require('mongoose');

// Import models
const DriverAllocation = require('./models/DriverAllocation');
const Inventory = require('./models/Inventory');

const mongoURI = 'mongodb+srv://itrack_user:itrack123@cluster0.py8s8pl.mongodb.net/itrackDB?retryWrites=true&w=majority&appName=Cluster0';

const testVehicles = [
  {
    unitId: 'ISUZU-001',
    unitName: 'Isuzu D-Max LS 4x2',
    model: 'D-Max',
    variant: 'LS 4x2',
    bodyColor: 'Pearl White',
    variation: 'Single Cab',
    engineNumber: 'ENG001',
    chassisNumber: 'CHAS001',
    plateNumber: 'ABC-1234',
    dealership: 'Isuzu Pasig',
    location: {
      latitude: 14.5791,
      longitude: 121.0655,
      address: 'Isuzu Pasig Dealership, Ortigas Ave, Pasig City'
    },
    status: 'Available'
  },
  {
    unitId: 'ISUZU-002',
    unitName: 'Isuzu MU-X LS-E',
    model: 'MU-X',
    variant: 'LS-E',
    bodyColor: 'Obsidian Gray',
    variation: 'SUV',
    engineNumber: 'ENG002',
    chassisNumber: 'CHAS002',
    plateNumber: 'DEF-5678',
    dealership: 'Isuzu Pasig',
    location: {
      latitude: 14.5801,
      longitude: 121.0665,
      address: 'Isuzu Pasig Service Center, C5 Road, Pasig City'
    },
    status: 'Available'
  },
  {
    unitId: 'ISUZU-003',
    unitName: 'Isuzu NPR Truck',
    model: 'NPR',
    variant: 'Standard',
    bodyColor: 'White',
    variation: 'Cargo Truck',
    engineNumber: 'ENG003',
    chassisNumber: 'CHAS003',
    plateNumber: 'GHI-9012',
    dealership: 'Isuzu Makati',
    location: {
      latitude: 14.5547,
      longitude: 121.0244,
      address: 'Isuzu Makati Showroom, Ayala Avenue, Makati City'
    },
    status: 'Available'
  },
  {
    unitId: 'ISUZU-004',
    unitName: 'Isuzu D-Max V-Cross',
    model: 'D-Max',
    variant: 'V-Cross',
    bodyColor: 'Magnetic Red',
    variation: 'Double Cab',
    engineNumber: 'ENG004',
    chassisNumber: 'CHAS004',
    plateNumber: 'JKL-3456',
    dealership: 'Isuzu Taguig',
    location: {
      latitude: 14.5176,
      longitude: 121.0509,
      address: 'Isuzu Taguig Branch, C6 Road, Taguig City'
    },
    status: 'Available'
  },
  {
    unitId: 'ISUZU-005',
    unitName: 'Isuzu MU-X Blue Power',
    model: 'MU-X',
    variant: 'Blue Power',
    bodyColor: 'Titanium Silver',
    variation: 'SUV 7-Seater',
    engineNumber: 'ENG005',
    chassisNumber: 'CHAS005',
    plateNumber: 'MNO-7890',
    dealership: 'Isuzu Mandaluyong',
    location: {
      latitude: 14.5794,
      longitude: 121.0359,
      address: 'Isuzu Mandaluyong Showroom, EDSA, Mandaluyong City'
    },
    status: 'Available'
  }
];

const testAllocations = [
  {
    unitId: 'ISUZU-001',
    unitName: 'Isuzu D-Max LS 4x2',
    assignedDriver: 'testdriver1',
    assignedAgent: 'testagent1',
    status: 'Assigned',
    bodyColor: 'Pearl White',
    variation: 'Single Cab',
    assignedDate: new Date(),
    location: {
      latitude: 14.5791,
      longitude: 121.0655,
      address: 'Isuzu Pasig Dealership, Ortigas Ave, Pasig City',
      lastUpdated: new Date()
    },
    driverLocation: {
      latitude: 14.5700,
      longitude: 121.0580,
      address: 'Driver Location - Pasig City',
      lastUpdated: new Date()
    }
  },
  {
    unitId: 'ISUZU-002',
    unitName: 'Isuzu MU-X LS-E',
    assignedDriver: 'testdriver1',
    assignedAgent: 'testagent1',
    status: 'Ready for Delivery',
    bodyColor: 'Obsidian Gray',
    variation: 'SUV',
    assignedDate: new Date(),
    location: {
      latitude: 14.5801,
      longitude: 121.0665,
      address: 'Isuzu Pasig Service Center, C5 Road, Pasig City',
      lastUpdated: new Date()
    },
    driverLocation: {
      latitude: 14.5710,
      longitude: 121.0590,
      address: 'Driver Location - Pasig City',
      lastUpdated: new Date()
    }
  },
  {
    unitId: 'ISUZU-003',
    unitName: 'Isuzu NPR Truck',
    assignedDriver: 'testdriver2',
    assignedAgent: 'testagent2',
    status: 'In Transit',
    bodyColor: 'White',
    variation: 'Cargo Truck',
    assignedDate: new Date(),
    location: {
      latitude: 14.5547,
      longitude: 121.0244,
      address: 'Isuzu Makati Showroom, Ayala Avenue, Makati City',
      lastUpdated: new Date()
    },
    driverLocation: {
      latitude: 14.5500,
      longitude: 121.0300,
      address: 'Driver Location - Makati City',
      lastUpdated: new Date()
    }
  }
];

async function createTestData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Clear existing test data
    console.log('🧹 Clearing existing test data...');
    await DriverAllocation.deleteMany({ unitId: { $in: testVehicles.map(v => v.unitId) } });
    await Inventory.deleteMany({ unitId: { $in: testVehicles.map(v => v.unitId) } });

    // Create inventory vehicles
    console.log('🚗 Creating test vehicles in inventory...');
    for (const vehicle of testVehicles) {
      const inventoryItem = new Inventory(vehicle);
      await inventoryItem.save();
      console.log(`✅ Created vehicle: ${vehicle.unitId} - ${vehicle.unitName}`);
    }

    // Create driver allocations
    console.log('📋 Creating driver allocations...');
    for (const allocation of testAllocations) {
      const driverAllocation = new DriverAllocation(allocation);
      await driverAllocation.save();
      console.log(`✅ Allocated ${allocation.unitId} to driver: ${allocation.assignedDriver}`);
    }

    console.log('\n🎉 Test data created successfully!');
    
    // Summary
    const vehicleCount = await Inventory.countDocuments();
    const allocationCount = await DriverAllocation.countDocuments();
    
    console.log('\n📊 Database Summary:');
    console.log(`Total vehicles in inventory: ${vehicleCount}`);
    console.log(`Total driver allocations: ${allocationCount}`);
    
    console.log('\n🚗 Driver Assignments:');
    console.log('testdriver1: ISUZU-001 (D-Max LS 4x2), ISUZU-002 (MU-X LS-E)');
    console.log('testdriver2: ISUZU-003 (NPR Truck)');
    
    console.log('\n📍 All vehicles have GPS coordinates for map display!');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

createTestData();