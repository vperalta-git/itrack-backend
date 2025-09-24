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
const manilaLocations = [
  { lat: 14.5995, lng: 121.0308, address: 'Makati City, Metro Manila' },
  { lat: 14.6042, lng: 121.0222, address: 'BGC, Taguig City' },
  { lat: 14.5832, lng: 121.0581, address: 'Mandaluyong City' },
  { lat: 14.6507, lng: 121.0300, address: 'Quezon City' },
  { lat: 14.5764, lng: 121.0851, address: 'Pasig City' },
  { lat: 14.5378, lng: 121.0014, address: 'Manila City' },
  { lat: 14.5243, lng: 121.0792, address: 'Marikina City' },
  { lat: 14.4378, lng: 121.0014, address: 'Paranaque City' },
  { lat: 14.6760, lng: 121.0437, address: 'Caloocan City' },
  { lat: 14.7319, lng: 121.0543, address: 'Malabon City' },
  { lat: 14.6488, lng: 120.9822, address: 'Valenzuela City' },
  { lat: 14.5906, lng: 120.9656, address: 'Las Pinas City' },
  { lat: 14.4687, lng: 121.0488, address: 'Muntinlupa City' },
  { lat: 14.5906, lng: 121.1300, address: 'Antipolo, Rizal' },
  { lat: 14.7683, lng: 121.0561, address: 'Navotas City' }
];

// Function to get random location
const getRandomLocation = () => {
  return manilaLocations[Math.floor(Math.random() * manilaLocations.length)];
};

const addGPSToAllocations = async () => {
  console.log('?? Updating driver allocations with GPS data...');
  
  const allocations = await DriverAllocation.find({});
  console.log('Found ' + allocations.length + ' allocations to update');
  
  for (let allocation of allocations) {
    const randomLoc = getRandomLocation();
    
    // Add slight random variation to coordinates
    const latitude = randomLoc.lat + (Math.random() - 0.5) * 0.01;
    const longitude = randomLoc.lng + (Math.random() - 0.5) * 0.01;
    
    allocation.location = {
      latitude: latitude,
      longitude: longitude,
      address: randomLoc.address,
      lastUpdated: new Date()
    };
    
    // If assigned to driver, add driver location too
    if (allocation.assignedDriver) {
      const driverLoc = getRandomLocation();
      allocation.driverLocation = {
        latitude: driverLoc.lat + (Math.random() - 0.5) * 0.005,
        longitude: driverLoc.lng + (Math.random() - 0.5) * 0.005,
        lastUpdated: new Date()
      };
    }
    
    await allocation.save();
    console.log('? Updated allocation: ' + allocation.unitId + ' at ' + randomLoc.address);
  }
};

const addGPSToInventory = async () => {
  console.log('?? Updating inventory with GPS data...');
  
  const vehicles = await Inventory.find({});
  console.log('Found ' + vehicles.length + ' vehicles to update');
  
  // Default to Isuzu dealership locations
  const dealershipLocations = [
    { lat: 14.5995, lng: 121.0308, address: 'Isuzu Makati Dealership' },
    { lat: 14.6042, lng: 121.0222, address: 'Isuzu BGC Showroom' },
    { lat: 14.6507, lng: 121.0300, address: 'Isuzu Quezon City Branch' },
    { lat: 14.5764, lng: 121.0851, address: 'Isuzu Pasig Service Center' },
    { lat: 14.5378, lng: 121.0014, address: 'Isuzu Manila Main Branch' }
  ];
  
  for (let vehicle of vehicles) {
    const dealership = dealershipLocations[Math.floor(Math.random() * dealershipLocations.length)];
    
    vehicle.location = {
      latitude: dealership.lat + (Math.random() - 0.5) * 0.002, // Very close to dealership
      longitude: dealership.lng + (Math.random() - 0.5) * 0.002,
      address: dealership.address,
      lastUpdated: new Date()
    };
    
    // Add additional vehicle info if missing
    if (!vehicle.model) vehicle.model = 'D-Max';
    if (!vehicle.status) vehicle.status = 'Available';
    
    await vehicle.save();
    console.log('? Updated vehicle: ' + vehicle.unitId + ' at ' + dealership.address);
  }
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
