const http = require('http');

// Test Dispatch API Endpoint
function testDispatchAPI() {
  console.log('🧪 Testing Dispatch API Endpoint...');
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/dispatch/assignments',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`✅ API Response Status: ${res.statusCode}`);
      
      if (res.statusCode === 200) {
        try {
          const jsonData = JSON.parse(data);
          console.log(`📊 Dispatch assignments found: ${jsonData.count}`);
          console.log('📋 First few assignments:');
          
          if (jsonData.data && jsonData.data.length > 0) {
            jsonData.data.slice(0, 3).forEach((assignment, index) => {
              console.log(`${index + 1}. ${assignment.unitName} (${assignment.unitId}) - Status: ${assignment.status}`);
            });
          }
          
          console.log('✅ Dispatch API test successful!');
        } catch (parseError) {
          console.log('❌ Error parsing response:', parseError.message);
          console.log('Raw response:', data);
        }
      } else {
        console.log('❌ API Error Response:', data);
      }
    });
  });

  req.on('error', (e) => {
    console.log('❌ Request Error:', e.message);
    console.log('💡 Make sure the server is running on port 5000');
  });

  req.end();
}

// Wait a moment then test
setTimeout(testDispatchAPI, 1000);