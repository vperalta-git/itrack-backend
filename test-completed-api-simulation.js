const mongoose = require('mongoose');

const CompletedRequestSchema = new mongoose.Schema({
  vehicleRegNo: { type: String, required: true },
  unitName: { type: String },
  service: [{
    type: String,
    enum: ['Tinting', 'Carwash', 'Ceramic Coating', 'Accessories', 'Rust Proof'],
    required: true
  }],
  status: { 
    type: String,
    enum: ['In Progress', 'Completed'],
    default: 'Completed'
  },
  preparedBy: { type: String, required: true },
  dateCreated: { type: String },
  inProgressAt: { type: Date },
  completedAt: { type: Date },
  serviceDurationMinutes: { type: Number },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { collection: 'completedrequests' });

const CompletedRequest = mongoose.model('CompletedRequest', CompletedRequestSchema);

async function testCompletedRequestsAPI() {
  try {
    await mongoose.connect('mongodb+srv://itrack_user:itrack123@cluster0.py8s8pl.mongodb.net/itrackDB');
    console.log('✅ Connected to MongoDB');
    
    // Simulate the API call
    const results = await CompletedRequest.find({ status: 'Completed' }).sort({ completedAt: -1 });
    console.log(`📊 Found ${results.length} completed requests via API simulation`);
    
    if (results.length > 0) {
      console.log('📋 Sample completed requests:');
      results.slice(0, 3).forEach((request, index) => {
        console.log(`${index + 1}. ${request.vehicleRegNo} - Services: ${request.service?.join(', ')} - Prepared by: ${request.preparedBy}`);
      });
    }
    
    console.log('✅ Completed Requests API simulation successful!');
    
    // Test the count for dashboard stats
    const completedCount = await CompletedRequest.countDocuments({ status: 'Completed' });
    const inProgressCount = await CompletedRequest.countDocuments({ status: 'In Progress' });
    
    console.log(`📊 Dashboard Stats: Completed: ${completedCount}, In Progress: ${inProgressCount}`);
    
  } catch(error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.disconnect();
  }
}

testCompletedRequestsAPI();