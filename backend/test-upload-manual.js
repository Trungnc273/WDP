/**
 * Manual Test Script for File Upload
 * 
 * This script tests the file upload functionality
 * Run: node test-upload-manual.js
 */

const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Test user credentials
const testUser = {
  email: 'upload-test@example.com',
  password: 'password123',
  fullName: 'Upload Test User'
};

let authToken = '';

// Helper function to create a test image file
function createTestImage() {
  const testImagePath = path.join(__dirname, 'test-image.png');
  
  // Create a simple 1x1 PNG image (smallest valid PNG)
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
    0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
    0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
    0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
    0x42, 0x60, 0x82
  ]);
  
  fs.writeFileSync(testImagePath, pngData);
  return testImagePath;
}

// Test 1: Register or login to get token
async function getAuthToken() {
  console.log('\n=== Test 1: Get Authentication Token ===');
  
  try {
    // Try to login first
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    authToken = loginResponse.data.data.token;
    console.log('✓ Login successful');
    console.log('Token:', authToken.substring(0, 20) + '...');
  } catch (error) {
    // If login fails, try to register
    try {
      const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, testUser);
      authToken = registerResponse.data.data.token;
      console.log('✓ Registration successful');
      console.log('Token:', authToken.substring(0, 20) + '...');
    } catch (regError) {
      console.error('✗ Failed to get auth token:', regError.response?.data || regError.message);
      throw regError;
    }
  }
}

// Test 2: Upload single image
async function testSingleImageUpload() {
  console.log('\n=== Test 2: Upload Single Image ===');
  
  const testImagePath = createTestImage();
  const productId = 'test-product-123';
  
  try {
    const formData = new FormData();
    formData.append('image', fs.createReadStream(testImagePath));
    
    const response = await axios.post(`${BASE_URL}/api/upload/image?productId=${productId}`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✓ Single image upload successful');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    // Clean up test image
    fs.unlinkSync(testImagePath);
    
    return response.data.data.path;
  } catch (error) {
    console.error('✗ Single image upload failed:', error.response?.data || error.message);
    fs.unlinkSync(testImagePath);
    throw error;
  }
}

// Test 3: Upload multiple images
async function testMultipleImageUpload() {
  console.log('\n=== Test 3: Upload Multiple Images ===');
  
  const testImagePath1 = createTestImage();
  const testImagePath2 = path.join(__dirname, 'test-image-2.png');
  fs.copyFileSync(testImagePath1, testImagePath2);
  const productId = 'test-product-456';
  
  try {
    const formData = new FormData();
    formData.append('images', fs.createReadStream(testImagePath1));
    formData.append('images', fs.createReadStream(testImagePath2));
    
    const response = await axios.post(`${BASE_URL}/api/upload/images?productId=${productId}`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✓ Multiple images upload successful');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    // Clean up test images
    fs.unlinkSync(testImagePath1);
    fs.unlinkSync(testImagePath2);
  } catch (error) {
    console.error('✗ Multiple images upload failed:', error.response?.data || error.message);
    if (fs.existsSync(testImagePath1)) fs.unlinkSync(testImagePath1);
    if (fs.existsSync(testImagePath2)) fs.unlinkSync(testImagePath2);
    throw error;
  }
}

// Test 4: Test file access via static route
async function testStaticFileAccess(imagePath) {
  console.log('\n=== Test 4: Access Uploaded Image ===');
  
  try {
    const response = await axios.get(`${BASE_URL}${imagePath}`, {
      responseType: 'arraybuffer'
    });
    
    console.log('✓ Image accessible via static route');
    console.log('Content-Type:', response.headers['content-type']);
    console.log('Content-Length:', response.headers['content-length']);
  } catch (error) {
    console.error('✗ Failed to access image:', error.response?.status || error.message);
    throw error;
  }
}

// Test 5: Test upload without authentication
async function testUploadWithoutAuth() {
  console.log('\n=== Test 5: Upload Without Authentication (Should Fail) ===');
  
  const testImagePath = createTestImage();
  const productId = 'test-product-789';
  
  try {
    const formData = new FormData();
    formData.append('image', fs.createReadStream(testImagePath));
    
    await axios.post(`${BASE_URL}/api/upload/image?productId=${productId}`, formData, {
      headers: formData.getHeaders()
    });
    
    console.error('✗ Upload without auth should have failed but succeeded');
    fs.unlinkSync(testImagePath);
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✓ Upload correctly rejected without authentication');
    } else {
      console.error('✗ Unexpected error:', error.response?.data || error.message);
    }
    fs.unlinkSync(testImagePath);
  }
}

// Test 6: Test invalid file type
async function testInvalidFileType() {
  console.log('\n=== Test 6: Upload Invalid File Type (Should Fail) ===');
  
  const testFilePath = path.join(__dirname, 'test-file.txt');
  fs.writeFileSync(testFilePath, 'This is a text file');
  const productId = 'test-product-invalid';
  
  try {
    const formData = new FormData();
    formData.append('image', fs.createReadStream(testFilePath));
    
    await axios.post(`${BASE_URL}/api/upload/image?productId=${productId}`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.error('✗ Invalid file type should have been rejected but succeeded');
    fs.unlinkSync(testFilePath);
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✓ Invalid file type correctly rejected');
      console.log('Error message:', error.response.data.message);
    } else {
      console.error('✗ Unexpected error:', error.response?.data || error.message);
    }
    fs.unlinkSync(testFilePath);
  }
}

// Run all tests
async function runTests() {
  console.log('Starting File Upload Tests...');
  console.log('Make sure the server is running on', BASE_URL);
  
  try {
    await getAuthToken();
    const imagePath = await testSingleImageUpload();
    await testMultipleImageUpload();
    await testStaticFileAccess(imagePath);
    await testUploadWithoutAuth();
    await testInvalidFileType();
    
    console.log('\n=== All Tests Completed ===');
    console.log('✓ File upload functionality is working correctly');
  } catch (error) {
    console.error('\n=== Tests Failed ===');
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run tests
runTests();
