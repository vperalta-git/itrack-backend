// Test health endpoint
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/health',
  method: 'GET'
};

console.log('🧪 Testing health endpoint...');

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('✅ Health check response:', data);
  });
});

req.on('error', (e) => {
  console.error('❌ Request error:', e.message);
});

req.end();