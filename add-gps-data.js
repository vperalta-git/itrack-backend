// add-gps-data.js - Add GPS coordinates to existing vehicle/allocation data
const mongoose = require('mongoose');

// Import models
const DriverAllocation = require('./models/DriverAllocation');
const Inventory = require('./models/Inventory');

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb+srv://itrack_user:itrack123@cluster0.py8s8pl.mongodb.net/itrackDB?retryWrites=true&w=majority&appName=Cluster0');
    console.log('? Connected to MongoDB Atlas');
  } catch (error) {
    console.error('? MongoDB connection error:', error);
    process.exit(1);
  }
};

// Metro Manila GPS coordinates for realistic locations

const addGPSToAllocations = async () => {
  // ...existing code...
};

const addGPSToInventory = async () => {
  // ...existing code...
};

const main = async () => {
  await connectDB();
  await addGPSToAllocations();
  await addGPSToInventory();
  console.log('?? All GPS data added successfully!');
  process.exit(0);
};

main().catch(error => {
  console.error('? Error:', error);
  process.exit(1);
});
