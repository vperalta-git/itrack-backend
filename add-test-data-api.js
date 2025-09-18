const axios = require('axios');

const BASE_URL = 'https://itrack-backend-1.onrender.com/api';

async function addTestData() {
  console.log('🚀 Adding test data via API endpoints...');
  
  try {
    const testAllocations = [
      {
        unitName: 'Isuzu NPR',
        unitId: 'NPR001',
        bodyColor: 'White',
        variation: 'Dropside',
        assignedDriver: 'Juan Cruz',
        status: 'In Transit',
        allocatedBy: 'Admin System'
      },
      {
        unitName: 'Isuzu ELF',
        unitId: 'ELF002',
        bodyColor: 'Blue',
        variation: 'Closed Van',
        assignedDriver: 'Pedro Dela Cruz',
        status: 'Pending',
        allocatedBy: 'Admin System'
      },
      {
        unitName: 'Isuzu GIGA',
        unitId: 'GIGA003',
        bodyColor: 'Red',
        variation: 'Cargo',
        assignedDriver: 'Jose Rizal',
        status: 'Delivered',
        allocatedBy: 'Admin System'
      },
      {
        unitName: 'Isuzu MU-X',
        unitId: 'MUX004',
        bodyColor: 'Silver',
        variation: 'SUV',
        assignedDriver: 'Antonio Luna',
        status: 'In Transit',
        allocatedBy: 'Admin System'
      },
      {
        unitName: 'Isuzu D-MAX',
        unitId: 'DMAX005',
        bodyColor: 'Black',
        variation: 'Pickup',
        assignedDriver: 'Emilio Aguinaldo',
        status: 'Pending',
        allocatedBy: 'Admin System'
      }
    ];

    console.log('📊 Creating test driver allocations...');
    for (const allocation of testAllocations) {
      try {
        const response = await axios.post(`${BASE_URL}/createAllocation`, allocation);
        console.log(`✅ Created allocation: ${allocation.unitName} (${allocation.unitId})`);
      } catch (error) {
        console.log(`❌ Failed to create allocation ${allocation.unitId}: ${error.response?.data?.error || error.message}`);
      }
    }

    const testInventory = [
      {
        unitName: 'Isuzu NPR',
        unitId: 'INV-NPR-001',
        bodyColor: 'White',
        variation: 'Dropside',
        quantity: 1
      },
      {
        unitName: 'Isuzu NPR',
        unitId: 'INV-NPR-002',
        bodyColor: 'Blue',
        variation: 'Dropside',
        quantity: 1
      },
      {
        unitName: 'Isuzu ELF',
        unitId: 'INV-ELF-001',
        bodyColor: 'White',
        variation: 'Closed Van',
        quantity: 1
      },
      {
        unitName: 'Isuzu ELF',
        unitId: 'INV-ELF-002',
        bodyColor: 'Gray',
        variation: 'Open Van',
        quantity: 1
      },
      {
        unitName: 'Isuzu GIGA',
        unitId: 'INV-GIGA-001',
        bodyColor: 'Yellow',
        variation: 'Cargo',
        quantity: 1
      },
      {
        unitName: 'Isuzu MU-X',
        unitId: 'INV-MUX-001',
        bodyColor: 'Silver',
        variation: 'SUV',
        quantity: 1
      },
      {
        unitName: 'Isuzu MU-X',
        unitId: 'INV-MUX-002',
        bodyColor: 'Black',
        variation: 'SUV',
        quantity: 1
      },
      {
        unitName: 'Isuzu D-MAX',
        unitId: 'INV-DMAX-001',
        bodyColor: 'Red',
        variation: 'Pickup',
        quantity: 1
      },
      {
        unitName: 'Isuzu D-MAX',
        unitId: 'INV-DMAX-002',
        bodyColor: 'Blue',
        variation: 'Pickup',
        quantity: 1
      },
      {
        unitName: 'Isuzu Traviz',
        unitId: 'INV-TRV-001',
        bodyColor: 'White',
        variation: 'Bus',
        quantity: 1
      }
    ];

    console.log('📦 Creating test inventory items...');
    for (const item of testInventory) {
      try {
        const response = await axios.post(`${BASE_URL}/createStock`, item);
        console.log(`✅ Created inventory: ${item.unitName} (${item.unitId})`);
      } catch (error) {
        console.log(`❌ Failed to create inventory ${item.unitId}: ${error.response?.data?.error || error.message}`);
      }
    }

    console.log('🎉 Test data creation completed!');

  } catch (error) {
    console.error('❌ Error adding test data:', error.message);
  }
}

addTestData();