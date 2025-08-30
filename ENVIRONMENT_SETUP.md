# Environment Setup Guide

## 🔐 **Required Environment Variables**

Create a `.env` file in your project root with the following variables:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyDHLlvRJciUnhXUx_O896hw47GNw0H7uKA
VITE_FIREBASE_AUTH_DOMAIN=proof-of-presence-7730f.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=proof-of-presence-7730f
VITE_FIREBASE_STORAGE_BUCKET=proof-of-presence-7730f.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=25376022235
VITE_FIREBASE_APP_ID=1:25376022235:web:f39aba3d69860a7eff36fe
VITE_FIREBASE_MEASUREMENT_ID=G-7WPDQC44YR

# Google Cloud Vision API
VITE_GOOGLE_CLOUD_PROJECT_ID=proof-of-presence-7730f
VITE_GOOGLE_CLOUD_SERVICE_ACCOUNT_EMAIL=attendance-sa@proof-of-presence-7730f.iam.gserviceaccount.com

# Thirdweb Configuration
VITE_THIRDWEB_CLIENT_ID=your_thirdweb_client_id_here

# Smart Contract Address (replace with your deployed contract)
VITE_SMART_CONTRACT_ADDRESS=your_smart_contract_address_here
```

## 🚀 **Quick Setup Commands**

### Windows (PowerShell)
```powershell
# Create .env file
New-Item -Path ".env" -ItemType File -Force

# Add content to .env file
@"
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyDHLlvRJciUnhXUx_O896hw47GNw0H7uKA
VITE_FIREBASE_AUTH_DOMAIN=proof-of-presence-7730f.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=proof-of-presence-7730f
VITE_FIREBASE_STORAGE_BUCKET=proof-of-presence-7730f.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=25376022235
VITE_FIREBASE_APP_ID=1:25376022235:web:f39aba3d69860a7eff36fe
VITE_FIREBASE_MEASUREMENT_ID=G-7WPDQC44YR

# Google Cloud Vision API
VITE_GOOGLE_CLOUD_PROJECT_ID=proof-of-presence-7730f
VITE_GOOGLE_CLOUD_SERVICE_ACCOUNT_EMAIL=attendance-sa@proof-of-presence-7730f.iam.gserviceaccount.com

# Thirdweb Configuration
VITE_THIRDWEB_CLIENT_ID=your_thirdweb_client_id_here

# Smart Contract Address (replace with your deployed contract)
VITE_SMART_CONTRACT_ADDRESS=your_smart_contract_address_here
"@ | Out-File -FilePath ".env" -Encoding UTF8
```

### Windows (Command Prompt)
```cmd
# Create .env file
echo # Firebase Configuration > .env
echo VITE_FIREBASE_API_KEY=AIzaSyDHLlvRJciUnhXUx_O896hw47GNw0H7uKA >> .env
echo VITE_FIREBASE_AUTH_DOMAIN=proof-of-presence-7730f.firebaseapp.com >> .env
echo VITE_FIREBASE_PROJECT_ID=proof-of-presence-7730f >> .env
echo VITE_FIREBASE_STORAGE_BUCKET=proof-of-presence-7730f.firebasestorage.app >> .env
echo VITE_FIREBASE_MESSAGING_SENDER_ID=25376022235 >> .env
echo VITE_FIREBASE_APP_ID=1:25376022235:web:f39aba3d69860a7eff36fe >> .env
echo VITE_FIREBASE_MEASUREMENT_ID=G-7WPDQC44YR >> .env
echo. >> .env
echo # Google Cloud Vision API >> .env
echo VITE_GOOGLE_CLOUD_PROJECT_ID=proof-of-presence-7730f >> .env
echo VITE_GOOGLE_CLOUD_SERVICE_ACCOUNT_EMAIL=attendance-sa@proof-of-presence-7730f.iam.gserviceaccount.com >> .env
echo. >> .env
echo # Thirdweb Configuration >> .env
echo VITE_THIRDWEB_CLIENT_ID=your_thirdweb_client_id_here >> .env
echo. >> .env
echo # Smart Contract Address >> .env
echo VITE_SMART_CONTRACT_ADDRESS=your_smart_contract_address_here >> .env
```

## 🔑 **Google Cloud Service Account Setup**

Your service account is already configured with the following details:

- **Project ID**: `proof-of-presence-7730f`
- **Service Account Email**: `attendance-sa@proof-of-presence-7730f.iam.gserviceaccount.com`
- **Private Key**: Already provided in the service account JSON

## 📋 **Next Steps**

1. **Create the `.env` file** using one of the commands above
2. **Get your Thirdweb Client ID** from [thirdweb.com/create-api-key](https://thirdweb.com/create-api-key)
3. **Deploy your smart contract** and get the contract address
4. **Update the environment variables** with your actual values
5. **Restart your development server**

## 🚨 **Important Notes**

- **Never commit the `.env` file** to version control
- **Keep your service account private key secure**
- **The `.env` file should be in your project root** (same level as `package.json`)
- **All environment variables must start with `VITE_`** to be accessible in the frontend

## 🔍 **Verification**

After creating the `.env` file, restart your development server:

```bash
npm run dev
```

You should see:
- ✅ Firebase connected successfully
- ✅ Google Cloud Vision API working
- ✅ Thirdweb blockchain integration ready
- ✅ No more buffer/process errors
