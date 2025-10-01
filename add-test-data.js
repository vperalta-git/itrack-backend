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
    // All hardcoded test data removed. Fetch and process data only from the database.
    // Example: You can query and log allocations and inventory from the DB here.
    const allocations = await DriverAllocation.find({});
    const inventory = await Inventory.find({});
    console.log('Driver Allocations:', allocations.length);
    console.log('Inventory Items:', inventory.length);
  } catch (error) {
    console.error('❌ Error adding test data:', error);
  } finally {
    mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}