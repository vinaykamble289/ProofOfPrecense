# Troubleshooting Guide for Camera and Blockchain Issues

## Camera Issues

### 1. Camera Permission Denied
**Problem**: Camera access is blocked by the browser
**Solution**: 
- Click the camera icon in the browser address bar
- Select "Allow" for camera access
- Refresh the page and try again

### 2. Camera Not Found
**Problem**: No camera detected on the device
**Solution**:
- Ensure your device has a camera
- Check if another application is using the camera
- Close other apps that might be using the camera
- Try refreshing the page

### 3. Camera Already in Use
**Problem**: Camera is being used by another application
**Solution**:
- Close other applications that might be using the camera
- Check for video conferencing apps, photo apps, etc.
- Restart your device if the issue persists

### 4. Camera Constraints Not Supported
**Problem**: Browser doesn't support the requested camera settings
**Solution**:
- Update your browser to the latest version
- Try using a different browser (Chrome, Firefox, Safari)
- The app will automatically fall back to supported settings

### 5. HTTPS Required
**Problem**: Camera API requires secure connection
**Solution**:
- Ensure you're accessing the app via HTTPS
- For local development, use `npm run dev` which provides HTTPS

## Blockchain Connection Issues

### 1. Thirdweb Client ID Missing
**Problem**: Thirdweb configuration not set up
**Solution**:
- Get a Thirdweb Client ID from [thirdweb.com](https://thirdweb.com)
- Create a `.env` file in your project root
- Add: `VITE_THIRDWEB_CLIENT_ID=your_client_id_here`

### 2. Smart Contract Not Available
**Problem**: Smart contract address not configured
**Solution**:
- Deploy your smart contract to Polygon network
- Update the contract address in your environment variables
- Add: `VITE_SMART_CONTRACT_ADDRESS=your_contract_address_here`

### 3. Wallet Not Connected
**Problem**: No wallet connected
**Solution**:
- Install any supported wallet (MetaMask, WalletConnect, Coinbase Wallet, etc.)
- Connect your wallet to the Polygon network
- Ensure you have some MATIC for gas fees
- Refresh the page and try connecting again

### 4. Wrong Network
**Problem**: Wallet connected to wrong blockchain network
**Solution**:
- Switch your wallet to Polygon network
- Add Polygon network if not available:
  - Network Name: Polygon
  - RPC URL: https://polygon-rpc.com
  - Chain ID: 137
  - Currency Symbol: MATIC

### 5. Insufficient Gas Fees
**Problem**: Not enough MATIC for transaction fees
**Solution**:
- Add MATIC to your wallet
- You can get test MATIC from Polygon faucet for testing

## Environment Setup

### Required Environment Variables
Create a `.env` file in your project root:

```env
# Thirdweb Configuration
VITE_THIRDWEB_CLIENT_ID=your_thirdweb_client_id_here

# Smart Contract Configuration
VITE_SMART_CONTRACT_ADDRESS=your_contract_address_here

# Google Cloud Vision API (Optional)
VITE_GOOGLE_CLOUD_PROJECT_ID=your_project_id_here
VITE_GOOGLE_CLOUD_API_KEY=your_api_key_here
```

### Getting Thirdweb Client ID
1. Go to [thirdweb.com](https://thirdweb.com)
2. Sign up/Login to your account
3. Go to Settings → API Keys
4. Create a new API key
5. Copy the Client ID

### Getting Smart Contract Address
1. Deploy your AttendanceContract.sol to Polygon network
2. Copy the deployed contract address
3. Update your environment variables

## Testing Steps

### 1. Test Camera First
1. Open the CameraTest component
2. Check if camera devices are detected
3. Try starting the camera
4. Test image capture functionality

### 2. Test Wallet Connection
1. Go to the Wallet Test page (`/wallet-test`)
2. Try connecting different wallet types
3. Verify connection status
4. Run wallet tests to check functionality

### 3. Test Blockchain Connection
1. Check browser console for connection errors
2. Verify wallet connection status
3. Test contract interaction
4. Check network configuration

### 4. Test Full Flow
1. Select a session
2. Start camera and capture image
3. Process face recognition
4. Mark attendance
5. Verify blockchain transaction

## Common Error Messages

### Camera Errors
- `NotAllowedError`: Permission denied
- `NotFoundError`: No camera found
- `NotReadableError`: Camera in use
- `OverconstrainedError`: Unsupported settings

### Blockchain Errors
- `Smart contract not available`: Contract not configured
- `Wallet not connected`: No wallet connected
- `Wrong network`: Connected to wrong blockchain
- `Insufficient funds`: Not enough MATIC for gas

## Supported Wallets

### Browser Extensions
- **MetaMask** 🦊 - Most popular Ethereum wallet
- **Brave Wallet** 🦁 - Built into Brave browser
- **Opera Wallet** 🔴 - Built into Opera browser
- **Phantom** 👻 - Solana wallet (with EVM support)

### Mobile Wallets
- **WalletConnect** 🔗 - Connect any mobile wallet
- **Coinbase Wallet** 🪙 - Coinbase exchange wallet
- **Rainbow** 🌈 - Beautiful mobile wallet
- **Trust Wallet** 🛡️ - Secure mobile wallet
- **imToken** - Popular in Asia
- **TokenPocket** - Multi-chain wallet
- **SafePal** - Hardware wallet integration
- **Math Wallet** - Multi-chain support

### Hardware Wallets
- **Ledger** - Via WalletConnect
- **Trezor** - Via WalletConnect
- **SafePal** - Direct integration

## Browser Compatibility

### Supported Browsers
- Chrome 53+
- Firefox 36+
- Safari 11+
- Edge 79+

### Required Features
- MediaDevices API
- getUserMedia support
- Canvas API
- Web3/Thirdweb support

## Getting Help

If you're still experiencing issues:

1. Check the browser console for error messages
2. Verify all environment variables are set correctly
3. Ensure you're using HTTPS (required for camera)
4. Test with the CameraTest component first
5. Use the Wallet Test page (`/wallet-test`) to diagnose wallet issues
6. Check network connectivity and firewall settings

## Development Tips

- Use `npm run dev` for local development with HTTPS
- Check browser console for detailed error logs
- Test camera functionality in incognito mode
- Test wallet connections with different wallet types
- Verify blockchain connection before testing attendance
- Use test networks for development and testing
- Use the Wallet Test page (`/wallet-test`) to debug wallet issues
