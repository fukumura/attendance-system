console.log('Running simple test...');

// A simple test function
function testAddition() {
  const result = 1 + 1;
  const expected = 2;
  
  if (result === expected) {
    console.log('✅ Test passed: 1 + 1 = 2');
    return true;
  } else {
    console.error(`❌ Test failed: Expected ${expected}, got ${result}`);
    return false;
  }
}

// Run the test
const passed = testAddition();

// Exit with appropriate code
process.exit(passed ? 0 : 1);
