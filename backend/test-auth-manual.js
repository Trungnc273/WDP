/**
 * Manual Test Script for Authentication Endpoints
 * Run this with: node test-auth-manual.js
 * Make sure the server is running on port 5000
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';
let authToken = '';
const testEmail = `test${Date.now()}@example.com`;

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(body)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test functions
async function testRegister() {
  console.log('\n=== Test 1: Register New User ===');
  try {
    const response = await makeRequest('POST', '/api/auth/register', {
      email: testEmail,
      password: 'password123',
      fullName: 'Test User'
    });

    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));

    if (response.status === 201 && response.data.data.token) {
      authToken = response.data.data.token;
      console.log('✓ Registration successful');
      return true;
    } else {
      console.log('✗ Registration failed');
      return false;
    }
  } catch (error) {
    console.log('✗ Error:', error.message);
    return false;
  }
}

async function testRegisterDuplicate() {
  console.log('\n=== Test 2: Register Duplicate Email ===');
  try {
    const response = await makeRequest('POST', '/api/auth/register', {
      email: testEmail,
      password: 'password456',
      fullName: 'Another User'
    });

    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));

    if (response.status === 400 && response.data.message.includes('Email đã được sử dụng')) {
      console.log('✓ Duplicate email rejected correctly');
      return true;
    } else {
      console.log('✗ Should have rejected duplicate email');
      return false;
    }
  } catch (error) {
    console.log('✗ Error:', error.message);
    return false;
  }
}

async function testLogin() {
  console.log('\n=== Test 3: Login with Correct Credentials ===');
  try {
    const response = await makeRequest('POST', '/api/auth/login', {
      email: testEmail,
      password: 'password123'
    });

    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));

    if (response.status === 200 && response.data.data.token) {
      console.log('✓ Login successful');
      return true;
    } else {
      console.log('✗ Login failed');
      return false;
    }
  } catch (error) {
    console.log('✗ Error:', error.message);
    return false;
  }
}

async function testLoginWrongPassword() {
  console.log('\n=== Test 4: Login with Wrong Password ===');
  try {
    const response = await makeRequest('POST', '/api/auth/login', {
      email: testEmail,
      password: 'wrongpassword'
    });

    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));

    if (response.status === 401 && response.data.message.includes('Email hoặc mật khẩu không đúng')) {
      console.log('✓ Wrong password rejected correctly');
      return true;
    } else {
      console.log('✗ Should have rejected wrong password');
      return false;
    }
  } catch (error) {
    console.log('✗ Error:', error.message);
    return false;
  }
}

async function testGetProfile() {
  console.log('\n=== Test 5: Get Profile with Valid Token ===');
  try {
    const response = await makeRequest('GET', '/api/auth/profile', null, authToken);

    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));

    if (response.status === 200 && response.data.data.email === testEmail) {
      console.log('✓ Profile retrieved successfully');
      return true;
    } else {
      console.log('✗ Failed to get profile');
      return false;
    }
  } catch (error) {
    console.log('✗ Error:', error.message);
    return false;
  }
}

async function testGetProfileNoToken() {
  console.log('\n=== Test 6: Get Profile without Token ===');
  try {
    const response = await makeRequest('GET', '/api/auth/profile');

    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));

    if (response.status === 401) {
      console.log('✓ Unauthorized access rejected correctly');
      return true;
    } else {
      console.log('✗ Should have rejected request without token');
      return false;
    }
  } catch (error) {
    console.log('✗ Error:', error.message);
    return false;
  }
}

async function testLogout() {
  console.log('\n=== Test 7: Logout ===');
  try {
    const response = await makeRequest('POST', '/api/auth/logout', null, authToken);

    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));

    if (response.status === 200) {
      console.log('✓ Logout successful');
      return true;
    } else {
      console.log('✗ Logout failed');
      return false;
    }
  } catch (error) {
    console.log('✗ Error:', error.message);
    return false;
  }
}

async function testInvalidEmail() {
  console.log('\n=== Test 8: Register with Invalid Email ===');
  try {
    const response = await makeRequest('POST', '/api/auth/register', {
      email: 'invalid-email',
      password: 'password123',
      fullName: 'Test User'
    });

    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));

    if (response.status === 400 && response.data.message.includes('Email không hợp lệ')) {
      console.log('✓ Invalid email rejected correctly');
      return true;
    } else {
      console.log('✗ Should have rejected invalid email');
      return false;
    }
  } catch (error) {
    console.log('✗ Error:', error.message);
    return false;
  }
}

async function testShortPassword() {
  console.log('\n=== Test 9: Register with Short Password ===');
  try {
    const response = await makeRequest('POST', '/api/auth/register', {
      email: `short${Date.now()}@example.com`,
      password: '12345',
      fullName: 'Test User'
    });

    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));

    if (response.status === 400 && response.data.message.includes('Mật khẩu phải có ít nhất 6 ký tự')) {
      console.log('✓ Short password rejected correctly');
      return true;
    } else {
      console.log('✗ Should have rejected short password');
      return false;
    }
  } catch (error) {
    console.log('✗ Error:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('========================================');
  console.log('Authentication Endpoints Manual Tests');
  console.log('========================================');
  console.log('Make sure the server is running on port 5000');
  console.log('Test email:', testEmail);

  const results = [];

  results.push(await testRegister());
  results.push(await testRegisterDuplicate());
  results.push(await testLogin());
  results.push(await testLoginWrongPassword());
  results.push(await testGetProfile());
  results.push(await testGetProfileNoToken());
  results.push(await testLogout());
  results.push(await testInvalidEmail());
  results.push(await testShortPassword());

  console.log('\n========================================');
  console.log('Test Summary');
  console.log('========================================');
  const passed = results.filter(r => r).length;
  const total = results.length;
  console.log(`Passed: ${passed}/${total}`);
  console.log(`Failed: ${total - passed}/${total}`);

  if (passed === total) {
    console.log('\n✓ All tests passed!');
  } else {
    console.log('\n✗ Some tests failed');
  }
}

// Run tests
runAllTests().catch(console.error);
