// Configuration example file - copy this to config.js and fill in your values
export const config = {
  // Google Cloud Vision API
  GOOGLE_CLOUD_PROJECT_ID: 'your_project_id_here',
  GOOGLE_CLOUD_API_KEY: 'your_api_key_here',

  // Thirdweb Configuration
  THIRDWEB_CLIENT_ID: 'your_thirdweb_client_id_here',

  // Smart Contract Configuration
  SMART_CONTRACT_ADDRESS: 'your_contract_address_here',

  // Firebase Configuration (if not using firebase.js)
  FIREBASE_API_KEY: 'your_firebase_api_key_here',
  FIREBASE_AUTH_DOMAIN: 'your_project.firebaseapp.com',
  FIREBASE_PROJECT_ID: 'your_project_id_here',
  FIREBASE_STORAGE_BUCKET: 'your_project.appspot.com',
  FIREBASE_MESSAGING_SENDER_ID: 'your_sender_id_here',
  FIREBASE_APP_ID: 'your_app_id_here'
};

// Usage:
// 1. Copy this file to config.js
// 2. Fill in your actual values
// 3. Import and use in your components
// 4. Add config.js to .gitignore to keep secrets safe

// Note: You can now connect ANY wallet - no specific wallet address required!
// The system will work with MetaMask, WalletConnect, Coinbase Wallet, and many others.
