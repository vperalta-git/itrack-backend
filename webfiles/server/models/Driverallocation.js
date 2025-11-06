const mongoose = require('mongoose');

const DriverallocationSchema = new mongoose.Schema({
  unitName: String,
  unitId: String,
  bodyColor: String,
  variation: String,
  assignedDriver: String,
  status: String,
  date: Date,
  allocatedBy: String, // New field for tracking who allocated
  currentLocation: {
    latitude: Number,
    longitude: Number,
    address: String,
    lastUpdated: { type: Date, default: Date.now }
  },
  deliveryLocation: {
    latitude: Number,
    longitude: Number,
    address: String,
    customerName: String,
    contactNumber: String
  }
});

const DriverallocationModel = mongoose.model("driverallocation", DriverallocationSchema);
module.exports = DriverallocationModel;
