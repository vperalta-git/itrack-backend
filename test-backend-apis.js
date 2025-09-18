const axios = require('axios');

const BASE_URL = 'https://itrack-backend-1.onrender.com';

console.log('🧪 Testing I-Track Backend APIs...\n');

async function testAPI(endpoint, method = 'GET', data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      timeout: 10000
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    console.log(`✅ ${method} ${endpoint}: ${response.status} - ${response.data.success ? 'SUCCESS' : 'FAILED'}`);
    if (response.data.data) {
      console.log(`   Data count: ${Array.isArray(response.data.data) ? response.data.data.length : 'Object'}`);
    }
    return response.data;
  } catch (error) {
    const status = error.response?.status || 'TIMEOUT';
    const message = error.response?.data?.error || error.message;
    console.log(`❌ ${method} ${endpoint}: ${status} - ${message}`);
    return null;
  }
}

async function runTests() {
  console.log('🔗 Testing Basic Endpoints:');
  await testAPI('/health');
  await testAPI('/test');
  
  console.log('\n📊 Testing Data Endpoints:');
  await testAPI('/api/getAllocation');
  await testAPI('/api/getStock');
  await testAPI('/getRequest');
  await testAPI('/getCompletedRequests');
  await testAPI('/admin/users');
  await testAPI('/api/audit-trail');
  
  console.log('\n🚚 Testing Dispatch Endpoints:');
  await testAPI('/api/dispatch/assignments');
  
  console.log('\n🗺️ Testing Maps Endpoints:');
  await testAPI('/api/maps/geocode?address=Manila,Philippines');
  
  console.log('\n📱 Testing Mobile Config:');
  await testAPI('/api/mobile-config');
  
  console.log('\n🎯 Tests completed!');
}

runTests().catch(console.error);