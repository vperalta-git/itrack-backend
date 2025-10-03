const mongoose = require('mongoose');

async function checkCompletedRequests() {
  try {
    await mongoose.connect('mongodb+srv://itrack_user:itrack123@cluster0.py8s8pl.mongodb.net/itrackDB');
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('completedrequests');
    
    const count = await collection.countDocuments();
    console.log(`📊 Total completed requests: ${count}`);
    
    const sampleData = await collection.find({}).limit(3).toArray();
    console.log('📋 Sample completed requests:');
    sampleData.forEach((item, index) => {
      console.log(`${index + 1}. ${item.unitName || item.vehicleRegNo || 'Unknown'} - Status: ${item.status} - Service: ${item.service?.join(', ') || 'N/A'}`);
    });
    
    // Show structure of first item
    if (sampleData.length > 0) {
      console.log('\n📝 Structure of first record:');
      console.log(JSON.stringify(sampleData[0], null, 2));
    }
    
    await mongoose.disconnect();
    console.log('✅ Test completed');
  } catch(err) {
    console.error('❌ Error:', err.message);
    await mongoose.disconnect();
  }
}

checkCompletedRequests();