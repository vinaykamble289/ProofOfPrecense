import React, { useEffect, useState } from 'react';
import { useBlockchainService } from '../services/blockchainService';
import { Wallet, CheckCircle, XCircle, AlertCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const WalletConnection = () => {
  const { 
    address, 
    isConnected, 
    isConnecting, 
    isExpectedWallet, 
    connectToWallet, 
    disconnectWallet,
    contractAddress,
    isThirdwebAvailable
  } = useBlockchainService();

  const [isAutoConnecting, setIsAutoConnecting] = useState(false);

  // Auto-connect to wallet when component mounts
  useEffect(() => {
    if (isThirdwebAvailable && !isConnected && !isConnecting && !isAutoConnecting) {
      setIsAutoConnecting(true);
      handleAutoConnect();
    }
  }, [isConnected, isConnecting, isThirdwebAvailable]);

  const handleAutoConnect = async () => {
    try {
      await connectToWallet();
      toast.success('Wallet connected automatically!');
    } catch (error) {
      console.error('Auto-connection failed:', error);
      toast.error('Auto-connection failed. Please connect manually.');
    } finally {
      setIsAutoConnecting(false);
    }
  };

  const handleManualConnect = async () => {
    try {
      await connectToWallet();
      toast.success('Wallet connected successfully!');
    } catch (error) {
      console.error('Manual connection failed:', error);
      toast.error(error.message || 'Failed to connect wallet');
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    toast.success('Wallet disconnected');
  };

  const getStatusColor = () => {
    if (!isThirdwebAvailable) return 'text-red-600';
    if (isExpectedWallet) return 'text-green-600';
    if (isConnected) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = () => {
    if (!isThirdwebAvailable) return <AlertTriangle className="w-5 h-5" />;
    if (isExpectedWallet) return <CheckCircle className="w-5 h-5" />;
    if (isConnected) return <AlertCircle className="w-5 h-5" />;
    return <XCircle className="w-5 h-5" />;
  };

  const getStatusText = () => {
    if (!isThirdwebAvailable) return 'Thirdweb Not Available';
    if (isExpectedWallet) return 'Correct Wallet Connected';
    if (isConnected) return 'Wrong Wallet Connected';
    return 'Wallet Not Connected';
  };

  const formatAddress = (addr) => {
    if (!addr) return 'Not Connected';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const getExpectedAddress = () => {
    return import.meta.env.VITE_EXPECTED_WALLET_ADDRESS || '0xA83a2fb6F87f6f18D6AFfE9763c1E278c324aC9B';
  };

  // If Thirdweb is not available, show a warning
  if (!isThirdwebAvailable) {
    return (
      <div className="bg-bg-secondary rounded-lg p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">Wallet Connection</h3>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-sm font-medium text-red-600">Thirdweb Not Available</span>
          </div>
        </div>
        
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="text-sm text-red-800">
              <p className="font-medium">Thirdweb Integration Issue</p>
              <p className="mt-1">
                The blockchain integration is currently unavailable. This might be due to:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Thirdweb provider not properly initialized</li>
                <li>Network connectivity issues</li>
                <li>Thirdweb service temporarily unavailable</li>
              </ul>
              <p className="mt-2">
                Firebase features will continue to work normally. Please refresh the page or try again later.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-secondary rounded-lg p-6 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary">Wallet Connection</h3>
        <div className="flex items-center space-x-2">
          <Wallet className="w-5 h-5 text-accent-primary" />
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>
      </div>

      {/* Connection Status */}
      <div className="space-y-4">
        {/* Current Wallet Status */}
        <div className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div>
              <p className="text-sm text-text-secondary">Current Wallet</p>
              <p className="font-mono text-text-primary">{formatAddress(address)}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-tertiary">Status</p>
            <p className={`text-sm font-medium ${getStatusColor()}`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </p>
          </div>
        </div>

        {/* Expected Wallet */}
        <div className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm text-text-secondary">Expected Wallet</p>
              <p className="font-mono text-text-primary">{formatAddress(getExpectedAddress())}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-tertiary">Required</p>
            <p className="text-sm font-medium text-green-600">Yes</p>
          </div>
        </div>

        {/* Smart Contract Status */}
        {contractAddress && (
          <div className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">C</span>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Smart Contract</p>
                <p className="font-mono text-text-primary">{formatAddress(contractAddress)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-tertiary">Status</p>
              <p className="text-sm font-medium text-blue-600">Deployed</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          {!isConnected ? (
            <button
              onClick={handleManualConnect}
              disabled={isConnecting || isAutoConnecting}
              className="btn btn-primary flex-1"
            >
              {isConnecting || isAutoConnecting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4 mr-2" />
                  Connect Wallet
                </>
              )}
            </button>
          ) : (
            <>
              {!isExpectedWallet && (
                <button
                  onClick={handleManualConnect}
                  className="btn btn-warning flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Switch Wallet
                </button>
              )}
              <button
                onClick={handleDisconnect}
                className="btn btn-secondary"
              >
                Disconnect
              </button>
            </>
          )}
        </div>

        {/* Instructions */}
        {!isExpectedWallet && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Wallet Mismatch</p>
                <p>Please connect with wallet address: <code className="bg-yellow-100 px-1 rounded">{getExpectedAddress()}</code></p>
                <p className="mt-1">This ensures you can interact with the smart contract and manage attendance records.</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {isExpectedWallet && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="text-sm text-green-800">
                <p className="font-medium">Wallet Connected Successfully!</p>
                <p>You can now interact with the smart contract and manage attendance records on the blockchain.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletConnection;
