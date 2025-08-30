import React, { useState, useEffect } from 'react';
import { useWallet, useConnect, useDisconnect } from '@thirdweb-dev/react';
import { 
  Wallet, 
  LogOut, 
  Copy, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';

const WalletConnection = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [showWalletList, setShowWalletList] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const wallet = useWallet();
  const connect = useConnect();
  const disconnect = useDisconnect();

  const { address, isConnected, isConnecting: walletConnecting } = wallet || {};
  const { connectors } = connect || {};

  // Auto-hide copied message
  useEffect(() => {
    if (copiedAddress) {
      const timer = setTimeout(() => setCopiedAddress(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedAddress]);

  const handleConnect = async (connector) => {
    try {
      setIsConnecting(true);
      await connect(connector);
      setShowWalletList(false);
      toast.success('Wallet connected successfully!');
    } catch (error) {
      console.error('Connection error:', error);
      let errorMessage = 'Failed to connect wallet';
      
      if (error.message.includes('User rejected')) {
        errorMessage = 'Connection cancelled by user';
      } else if (error.message.includes('No provider')) {
        errorMessage = 'Wallet not installed. Please install the wallet extension.';
      } else if (error.message.includes('Already processing')) {
        errorMessage = 'Connection already in progress';
      }
      
      toast.error(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    try {
      disconnect();
      toast.success('Wallet disconnected');
    } catch (error) {
      console.error('Disconnect error:', error);
      toast.error('Failed to disconnect wallet');
    }
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(true);
      toast.success('Address copied to clipboard!');
    } catch (error) {
      console.error('Copy failed:', error);
      toast.error('Failed to copy address');
    }
  };

  const getWalletIcon = (connector) => {
    const name = connector.name?.toLowerCase() || '';
    
    if (name.includes('metamask')) return '🦊';
    if (name.includes('walletconnect')) return '🔗';
    if (name.includes('coinbase')) return '🪙';
    if (name.includes('rainbow')) return '🌈';
    if (name.includes('trust')) return '🛡️';
    if (name.includes('phantom')) return '👻';
    if (name.includes('brave')) return '🦁';
    if (name.includes('opera')) return '🔴';
    
    return '💳';
  };

  const getWalletName = (connector) => {
    const name = connector.name || 'Unknown Wallet';
    
    // Map common wallet names to user-friendly names
    const walletNames = {
      'MetaMask': 'MetaMask',
      'WalletConnect': 'WalletConnect',
      'Coinbase Wallet': 'Coinbase Wallet',
      'Rainbow': 'Rainbow',
      'Trust Wallet': 'Trust Wallet',
      'Phantom': 'Phantom',
      'Brave Wallet': 'Brave Wallet',
      'Opera Wallet': 'Opera Wallet',
      'imToken': 'imToken',
      'TokenPocket': 'TokenPocket',
      'SafePal': 'SafePal',
      'Math Wallet': 'Math Wallet'
    };
    
    return walletNames[name] || name;
  };

  const getWalletDescription = (connector) => {
    const name = connector.name?.toLowerCase() || '';
    
    if (name.includes('metamask')) return 'Popular Ethereum wallet';
    if (name.includes('walletconnect')) return 'Connect any wallet';
    if (name.includes('coinbase')) return 'Coinbase exchange wallet';
    if (name.includes('rainbow')) return 'Beautiful mobile wallet';
    if (name.includes('trust')) return 'Secure mobile wallet';
    if (name.includes('phantom')) return 'Solana wallet';
    if (name.includes('brave')) return 'Built into Brave browser';
    if (name.includes('opera')) return 'Built into Opera browser';
    
    return 'Connect your wallet';
  };

  const getNetworkInfo = () => {
    // This would typically come from your blockchain service
    // For now, showing default Polygon info
    return {
      name: 'Polygon',
      chainId: 137,
      symbol: 'MATIC',
      explorer: 'https://polygonscan.com'
    };
  };

  const networkInfo = getNetworkInfo();

  if (isConnected && address) {
    return (
      <div className="relative">
        <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium text-green-800">Connected</p>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {networkInfo.name}
              </span>
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <p className="text-xs text-green-600 font-mono">
                {address.substring(0, 6)}...{address.substring(address.length - 4)}
              </p>
              <button
                onClick={copyAddress}
                className="text-green-600 hover:text-green-800 transition-colors"
                title="Copy address"
              >
                {copiedAddress ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <a
              href={`${networkInfo.explorer}/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-green-600 hover:text-green-800 transition-colors"
              title="View on explorer"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={handleDisconnect}
              className="p-2 text-red-600 hover:text-red-800 transition-colors"
              title="Disconnect wallet"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        {/* Connection Status */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <Wallet className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900">Connect Wallet</h3>
              <p className="text-xs text-gray-500">
                Connect your wallet to use blockchain features
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                {networkInfo.name}
              </span>
              <button
                onClick={() => setShowWalletList(!showWalletList)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${showWalletList ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Wallet List */}
        {showWalletList && (
          <div className="p-4 space-y-3">
            {connectors && connectors.length > 0 ? (
              connectors.map((connector, index) => (
                <button
                  key={index}
                  onClick={() => handleConnect(connector)}
                  disabled={isConnecting || walletConnecting}
                  className="w-full flex items-center space-x-3 p-3 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="text-2xl">{getWalletIcon(connector)}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {getWalletName(connector)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {getWalletDescription(connector)}
                    </p>
                  </div>
                  {isConnecting && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  )}
                </button>
              ))
            ) : (
              <div className="text-center py-4">
                <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No wallet connectors available</p>
                <p className="text-xs text-gray-400 mt-1">
                  Please check your Thirdweb configuration
                </p>
              </div>
            )}
          </div>
        )}

        {/* Network Information */}
        <div className="px-4 py-3 bg-gray-50 rounded-b-lg">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Network: {networkInfo.name} (Chain ID: {networkInfo.chainId})</span>
            <span>Currency: {networkInfo.symbol}</span>
          </div>
        </div>
      </div>

      {/* Connection Error */}
      {isConnecting && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <p className="text-sm text-blue-800">Connecting to wallet...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletConnection;

