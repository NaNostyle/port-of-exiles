// Debug script to check all cookies in the browser
console.log('🍪 Debug: Checking all cookies in browser...');

// This script should be run in the browser console on pathofexile.com
// It will show all cookies that are accessible

function checkAllCookies() {
  console.log('🍪 All cookies from document.cookie:');
  console.log(document.cookie);
  
  console.log('\n🍪 Parsed cookies:');
  const cookies = document.cookie.split(';');
  cookies.forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      console.log(`🍪 Cookie: ${name} = ${value.substring(0, 20)}...`);
    }
  });
  
  // Check for specific cookies we're looking for
  const targetCookies = ['cf_clearance', 'POESESSID', 'cf_bm', 'cf_ray'];
  targetCookies.forEach(cookieName => {
    const value = getCookie(cookieName);
    if (value) {
      console.log(`✅ Found ${cookieName}: ${value.substring(0, 20)}...`);
    } else {
      console.log(`❌ Not found: ${cookieName}`);
    }
  });
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

// Run the check
checkAllCookies();

console.log('\n🍪 Instructions:');
console.log('1. Run this script in the browser console on pathofexile.com');
console.log('2. Check if cf_clearance cookie is present');
console.log('3. If not present, you may need to trigger Cloudflare challenge');
console.log('4. Try refreshing the page or navigating to a new POE page');
