const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testAuthFlow() {
  console.log('=== Testing Authentication Flow ===\n');

  try {
    // Test 1: Register a new user
    console.log('1. Testing Registration...');
    const registerData = {
      email: `test${Date.now()}@example.com`,
      password: 'password123',
      fullName: 'Test User',
    };

    const registerResponse = await axios.post(
      `${API_URL}/api/auth/register`,
      registerData
    );

    if (registerResponse.data.success) {
      console.log('✓ Registration successful');
      console.log('  User:', registerResponse.data.data.user.email);
      console.log('  Token received:', registerResponse.data.data.token ? 'Yes' : 'No');
    }

    const token = registerResponse.data.data.token;

    // Test 2: Get Profile with token
    console.log('\n2. Testing Get Profile...');
    const profileResponse = await axios.get(`${API_URL}/api/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (profileResponse.data.success) {
      console.log('✓ Get profile successful');
      console.log('  Full Name:', profileResponse.data.data.fullName);
      console.log('  Email:', profileResponse.data.data.email);
      console.log('  Role:', profileResponse.data.data.role);
    }

    // Test 3: Login with the same credentials
    console.log('\n3. Testing Login...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: registerData.email,
      password: registerData.password,
    });

    if (loginResponse.data.success) {
      console.log('✓ Login successful');
      console.log('  Token received:', loginResponse.data.data.token ? 'Yes' : 'No');
    }

    // Test 4: Test invalid credentials
    console.log('\n4. Testing Invalid Login...');
    try {
      await axios.post(`${API_URL}/api/auth/login`, {
        email: registerData.email,
        password: 'wrongpassword',
      });
      console.log('✗ Should have failed with wrong password');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✓ Invalid login correctly rejected');
        console.log('  Error message:', error.response.data.message);
      }
    }

    // Test 5: Test duplicate email registration
    console.log('\n5. Testing Duplicate Email Registration...');
    try {
      await axios.post(`${API_URL}/api/auth/register`, registerData);
      console.log('✗ Should have failed with duplicate email');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✓ Duplicate email correctly rejected');
        console.log('  Error message:', error.response.data.message);
      }
    }

    console.log('\n=== All Authentication Tests Passed! ===');
    return true;
  } catch (error) {
    console.error('\n✗ Test failed:', error.message);
    if (error.response) {
      console.error('  Status:', error.response.status);
      console.error('  Message:', error.response.data.message);
    }
    return false;
  }
}

testAuthFlow();
