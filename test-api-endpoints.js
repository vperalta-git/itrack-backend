// Use dynamic import for ES modules
const SERVER_URL = 'https://itrack-backend-1.onrender.com';

async function testEndpoints() {
  const fetch = (await import('node-fetch')).default;
  console.log('🧪 Testing I-Track Backend API Endpoints...\n');
  
  // Test getUsers endpoint
  try {
    console.log('🔍 Testing /getUsers endpoint...');
    const usersResponse = await fetch(`${SERVER_URL}/getUsers`);
    const usersData = await usersResponse.json();
    console.log('✅ Users response:', usersData.success ? 'SUCCESS' : 'FAILED');
    console.log(`📊 Total users: ${usersData.data?.length || 0}`);
    
    if (usersData.data?.length > 0) {
      const roles = usersData.data.map(u => u.role).filter(Boolean);
      const uniqueRoles = [...new Set(roles)];
      console.log(`👥 Available roles: ${uniqueRoles.join(', ')}`);
      
      const agents = usersData.data.filter(u => u.role?.toLowerCase() === 'sales agent');
      const drivers = usersData.data.filter(u => u.role?.toLowerCase() === 'driver');
      console.log(`🏪 Sales Agents: ${agents.length}`);
      console.log(`🚗 Drivers: ${drivers.length}`);
    }
  } catch (error) {
    console.log('❌ Users endpoint failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test getStock endpoint
  try {
    console.log('🔍 Testing /getStock endpoint...');
    const stockResponse = await fetch(`${SERVER_URL}/getStock`);
    const stockData = await stockResponse.json();
    console.log('✅ Stock response:', stockData.success ? 'SUCCESS' : 'FAILED');
    console.log(`📦 Total inventory items: ${stockData.data?.length || 0}`);
    
    if (stockData.data?.length > 0) {
      const firstItem = stockData.data[0];
      console.log(`🚙 Sample vehicle: ${firstItem.unitName || firstItem.name || 'N/A'}`);
    }
  } catch (error) {
    console.log('❌ Stock endpoint failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test getAllocation endpoint
  try {
    console.log('🔍 Testing /getAllocation endpoint...');
    const allocResponse = await fetch(`${SERVER_URL}/getAllocation`);
    const allocData = await allocResponse.json();
    console.log('✅ Allocation response:', allocData.success ? 'SUCCESS' : 'FAILED');
    console.log(`📋 Total allocations: ${allocData.data?.length || 0}`);
  } catch (error) {
    console.log('❌ Allocation endpoint failed:', error.message);
  }

  console.log('\n🏁 API Testing Complete!');
}

testEndpoints();