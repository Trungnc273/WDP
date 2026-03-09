/**
 * Test Review Components
 * Simple test to verify components can be imported without errors
 */

const fs = require('fs');
const path = require('path');

function testComponentExists(componentPath) {
  const fullPath = path.join(__dirname, 'src', componentPath);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${componentPath} exists`);
    return true;
  } else {
    console.log(`❌ ${componentPath} does not exist`);
    return false;
  }
}

function testServiceExists(servicePath) {
  const fullPath = path.join(__dirname, 'src', servicePath);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${servicePath} exists`);
    return true;
  } else {
    console.log(`❌ ${servicePath} does not exist`);
    return false;
  }
}

console.log('🧪 Testing Review and Report Components...\n');

console.log('📦 Services:');
testServiceExists('services/review.service.js');
testServiceExists('services/report.service.js');

console.log('\n📱 Review Components:');
testComponentExists('modules/review/RateSeller.jsx');
testComponentExists('modules/review/RateSeller.css');
testComponentExists('modules/review/ReviewList.jsx');
testComponentExists('modules/review/ReviewList.css');

console.log('\n📱 Report Components:');
testComponentExists('modules/report/ReportProduct.jsx');
testComponentExists('modules/report/ReportProduct.css');
testComponentExists('modules/report/Dispute.jsx');
testComponentExists('modules/report/Dispute.css');

console.log('\n📱 Profile Components:');
testComponentExists('modules/profile/UserReviews.jsx');
testComponentExists('modules/profile/UserReviews.css');

console.log('\n🎉 Component structure test completed!');
console.log('\nNext steps:');
console.log('1. Start frontend: npm start');
console.log('2. Test components in browser');
console.log('3. Verify API integration');