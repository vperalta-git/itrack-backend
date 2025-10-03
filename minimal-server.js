const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

console.log('🚀 Starting Minimal I-Track Server...');

const app = express();
const PORT = process.env.PORT || 8000;

// Basic middleware
app.use(cors());
app.use(express.json());

// Simple health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString() 
  });
});

// Simple login endpoint
app.post('/login', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Minimal server working',
      user: { username: 'test' }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test parameter route
app.get('/test/:id', (req, res) => {
  res.json({ 
    success: true, 
    id: req.params.id 
  });
});

// Error handling
app.all('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Route not found' 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Minimal I-Track Server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
});