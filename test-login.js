// Test login script using built-in modules
const http = require('http');

function testLogin() {
    const data = JSON.stringify({
        username: 'vionneulrichp@gmail.com',
        password: 'password'
    });

    const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    console.log('Testing login with vionneulrichp@gmail.com...');
    
    const req = http.request(options, (res) => {
        let response = '';
        
        res.on('data', (chunk) => {
            response += chunk;
        });
        
        res.on('end', () => {
            try {
                const parsedResponse = JSON.parse(response);
                if (res.statusCode === 200) {
                    console.log('✅ Login successful:', parsedResponse);
                } else {
                    console.log('❌ Login failed:', res.statusCode, parsedResponse);
                }
            } catch (err) {
                console.log('❌ Parse error:', response);
            }
        });
    });

    req.on('error', (error) => {
        console.log('❌ Network error:', error.message);
    });

    req.write(data);
    req.end();
}

testLogin();