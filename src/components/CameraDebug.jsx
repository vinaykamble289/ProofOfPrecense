import React, { useState, useEffect } from 'react';
import { Camera, AlertCircle, CheckCircle, XCircle, RefreshCw, Info } from 'lucide-react';

const CameraDebug = ({ onClose }) => {
  const [diagnostics, setDiagnostics] = useState({});
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const results = {};

    try {
      // Test 1: Browser Support
      results.browserSupport = {
        status: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
        message: 'MediaDevices API Support',
        details: navigator.mediaDevices && navigator.mediaDevices.getUserMedia 
          ? 'Supported' 
          : 'Not supported - use modern browser'
      };

      // Test 2: HTTPS Check
      results.httpsCheck = {
        status: location.protocol === 'https:' || location.hostname === 'localhost',
        message: 'HTTPS Protocol',
        details: location.protocol === 'https:' 
          ? 'Secure connection' 
          : location.hostname === 'localhost' 
            ? 'Local development (OK)' 
            : 'Requires HTTPS for camera access'
      };

      // Test 3: Camera Devices
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        results.cameraDevices = {
          status: videoDevices.length > 0,
          message: 'Camera Devices',
          details: `${videoDevices.length} camera(s) found`,
          devices: videoDevices
        };
      } catch (error) {
        results.cameraDevices = {
          status: false,
          message: 'Camera Devices',
          details: `Error: ${error.message}`
        };
      }

      // Test 4: Permissions
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        results.permissions = {
          status: true,
          message: 'Camera Permissions',
          details: 'Camera access granted'
        };
        
        // Stop the test stream
        stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        results.permissions = {
          status: false,
          message: 'Camera Permissions',
          details: `Error: ${error.name} - ${error.message}`
        };
      }

      // Test 5: Canvas Support
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      results.canvasSupport = {
        status: !!context,
        message: 'Canvas Support',
        details: context ? '2D Canvas supported' : '2D Canvas not supported'
      };

      // Test 6: Browser Info
      results.browserInfo = {
        status: 'info',
        message: 'Browser Information',
        details: `${navigator.userAgent.split(' ').slice(-2).join(' ')}`
      };

    } catch (error) {
      console.error('Diagnostic error:', error);
      results.generalError = {
        status: false,
        message: 'General Error',
        details: error.message
      };
    }

    setDiagnostics(results);
    setIsRunning(false);
  };

  const getStatusIcon = (status) => {
    if (status === 'info') return <Info className="w-5 h-5 text-blue-500" />;
    if (status === true) return <CheckCircle className="w-5 h-5 text-green-500" />;
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  const getStatusColor = (status) => {
    if (status === 'info') return 'bg-blue-50 border-blue-200 text-blue-800';
    if (status === true) return 'bg-green-50 border-green-200 text-green-800';
    return 'bg-red-50 border-red-200 text-red-800';
  };

  const getRecommendations = () => {
    const issues = [];
    
    if (!diagnostics.browserSupport?.status) {
      issues.push('Use a modern browser like Chrome, Firefox, or Safari');
    }
    
    if (!diagnostics.httpsCheck?.status) {
      issues.push('Access the page via HTTPS or localhost');
    }
    
    if (!diagnostics.cameraDevices?.status) {
      issues.push('Check if your device has a camera and it\'s not being used by another app');
    }
    
    if (!diagnostics.permissions?.status) {
      issues.push('Allow camera permissions when prompted by your browser');
    }
    
    if (!diagnostics.canvasSupport?.status) {
      issues.push('Update your browser to support HTML5 Canvas');
    }
    
    return issues;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Camera Diagnostics</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          {/* Run Diagnostics Button */}
          <div className="mb-6">
            <button
              onClick={runDiagnostics}
              disabled={isRunning}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center mx-auto"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Running Diagnostics...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Run Diagnostics
                </>
              )}
            </button>
          </div>

          {/* Diagnostic Results */}
          {Object.keys(diagnostics).length > 0 && (
            <div className="space-y-4">
              {Object.entries(diagnostics).map(([key, result]) => (
                <div
                  key={key}
                  className={`p-4 border rounded-lg ${getStatusColor(result.status)}`}
                >
                  <div className="flex items-start space-x-3">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <p className="font-medium">{result.message}</p>
                      <p className="text-sm opacity-80 mt-1">{result.details}</p>
                      
                      {/* Show camera devices if available */}
                      {result.devices && result.devices.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium mb-1">Available Cameras:</p>
                          {result.devices.map((device, index) => (
                            <div key={index} className="text-xs bg-white bg-opacity-50 p-2 rounded">
                              <p><strong>Name:</strong> {device.label || 'Unknown Camera'}</p>
                              <p><strong>ID:</strong> {device.deviceId.slice(0, 20)}...</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recommendations */}
          {Object.keys(diagnostics).length > 0 && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="text-lg font-semibold text-yellow-800 mb-3">Recommendations</h3>
              <ul className="space-y-2">
                {getRecommendations().map((recommendation, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-yellow-600 mt-1">•</span>
                    <span className="text-sm text-yellow-800">{recommendation}</span>
                  </li>
                ))}
              </ul>
              
              {getRecommendations().length === 0 && (
                <p className="text-sm text-yellow-800">
                  All camera requirements are met! Your camera should work properly.
                </p>
              )}
            </div>
          )}

          {/* Quick Fixes */}
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Quick Fixes</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700">1. Refresh the page</p>
                <p className="text-xs text-gray-600">Sometimes a simple refresh resolves camera issues</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">2. Check browser permissions</p>
                <p className="text-xs text-gray-600">Click the camera icon in your browser's address bar</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">3. Close other apps</p>
                <p className="text-xs text-gray-600">Close video conferencing apps, photo apps, etc.</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">4. Try different browser</p>
                <p className="text-xs text-gray-600">Test with Chrome, Firefox, or Safari</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraDebug;
