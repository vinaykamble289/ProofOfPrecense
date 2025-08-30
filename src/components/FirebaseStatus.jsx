import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle, CheckCircle, XCircle, Wifi, WifiOff } from 'lucide-react';

const FirebaseStatus = () => {
  const { firebaseError, checkFirebaseConnection } = useAuth();

  if (!firebaseError) {
    return (
      <div className="fixed bottom-4 right-4 bg-green-100 border border-green-300 text-green-800 px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 z-50">
        <CheckCircle className="w-5 h-5" />
        <span className="text-sm font-medium">Firebase Connected</span>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-lg shadow-lg max-w-sm z-50">
      <div className="flex items-start space-x-2">
        <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-medium text-sm mb-1">Firebase Connection Error</h4>
          <p className="text-xs mb-2">{firebaseError}</p>
          <div className="space-y-2">
            <button
              onClick={checkFirebaseConnection}
              className="text-xs bg-red-200 hover:bg-red-300 px-2 py-1 rounded transition-colors"
            >
              Retry Connection
            </button>
            <a
              href="/FIREBASE_SETUP_GUIDE.md"
              target="_blank"
              className="block text-xs text-red-600 hover:text-red-800 underline"
            >
              View Setup Guide
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirebaseStatus;
