console.log('Testing basic server...');

const express = require('express');
const app = express();

app.get('/test', (req, res) => {
  res.send('Basic server working!');
});

const PORT = 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running on port ${PORT}`);
});

console.log('Server setup complete');
