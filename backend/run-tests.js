const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get all test files
const testDir = path.join(__dirname, 'tests');
const controllerTestDir = path.join(testDir, 'controllers');

// Function to run a test file
function runTest(filePath) {
  console.log(`\n\n========== Running test: ${filePath} ==========`);
  try {
    const output = execSync(`node ${filePath}`, { encoding: 'utf8' });
    console.log(output);
    console.log(`✅ Test passed: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Test failed: ${filePath}`);
    console.error(error.message);
    return false;
  }
}

// Run all simple tests
console.log('Running simple tests...');
const simpleTestPassed = runTest(path.join(testDir, 'simple-test.js'));
const authControllerTestPassed = runTest(path.join(controllerTestDir, 'authController.simple.test.js'));
const reportControllerTestPassed = runTest(path.join(controllerTestDir, 'reportController.simple.test.js'));
const attendanceControllerTestPassed = runTest(path.join(controllerTestDir, 'attendanceController.simple.test.js'));
const leaveControllerTestPassed = runTest(path.join(controllerTestDir, 'leaveController.simple.test.js'));
const adminControllerTestPassed = runTest(path.join(controllerTestDir, 'adminController.simple.test.js'));
const companyControllerTestPassed = runTest(path.join(controllerTestDir, 'companyController.simple.test.js'));

// Exit with appropriate code
const allTestsPassed = simpleTestPassed && 
                      authControllerTestPassed && 
                      reportControllerTestPassed && 
                      attendanceControllerTestPassed && 
                      leaveControllerTestPassed && 
                      adminControllerTestPassed && 
                      companyControllerTestPassed;

console.log(`\n\n========== Test Summary ==========`);
console.log(`Simple test: ${simpleTestPassed ? '✅ Passed' : '❌ Failed'}`);
console.log(`Auth controller test: ${authControllerTestPassed ? '✅ Passed' : '❌ Failed'}`);
console.log(`Report controller test: ${reportControllerTestPassed ? '✅ Passed' : '❌ Failed'}`);
console.log(`Attendance controller test: ${attendanceControllerTestPassed ? '✅ Passed' : '❌ Failed'}`);
console.log(`Leave controller test: ${leaveControllerTestPassed ? '✅ Passed' : '❌ Failed'}`);
console.log(`Admin controller test: ${adminControllerTestPassed ? '✅ Passed' : '❌ Failed'}`);
console.log(`Company controller test: ${companyControllerTestPassed ? '✅ Passed' : '❌ Failed'}`);
console.log(`Overall: ${allTestsPassed ? '✅ All tests passed' : '❌ Some tests failed'}`);

process.exit(allTestsPassed ? 0 : 1);
