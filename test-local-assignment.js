// Test Vehicle Assignment Locally
// Run: node test-local-assignment.js

const http = require('http');

const testData = {
  unitName: "Isuzu D-Max Test Local",
  unitId: "TEST123",
  driverUsername: "testdriverlocal",
  bodyColor: "Red",
  variation: "4x4",
  processes: ["delivery_to_isuzu_pasig"]
};

const postData = JSON.stringify(testData);

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/admin/assign-vehicle',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🧪 Testing Vehicle Assignment...');
console.log('Test Data:', testData);

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response:', data);
    try {
      const result = JSON.parse(data);
      if (result.success) {
        console.log('✅ Vehicle assignment successful!');
        console.log('   Driver:', result.data.driverInfo.accountName);
        console.log('   Vehicle:', result.data.allocation.unitName);
        console.log('   Status:', result.data.allocation.status);
        console.log('   Processes:', result.data.processCount);
      } else {
        console.log('❌ Vehicle assignment failed:', result.message);
      }
    } catch (error) {
      console.log('❌ Error parsing response:', error.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request error:', e.message);
});

req.write(postData);
req.end();