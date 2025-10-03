const http = require('http');

// Test Completed Requests API Endpoint
function testCompletedRequestsAPI() {
  console.log('🧪 Testing Completed Requests API Endpoint...');
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/getCompletedRequests',
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
          console.log(`📊 Completed requests found: ${jsonData.count || jsonData.data?.length || 0}`);
          console.log('📋 Sample completed requests:');
          
          if (jsonData.data && jsonData.data.length > 0) {
            jsonData.data.slice(0, 3).forEach((request, index) => {
              console.log(`${index + 1}. ${request.vehicleRegNo || request.unitName} - Status: ${request.status} - Services: ${request.service?.join(', ') || 'N/A'}`);
            });
          }
          
          console.log('✅ Completed Requests API test successful!');
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
setTimeout(testCompletedRequestsAPI, 2000);