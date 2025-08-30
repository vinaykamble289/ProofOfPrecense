import React, { useState } from 'react';
import { useWallet, useConnect, useDisconnect } from '@thirdweb-dev/react';
import { useBlockchainService } from '../services/blockchainService';
import WalletConnection from '../components/WalletConnection';
import { 
  Wallet, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  ExternalLink,
  Copy,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

const WalletTest = () => {
  const [testResults, setTestResults] = useState({});
  const [isTesting, setIsTesting] = useState(false);

  const wallet = useWallet();
  const { contract, getStats, isWalletConnected, contractAddress } = useBlockchainService();

  const { address, isConnected, isConnecting } = wallet || {};

  const runWalletTests = async () => {
    setIsTesting(true);
    const results = {};

    try {
      // Test 1: Wallet Connection
      results.walletConnection = {
        status: isConnected ? 'success' : 'error',
        message: isConnected ? 'Wallet connected successfully' : 'No wallet connected',
        details: isConnected ? `Connected to: ${address}` : 'Please connect a wallet first'
      };

      // Test 2: Contract Availability
      if (contract) {
        results.contractAvailability = {
          status: 'success',
          message: 'Smart contract available',
          details: `Contract address: ${contractAddress}`
        };
      } else {
        results.contractAvailability = {
          status: 'error',
          message: 'Smart contract not available',
          details: 'Please check your contract configuration'
        };
      }

      // Test 3: Blockchain Stats
      if (contract && isConnected) {
        try {
          const stats = await getStats();
          results.blockchainStats = {
            status: 'success',
            message: 'Blockchain stats retrieved',
            details: `Total records: ${stats.totalRecords}, Last block: ${stats.lastBlockNumber}`
          };
        } catch (error) {
          results.blockchainStats = {
            status: 'error',
            message: 'Failed to get blockchain stats',
            details: error.message
          };
        }
      } else {
        results.blockchainStats = {
          status: 'warning',
          message: 'Cannot test blockchain stats',
          details: 'Wallet or contract not available'
        };
      }

      // Test 4: Network Information
      results.networkInfo = {
        status: 'info',
        message: 'Network information',
        details: 'Polygon Mainnet (Chain ID: 137)'
      };

    } catch (error) {
      console.error('Test error:', error);
      results.generalError = {
        status: 'error',
        message: 'Test failed',
        details: error.message
      };
    }

    setTestResults(results);
    setIsTesting(false);
    toast.success('Wallet tests completed!');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const copyAddress = async () => {
    if (address) {
      try {
        await navigator.clipboard.writeText(address);
        toast.success('Address copied to clipboard!');
      } catch (error) {
        toast.error('Failed to copy address');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Wallet Connection Test</h1>
          <p className="text-gray-600 mt-2">
            Test your wallet connection and blockchain functionality
          </p>
        </div>

        {/* Wallet Connection Component */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Connect Your Wallet</h2>
            <WalletConnection />
          </div>
        </div>

        {/* Current Status */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Wallet className="w-6 h-6 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Wallet Status</p>
                    <p className={`text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">C</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Contract Status</p>
                    <p className={`text-sm ${contract ? 'text-green-600' : 'text-red-600'}`}>
                      {contract ? 'Available' : 'Not Available'}
                    </p>
                  </div>
                </div>
              </div>

              {isConnected && address && (
                <>
                  <div className="p-4 border rounded-lg md:col-span-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Wallet Address</p>
                        <p className="text-sm font-mono text-gray-600">
                          {address.substring(0, 6)}...{address.substring(address.length - 4)}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={copyAddress}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Copy address"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <a
                          href={`https://polygonscan.com/address/${address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          title="View on PolygonScan"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Test Results</h2>
              <button
                onClick={runWalletTests}
                disabled={isTesting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Testing...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Run Tests</span>
                  </>
                )}
              </button>
            </div>

            {Object.keys(testResults).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(testResults).map(([key, result]) => (
                  <div
                    key={key}
                    className={`p-4 border rounded-lg ${getStatusColor(result.status)}`}
                  >
                    <div className="flex items-start space-x-3">
                      {getStatusIcon(result.status)}
                      <div className="flex-1">
                        <p className="font-medium">{result.message}</p>
                        <p className="text-sm opacity-80 mt-1">{result.details}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No tests run yet. Click "Run Tests" to check your wallet connection.</p>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">How to Test Your Wallet</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li><strong>Connect Wallet:</strong> Use the wallet connection component above to connect any supported wallet</li>
            <li><strong>Run Tests:</strong> Click "Run Tests" to verify your connection and blockchain functionality</li>
            <li><strong>Check Results:</strong> Review the test results to identify any issues</li>
            <li><strong>Verify Network:</strong> Ensure your wallet is connected to Polygon network (Chain ID: 137)</li>
            <li><strong>Check Balance:</strong> Make sure you have some MATIC for gas fees</li>
          </ol>
          
          <div className="mt-4 p-3 bg-blue-100 rounded border border-blue-300">
            <p className="text-sm text-blue-800">
              <strong>Supported Wallets:</strong> MetaMask, WalletConnect, Coinbase Wallet, Rainbow, Trust Wallet, 
              Phantom, Brave Wallet, Opera Wallet, and many more!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletTest;
