const mongoose = require('mongoose');

// Test Dispatch Assignments Collection
async function testDispatchAssignments() {
  try {
    console.log('🧪 Testing dispatch assignments collection...');
    
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://itrack_user:itrack123@cluster0.py8s8pl.mongodb.net/itrackDB');
    console.log('✅ Connected to MongoDB');
    
    // Get the collection directly
    const db = mongoose.connection.db;
    const collection = db.collection('dispatchassignments');
    
    // Count documents
    const count = await collection.countDocuments();
    console.log(`📊 Total dispatch assignments: ${count}`);
    
    // Get some sample data
    const sampleData = await collection.find({}).limit(3).toArray();
    console.log('📋 Sample dispatch assignments:');
    sampleData.forEach((item, index) => {
      console.log(`${index + 1}. ${item.unitName} (${item.unitId}) - Status: ${item.status || 'N/A'}`);
    });
    
    console.log('✅ Dispatch collection test completed!');
    mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error testing dispatch collection:', error);
    mongoose.disconnect();
  }
}

testDispatchAssignments();