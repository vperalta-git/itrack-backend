// models/DriverAllocation.js (for driverallocations collection)
const mongoose = require('mongoose');

const DriverAllocationSchema = new mongoose.Schema({
  unitName: String,
  unitId: String,      // important: use unitId not conductionNumber
  bodyColor: String,
  variation: String,
  assignedDriver: String,
  assignedAgent: String,
  status: String,
  allocatedBy: String,

  // GPS Tracking for Maps
  location: {
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    lastUpdated: { type: Date, default: Date.now },
    address: { type: String, default: '' }
  },

  // Driver Location (when assigned)
  driverLocation: {
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    lastUpdated: { type: Date, default: Date.now }
  },

  // Vehicle Process Management
  requestedProcesses: [{
    type: String,
    enum: ['tinting', 'carwash', 'ceramic_coating', 'accessories', 'rust_proof', 'delivery_to_isuzu_pasig', 'stock_integration', 'documentation_check']
  }],

  processStatus: {
    tinting: { type: Boolean, default: false },
    carwash: { type: Boolean, default: false },
    ceramic_coating: { type: Boolean, default: false },
    accessories: { type: Boolean, default: false },
    rust_proof: { type: Boolean, default: false }
  },

  processCompletedBy: {
    tinting: String,
    carwash: String,
    ceramic_coating: String,
    accessories: String,
    rust_proof: String
  },

  processCompletedAt: {
    tinting: Date,
    carwash: Date,
    ceramic_coating: Date,
    accessories: Date,
    rust_proof: Date
  },

  // Overall status
  overallProgress: {
    completed: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    isComplete: { type: Boolean, default: false }
  },

  readyForRelease: { type: Boolean, default: false },
  releasedAt: Date,
  releasedBy: String
}, { timestamps: true });

module.exports = mongoose.model('DriverAllocation', DriverAllocationSchema, 'driverallocations');
