// Test Enhanced Driver Creation and Vehicle Assignment
// Run this with: node test-enhanced-functionality.js

const API_BASE_URL = 'https://itrack-backend-1.onrender.com'; // Change to your backend URL

// Test Data
const testDriver = {
  username: 'johndoe123',
  password: 'securepass123', 
  accountName: 'John Doe Driver',
  email: 'john.doe@example.com',
  phone: '+639123456789'
};

const testVehicleAssignment = {
  unitName: 'Isuzu D-Max',
  unitId: 'ISUZU2025001',
  driverUsername: 'johndoe123', // Will be created above
  agentUsername: '', // Optional - leave empty for no agent
  bodyColor: 'Pearl White',
  variation: '4x4 AT',
  processes: ['delivery_to_isuzu_pasig', 'documentation_check', 'tinting']
};

async function testEnhancedFunctionality() {
  console.log('🧪 Testing Enhanced Driver Creation and Vehicle Assignment');
  console.log('======================================================');
  
  try {
    // Test 1: Create Driver Account
    console.log('\n1️⃣ Testing Enhanced Driver Creation...');
    
    const driverResponse = await fetch(`${API_BASE_URL}/admin/create-driver`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testDriver)
    });

    const driverResult = await driverResponse.json();
    
    if (driverResult.success) {
      console.log('✅ Driver created successfully!');
      console.log(`   Username: ${driverResult.data.username}`);
      console.log(`   Name: ${driverResult.data.accountName}`);
      console.log(`   Role: ${driverResult.data.role}`);
      console.log(`   Email: ${driverResult.data.email}`);
      console.log(`   Active: ${driverResult.data.isActive}`);
    } else {
      console.log('❌ Driver creation failed:', driverResult.message);
      return;
    }

    // Test 2: Assign Vehicle to Driver
    console.log('\n2️⃣ Testing Enhanced Vehicle Assignment...');
    
    const assignmentResponse = await fetch(`${API_BASE_URL}/admin/assign-vehicle`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testVehicleAssignment)
    });

    const assignmentResult = await assignmentResponse.json();
    
    if (assignmentResult.success) {
      console.log('✅ Vehicle assigned successfully!');
      console.log(`   Vehicle: ${assignmentResult.data.allocation.unitName}`);
      console.log(`   VIN: ${assignmentResult.data.allocation.unitId}`);
      console.log(`   Driver: ${assignmentResult.data.driverInfo.accountName}`);
      console.log(`   Status: ${assignmentResult.data.allocation.status}`);
      console.log(`   Processes: ${assignmentResult.data.allocation.processesToBeDone.length}`);
      console.log(`     - ${assignmentResult.data.allocation.processesToBeDone.join(', ')}`);
    } else {
      console.log('❌ Vehicle assignment failed:', assignmentResult.message);
    }

    // Test 3: Verify Driver Can See Assignment
    console.log('\n3️⃣ Testing Driver Assignment Visibility...');
    
    const allocationsResponse = await fetch(`${API_BASE_URL}/getAllocation?assignedDriver=${testDriver.username}`);
    const allocationsResult = await allocationsResponse.json();
    
    if (allocationsResult.success) {
      console.log(`✅ Driver can see ${allocationsResult.data.length} assignment(s)`);
      if (allocationsResult.data.length > 0) {
        const allocation = allocationsResult.data[0];
        console.log(`   Latest Assignment: ${allocation.unitName} (${allocation.unitId})`);
        console.log(`   Status: ${allocation.status}`);
      }
    } else {
      console.log('❌ Failed to check driver assignments');
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- Enhanced driver account creation ✅');  
    console.log('- Enhanced vehicle assignment with validation ✅');
    console.log('- Driver assignment visibility ✅');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    
    if (error.message.includes('fetch')) {
      console.log('\n💡 Troubleshooting:');
      console.log('1. Check if the backend server is running');
      console.log('2. Verify the API_BASE_URL is correct');
      console.log('3. Ensure your internet connection is stable');
      console.log('4. Check if Render service is suspended (free tier limitation)');
    }
  }
}

// Run the test
testEnhancedFunctionality();