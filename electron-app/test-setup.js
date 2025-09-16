// Test script to verify the application setup
const fs = require('fs');
const path = require('path');

console.log('🔍 Testing POE Trade Data Viewer Setup...\n');

// Test 1: Check if required files exist
const requiredFiles = [
  'package.json',
  'main.js',
  'renderer.js',
  'index.html',
  'auth-service.js',
  'config.js'
];

console.log('📁 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} - Found`);
  } else {
    console.log(`❌ ${file} - Missing`);
    allFilesExist = false;
  }
});

// Test 2: Check package.json dependencies
console.log('\n📦 Checking dependencies...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = [
    'google-auth-library',
    'stripe',
    'jsonwebtoken',
    'axios',
    'robotjs',
    'ws'
  ];

  requiredDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`✅ ${dep} - ${packageJson.dependencies[dep]}`);
    } else {
      console.log(`❌ ${dep} - Missing from dependencies`);
      allFilesExist = false;
    }
  });
} catch (error) {
  console.log('❌ Error reading package.json:', error.message);
  allFilesExist = false;
}

// Test 3: Check config.js
console.log('\n⚙️ Checking configuration...');
try {
  const config = require('./config.js');
  
  const configChecks = [
    { key: 'google.clientId', value: config.google.clientId },
    { key: 'backend.url', value: config.backend.url },
    { key: 'stripe.publishableKey', value: config.stripe.publishableKey }
  ];

  configChecks.forEach(check => {
    if (check.value && !check.value.includes('YOUR_')) {
      console.log(`✅ ${check.key} - Configured`);
    } else {
      console.log(`⚠️ ${check.key} - Needs configuration`);
    }
  });
} catch (error) {
  console.log('❌ Error reading config.js:', error.message);
  allFilesExist = false;
}

// Test 4: Check if node_modules exists
console.log('\n📚 Checking node_modules...');
if (fs.existsSync('node_modules')) {
  console.log('✅ node_modules directory exists');
} else {
  console.log('❌ node_modules directory missing - run "npm install"');
  allFilesExist = false;
}

// Test 5: Check Cloudflare Worker files
console.log('\n☁️ Checking Cloudflare Worker setup...');
const workerPath = path.join('..', 'whisper-backend');
if (fs.existsSync(workerPath)) {
  console.log('✅ whisper-backend directory exists');
  
  const workerFiles = ['src/index.js', 'package.json', 'wrangler.jsonc'];
  workerFiles.forEach(file => {
    const filePath = path.join(workerPath, file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file} - Found`);
    } else {
      console.log(`❌ ${file} - Missing`);
    }
  });
} else {
  console.log('❌ whisper-backend directory missing');
}

// Summary
console.log('\n📋 Setup Summary:');
if (allFilesExist) {
  console.log('✅ All required files are present');
  console.log('✅ Dependencies are configured');
  console.log('✅ Basic setup is complete');
  console.log('\n🚀 Next steps:');
  console.log('1. Configure your API keys in config.js');
  console.log('2. Set up Google OAuth credentials');
  console.log('3. Configure Stripe products and prices');
  console.log('4. Deploy your Cloudflare Worker');
  console.log('5. Run "npm start" to launch the app');
} else {
  console.log('❌ Setup incomplete - please fix the issues above');
  console.log('\n🔧 To fix:');
  console.log('1. Run "npm install" to install dependencies');
  console.log('2. Check that all required files are present');
  console.log('3. Configure your API keys in config.js');
}

console.log('\n📖 For detailed setup instructions, see setup-instructions.md');
