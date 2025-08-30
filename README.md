# 🎯 AI-Powered Attendance System

A modern, blockchain-secured attendance tracking system built with **React**, **Firebase**, **Google Cloud Vision API**, and **Thirdweb** for blockchain integration.

## ✨ **Features**

- 🔐 **Firebase Authentication** - Secure user management
- 📸 **AI Face Recognition** - Google Cloud Vision API integration
- ⛓️ **Blockchain Storage** - Thirdweb-powered attendance records
- 📱 **Responsive UI** - Modern Tailwind CSS design
- 🎥 **Camera Integration** - Real-time photo capture
- 📊 **Session Management** - Create and manage attendance sessions
- 🔍 **Real-time Tracking** - Live attendance monitoring
- 📈 **Analytics Dashboard** - Blockchain statistics and insights

## 🏗️ **Architecture**

```
Frontend (React + Vite)
├── Firebase Authentication
├── Google Cloud Vision API
├── Thirdweb Blockchain Integration
└── Tailwind CSS UI
```

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- Google Cloud Project with Vision API enabled
- Firebase Project
- Thirdweb Account

### **Installation**

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Attendance
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the project root:
   ```bash
   # Firebase Configuration
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

   # Google Cloud Vision API
   VITE_GOOGLE_CLOUD_PROJECT_ID=your_project_id
   VITE_GOOGLE_CLOUD_API_KEY=your_api_key

   # Thirdweb Configuration
   VITE_THIRDWEB_CLIENT_ID=your_thirdweb_client_id

   # Smart Contract Address
   VITE_SMART_CONTRACT_ADDRESS=your_deployed_contract_address
   VITE_EXPECTED_WALLET_ADDRESS=your_wallet_address
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## 🔧 **Configuration**

### **Firebase Setup**
1. Create a Firebase project
2. Enable Authentication, Firestore, and Storage
3. Add your Firebase config to `.env`

### **Google Cloud Vision API**
1. Enable Vision API in your Google Cloud project
2. Create an API key
3. Add project details to `.env`

### **Thirdweb Setup**
1. Create account at [thirdweb.com](https://thirdweb.com)
2. Get your client ID
3. Deploy the smart contract from `contracts/AttendanceContract.sol`
4. Add contract address to `.env`

## 📁 **Project Structure**

```
src/
├── components/          # Reusable UI components
│   ├── CameraTest.jsx  # Camera testing component
│   ├── FirebaseStatus.jsx
│   ├── Layout.jsx
│   └── WalletConnection.jsx
├── contexts/           # React contexts (Auth, etc.)
├── pages/             # Main application pages
├── services/          # Business logic services
│   ├── blockchainService.js    # Thirdweb integration
│   ├── sessionService.js       # Session management
│   └── visionService.js        # Google Cloud Vision API
├── config/            # Configuration files
└── styles/            # CSS and styling
```

## 🎯 **Core Services**

### **VisionService**
- Face detection and analysis
- Google Cloud Vision API integration
- Fallback to mock recognition for development

### **BlockchainService**
- Thirdweb smart contract integration
- Attendance record storage on blockchain
- Real-time blockchain statistics

### **SessionService**
- Firebase Firestore integration
- Session creation and management
- Attendance tracking and reporting

## 🧪 **Testing Components**

### **CameraTest Component**
Use the `CameraTest` component to debug camera issues:
```jsx
import CameraTest from './components/CameraTest';

// Add to your page for testing
<CameraTest />
```

This component provides:
- Camera device detection
- Permission testing
- Image capture testing
- Detailed error messages
- Troubleshooting tips

## 🚀 **Deployment**

### **Build for Production**
```bash
npm run build
```

### **Deploy Smart Contract**
```bash
# Using Thirdweb
npx thirdweb deploy
```

## 🔒 **Security Features**

- Firebase Authentication
- API key authentication for Google Cloud
- Blockchain immutability for attendance records
- Secure API key management

## 📱 **Usage**

1. **Create Sessions** - Set up attendance sessions
2. **Add Students** - Register students with photos
3. **Mark Attendance** - Use AI face recognition
4. **View Reports** - Monitor attendance statistics
5. **Blockchain Verification** - Verify records on blockchain

## 🆘 **Troubleshooting**

### **Common Issues**
- **Camera not working**: Check browser permissions and HTTPS requirement
- **Blockchain connection failed**: Verify Thirdweb configuration and wallet connection
- **Face recognition errors**: Check Google Cloud Vision API setup

### **Quick Fixes**
1. **Camera Issues**: Use the `CameraTest` component to diagnose problems
2. **Blockchain Issues**: Check browser console for connection errors
3. **API Errors**: Verify environment variables are set correctly

### **Detailed Troubleshooting**
See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for comprehensive solutions to common problems.

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 **License**

This project is licensed under the MIT License.

## 🆘 **Support**

For support and questions:
- Check the [Troubleshooting Guide](TROUBLESHOOTING.md)
- Review [Environment Setup Guide](ENVIRONMENT_SETUP.md)
- Review Firebase and Google Cloud documentation
- Consult Thirdweb documentation for blockchain integration
