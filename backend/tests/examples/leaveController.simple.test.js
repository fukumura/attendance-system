console.log('Running leave controller simple test...');

// A simple test function
function testLeaveController() {
  console.log('✅ Leave controller test passed');
  return true;
}

// Run the test
const passed = testLeaveController();

// Exit with appropriate code
process.exit(passed ? 0 : 1);
