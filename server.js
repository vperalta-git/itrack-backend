const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ======= MongoDB Connection =======
const mongoURI = 'mongodb+srv://itrack_user:itrack123@cluster0.py8s8pl.mongodb.net/itrackDB?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoURI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ======= Schemas =======
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'Supervisor', 'Manager', 'Sales Agent', 'Driver', 'Dispatch'], default: 'Sales Agent' },
  accountName: { type: String, required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
});

const VehicleSchema = new mongoose.Schema({
  vin: String,
  model: String,
  driver: String,
  current_status: String,
  requested_processes: [String],
  preparation_status: {
    tinting: Boolean,
    carwash: Boolean,
    ceramic_coating: Boolean,
    accessories: Boolean,
    rust_proof: Boolean,
    ready_for_release: Boolean,
  },
  location: { lat: Number, lng: Number },
  customer_name: String,
  customer_number: String,
});

const VehicleStockSchema = new mongoose.Schema({
  unitName: String,
  unitId: String,
  bodyColor: String,
  variation: String,
}, { timestamps: true });

const VehiclePreparationSchema = new mongoose.Schema({
  dateCreated: Date,
  vehicleRegNo: String,
  service: [{ serviceTime: String, status: String }],
  status: String,
}, { timestamps: true });

const DriverAllocationSchema = new mongoose.Schema({
  unitName: String,
  unitId: String,
  bodyColor: String,
  variation: String,
  assignedDriver: String,
  status: String,
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Vehicle = mongoose.model('Vehicle', VehicleSchema);
const VehicleStock = mongoose.model('VehicleStock', VehicleStockSchema);
const VehiclePreparation = mongoose.model('VehiclePreparation', VehiclePreparationSchema);
const DriverAllocation = mongoose.model('DriverAllocation', DriverAllocationSchema);

// ======= Helper =======
function capitalizeWords(string) {
  return string ? string.split(' ').map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(' ') : '';
}

// ======= Auth Routes =======
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid username' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid password' });

    res.json({ success: true, role: capitalizeWords(user.role), name: user.accountName, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// ======= Admin Routes =======
app.get('/admin/managers', async (_, res) => {
  try {
    const managers = await User.find({ role: 'Manager' }).select('_id accountName');
    res.json({ success: true, managers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/admin/assign', async (req, res) => {
  try {
    const { username, password, role, assignedTo, accountName } = req.body;
    if (!username || !password || !role || !accountName) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const exists = await User.findOne({ username });
    if (exists) return res.status(409).json({ success: false, message: 'Username already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      password: hashedPassword,
      role,
      accountName,
      assignedTo: assignedTo || null,
    });

    await newUser.save();
    res.json({ success: true, user: newUser });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/admin/users', async (_, res) => {
  try {
    const users = await User.find();
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/admin/users/:userId', async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.userId);
    if (!deleted) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/admin/change-password', async (req, res) => {
  try {
    const { username, newPassword } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ success: true, message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ======= Vehicle Routes =======
app.get('/vehicles', async (_, res) => {
  try {
    const vehicles = await Vehicle.find();
    res.json({ success: true, vehicles });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/vehicles/:vin', async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ vin: req.params.vin });
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    res.json({ success: true, vehicle });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/vehicles', async (req, res) => {
  try {
    const existing = await Vehicle.findOne({ vin: req.body.vin });
    if (existing) {
      Object.assign(existing, req.body);
      await existing.save();
      return res.json({ success: true, vehicle: existing });
    }

    const vehicle = new Vehicle(req.body);
    await vehicle.save();
    res.json({ success: true, vehicle });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/vehicles/:vin/update-status', async (req, res) => {
  try {
    const { stage } = req.body;
    const update = {};
    update[`preparation_status.${stage}`] = true;

    const vehicle = await Vehicle.findOneAndUpdate({ vin: req.params.vin }, { $set: update }, { new: true });
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    res.json({ success: true, vehicle });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/vehicles/:vin/delete', async (req, res) => {
  try {
    const vehicle = await Vehicle.findOneAndDelete({ vin: req.params.vin });
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ======= Vehicle Stock & Preparation =======
app.get('/vehicle-stocks', async (_, res) => {
  try {
    const stocks = await VehicleStock.find();
    res.json({ success: true, stocks });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/vehicle-stocks', async (req, res) => {
  try {
    const stock = new VehicleStock(req.body);
    await stock.save();
    res.json({ success: true, stock });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/vehicle-preparations', async (_, res) => {
  try {
    const preps = await VehiclePreparation.find();
    res.json({ success: true, preparations: preps });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/vehicle-preparations', async (req, res) => {
  try {
    const prep = new VehiclePreparation(req.body);
    await prep.save();
    res.json({ success: true, preparation: prep });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ======= Driver Allocation Endpoints =======
app.get('/driver-allocations', async (_, res) => {
  try {
    const allocations = await DriverAllocation.find();
    res.json({ success: true, data: allocations });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/driver-allocations', async (req, res) => {
  try {
    const newAllocation = new DriverAllocation(req.body);
    await newAllocation.save();
    res.json({ success: true, allocation: newAllocation });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/driver-allocations/:id', async (req, res) => {
  try {
    const updated = await DriverAllocation.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Allocation not found' });
    res.json({ success: true, allocation: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ======= Test Route =======
app.get('/test', (_, res) => {
  res.send('Server test successful!');
});

// ======= Start Server =======
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
