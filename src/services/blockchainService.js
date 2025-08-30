// Blockchain service using Thirdweb v4 for storing attendance records
import { useContract, useContractWrite, useContractRead, useWallet, useConnect, useDisconnect } from '@thirdweb-dev/react';
import React from 'react';

export class BlockchainService {
  // Create a new attendance record
  static createAttendanceRecord(studentId, sessionId, timestamp, status, photoHash) {
    return {
      studentId,
      sessionId,
      timestamp,
      status,
      photoHash,
      recordId: this.generateRecordId(studentId, sessionId, timestamp),
      createdAt: new Date().toISOString()
    };
  }

  // Generate unique record ID
  static generateRecordId(studentId, sessionId, timestamp) {
    const data = `${studentId}-${sessionId}-${timestamp}`;
    return this.hashString(data);
  }

  // Simple hash function (use crypto-js or similar in production)
  static hashString(str) {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(16);
  }

  // Add attendance record to blockchain using Thirdweb
  static async addAttendanceRecord(record, contract) {
    try {
      if (!contract) {
        throw new Error('Smart contract not available');
      }

      // Call the smart contract to add attendance record
      const result = await contract.call('addAttendanceRecord', [
        record.studentId,
        record.sessionId,
        record.timestamp,
        record.status,
        record.photoHash
      ]);

      return {
        success: true,
        recordId: record.recordId,
        transactionHash: result.receipt.transactionHash,
        message: 'Attendance record added to blockchain successfully'
      };
    } catch (error) {
      console.error('Blockchain error:', error);
      throw new Error('Failed to add attendance record to blockchain');
    }
  }

  // Get attendance records from blockchain
  static async getAttendanceRecords(contract, sessionId = null) {
    try {
      if (!contract) {
        throw new Error('Smart contract not available');
      }

      let records = [];
      
      if (sessionId) {
        // Get records for specific session
        records = await contract.call('getAttendanceRecordsBySession', [sessionId]);
      } else {
        // Get all records
        records = await contract.call('getAllAttendanceRecords');
      }

      return records.map(record => ({
        studentId: record.studentId,
        sessionId: record.sessionId,
        timestamp: record.timestamp,
        status: record.status,
        photoHash: record.photoHash,
        blockNumber: record.blockNumber,
        transactionHash: record.transactionHash
      }));
    } catch (error) {
      console.error('Error getting blockchain records:', error);
      return [];
    }
  }

  // Get blockchain statistics
  static async getBlockchainStats(contract) {
    try {
      if (!contract) {
        return {
          totalRecords: 0,
          lastBlockNumber: 0,
          contractAddress: null,
          isConnected: false
        };
      }

      const totalRecords = await contract.call('getTotalAttendanceRecords');
      const lastBlockNumber = await contract.call('getLastBlockNumber');
      const contractAddress = await contract.getAddress();

      return {
        totalRecords: totalRecords.toNumber(),
        lastBlockNumber: lastBlockNumber.toNumber(),
        contractAddress: contractAddress,
        isConnected: true
      };
    } catch (error) {
      console.error('Error getting blockchain stats:', error);
      return {
        totalRecords: 0,
        lastBlockNumber: 0,
        contractAddress: null,
        isConnected: false
      };
    }
  }

  // Verify record on blockchain
  static async verifyRecord(contract, studentId, sessionId, timestamp) {
    try {
      if (!contract) {
        throw new Error('Smart contract not available');
      }

      const record = await contract.call('getAttendanceRecord', [
        studentId,
        sessionId,
        timestamp
      ]);

      return {
        exists: record.exists,
        data: record.exists ? {
          studentId: record.data.studentId,
          sessionId: record.data.sessionId,
          timestamp: record.data.timestamp,
          status: record.data.status,
          photoHash: record.data.photoHash
        } : null
      };
    } catch (error) {
      console.error('Error verifying record:', error);
      return { exists: false, data: null };
    }
  }
}

// Hook for using the blockchain service with Thirdweb v4
export const useBlockchainService = () => {
  // Get contract address from environment variable
  const contractAddress = import.meta.env.VITE_SMART_CONTRACT_ADDRESS || "0xA83a2fb6F87f6f18D6AFfE9763c1E278c324aC9B";
  
  // Use Thirdweb v4 hooks with proper error handling
  const wallet = useWallet();
  const connect = useConnect();
  const disconnect = useDisconnect();
  const { contract, isLoading: contractLoading } = useContract(contractAddress);

  // Safely destructure with fallbacks
  const { address, isConnecting, isConnected } = wallet || {};
  const { connectors } = connect || {};

  // Auto-connect to wallet when component mounts
  React.useEffect(() => {
    if (isConnected && !contractLoading && contract) {
      console.log('✅ Blockchain connected successfully');
    }
  }, [isConnected, contractLoading, contract]);

  // Check if wallet is connected (any wallet is fine)
  const isWalletConnected = !!isConnected && !!address;

  const addRecord = async (record) => {
    if (!isWalletConnected) {
      throw new Error('Please connect a wallet first');
    }
    if (!contract) {
      throw new Error('Smart contract not available. Please check your connection.');
    }
    return await BlockchainService.addAttendanceRecord(record, contract);
  };

  const getRecords = async (sessionId) => {
    if (!contract) {
      throw new Error('Smart contract not available');
    }
    return await BlockchainService.getAttendanceRecords(contract, sessionId);
  };

  const getStats = async () => {
    if (!contract) {
      return {
        totalRecords: 0,
        lastBlockNumber: 0,
        contractAddress: null,
        isConnected: false
      };
    }
    return await BlockchainService.getBlockchainStats(contract);
  };

  const verifyRecord = async (studentId, sessionId, timestamp) => {
    if (!contract) {
      throw new Error('Smart contract not available');
    }
    return await BlockchainService.verifyRecord(contract, studentId, sessionId, timestamp);
  };

  // Connect to specific wallet
  const connectToWallet = async (connector) => {
    if (connectors && connectors.length > 0 && connector) {
      try {
        await connect(connector);
        console.log('🔗 Connecting to wallet...');
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        throw new Error('Failed to connect wallet. Please check if the wallet is installed and unlocked.');
      }
    } else {
      throw new Error('Wallet connection not available. Please check Thirdweb configuration.');
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    if (disconnect) {
      disconnect();
    }
  };

  return {
    contract,
    address: address || null,
    isConnected: !!isConnected,
    isConnecting: !!isConnecting,
    isWalletConnected: !!isWalletConnected,
    isLoading: contractLoading,
    addRecord,
    getRecords,
    getStats,
    verifyRecord,
    connectToWallet,
    disconnectWallet,
    contractAddress: contractAddress !== "YOUR_CONTRACT_ADDRESS" ? contractAddress : null,
    isThirdwebAvailable: true,
    connectors: connectors || []
  };
};
