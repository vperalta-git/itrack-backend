// Test API endpoints
const http = require('http');

const endpoints = [
  '/health',
  '/api/mobile-config',
  '/getUsers',
  '/getStock',
  '/admin/assign-vehicle'
];

async function testEndpoint(endpoint, method = 'GET') {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: endpoint,
      method: method
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          endpoint,
          status: res.statusCode,
          success: res.statusCode < 400,
          response: data.substring(0, 200) // First 200 chars
        });
      });
    });

    req.on('error', (e) => {
      resolve({
        endpoint,
        status: 'ERROR',
        success: false,
        error: e.message
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        endpoint,
        status: 'TIMEOUT',
        success: false,
        error: 'Request timeout'
      });
    });

    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing Backend Endpoints...\n');
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${endpoint}: ${result.status}`);
    
    if (!result.success) {
      console.log(`   Error: ${result.error || 'HTTP Error'}`);
    } else if (result.response) {
      console.log(`   Response: ${result.response.substring(0, 100)}...`);
    }
    console.log('');
  }
  
  // Test POST endpoint
  console.log('🧪 Testing POST /admin/assign-vehicle...');
  
  // This will fail but should show if endpoint exists
  const postResult = await testEndpoint('/admin/assign-vehicle', 'POST');
  const status = postResult.status === 400 ? '✅' : '❌'; // 400 is expected (missing data)
  console.log(`${status} POST /admin/assign-vehicle: ${postResult.status}`);
  console.log(`   ${postResult.response || postResult.error}`);
}

runTests().catch(console.error);