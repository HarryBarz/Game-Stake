/**
 * Test script to verify signature format matches contract exactly
 * Run with: node test-signature.js
 */

// Simulate what the contract does:
// 1. Contract calls: Evvm(EVVM_ADDRESS).getEvvmID() -> returns 1078 (uint256)
// 2. Contract calls: Strings.toString(1078) -> "1078"
// 3. Contract builds: string.concat("1078", ",", "publicStaking", ",", string.concat("true", ",", "1", ",", "1763888423169"))
// 4. Final message: "1078,publicStaking,true,1,1763888423169"

const evvmID = 1078;
const functionName = "publicStaking";
const isStaking = true;
const amount = 1;
const nonce = 1763888423169;

// Contract uses Strings.toString() which converts uint256 to decimal string
const evvmIDStr = evvmID.toString(); // "1078"
const amountStr = amount.toString(); // "1"
const nonceStr = nonce.toString(); // "1763888423169"

// Contract builds inputs as: string.concat("true", ",", "1", ",", "1763888423169")
const inputs = `${isStaking ? 'true' : 'false'},${amountStr},${nonceStr}`;

// Contract builds final message as: string.concat("1078", ",", "publicStaking", ",", inputs)
const message = `${evvmIDStr},${functionName},${inputs}`;

console.log('=== CONTRACT SIGNATURE FORMAT TEST ===');
console.log('EVVM ID (uint256):', evvmID);
console.log('EVVM ID (string):', evvmIDStr);
console.log('Function name:', functionName);
console.log('Inputs:', inputs);
console.log('Final message:', message);
console.log('Message length:', message.length);
console.log('');
console.log('Expected format: "{evvmID},publicStaking,{isStaking},{amount},{nonce}"');
console.log('Actual format:', message);
console.log('Match:', message === '1078,publicStaking,true,1,1763888423169' ? '✅ YES' : '❌ NO');

