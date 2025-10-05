// models/Inventory.js  (for inventories collection aka vehicle stocks)
const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
  unitName: String,
  unitId: String,         // match MongoDB field name exactly
  bodyColor: String,
  variation: String,
  
  // GPS Location for Maps
  location: {
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    address: { type: String, default: 'Isuzu Dealership' },
    lastUpdated: { type: Date, default: Date.now }
  },
  
  // Vehicle Status
  status: { type: String, default: 'Available' },
  
  // Additional vehicle info
  model: String,
  year: Number,
  vin: String
}, { timestamps: true });

module.exports = mongoose.model('Inventory', InventorySchema, 'inventories'); // explicit collection name
