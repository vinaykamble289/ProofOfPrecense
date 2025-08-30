import React, { useState, useRef, useEffect } from 'react';
import { Camera, Square, Play } from 'lucide-react';

const CameraTest = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [error, setError] = useState(null);
  const [cameraInfo, setCameraInfo] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Check camera availability
  useEffect(() => {
    const checkCameraAvailability = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setError('Camera API not supported in this browser');
          return;
        }

        // Get available devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        setCameraInfo({
          totalDevices: videoDevices.length,
          devices: videoDevices.map(device => ({
            label: device.label || `Camera ${device.deviceId.slice(0, 8)}...`,
            deviceId: device.deviceId
          }))
        });

        console.log('Available video devices:', videoDevices);
      } catch (err) {
        console.error('Error checking camera availability:', err);
        setError('Failed to check camera availability');
      }
    };

    checkCameraAvailability();
  }, []);

  const startCamera = async () => {
    try {
      setError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          facingMode: 'user'
        },
        audio: false
      });
      
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setIsCapturing(true);
          console.log('Camera started successfully');
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      let errorMessage = 'Unable to access camera';
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Camera is already in use by another application.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = 'Camera constraints not supported.';
      }
      
      setError(errorMessage);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => {
        track.stop();
        console.log('Camera track stopped:', track.kind);
      });
      setCameraStream(null);
    }
    setIsCapturing(false);
  };

  const testCapture = () => {
    if (videoRef.current && canvasRef.current) {
      try {
        const context = canvasRef.current.getContext('2d');
        const video = videoRef.current;
        
        canvasRef.current.width = video.videoWidth;
        canvasRef.current.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        canvasRef.current.toBlob((blob) => {
          if (blob) {
            console.log('Test capture successful:', blob.size, 'bytes');
            alert(`Test capture successful! Image size: ${blob.size} bytes`);
          } else {
            alert('Test capture failed');
          }
        }, 'image/jpeg', 0.9);
      } catch (err) {
        console.error('Test capture error:', err);
        alert('Test capture failed: ' + err.message);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Camera Test Component</h2>
      
      {/* Camera Info */}
      {cameraInfo && (
        <div className="mb-4 p-3 bg-blue-50 rounded border">
          <h3 className="font-semibold text-blue-800">Camera Information</h3>
          <p>Total cameras: {cameraInfo.totalDevices}</p>
          {cameraInfo.devices.map((device, index) => (
            <p key={index} className="text-sm text-blue-600">
              {device.label}
            </p>
          ))}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Camera Controls */}
      <div className="mb-4 flex gap-2">
        {!isCapturing ? (
          <button
            onClick={startCamera}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            Start Camera
          </button>
        ) : (
          <>
            <button
              onClick={testCapture}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Test Capture
            </button>
            <button
              onClick={stopCamera}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-2"
            >
              <Square className="w-4 h-4" />
              Stop Camera
            </button>
          </>
        )}
      </div>

      {/* Camera View */}
      {isCapturing && (
        <div className="space-y-4">
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full rounded border"
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          <p className="text-sm text-gray-600">
            Camera is active. Use "Test Capture" to verify image capture functionality.
          </p>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-gray-50 rounded">
        <h3 className="font-semibold mb-2">Troubleshooting Tips:</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Make sure you're using HTTPS (required for camera access)</li>
          <li>• Allow camera permissions when prompted</li>
          <li>• Check if another app is using the camera</li>
          <li>• Try refreshing the page if camera doesn't start</li>
          <li>• Check browser console for detailed error messages</li>
        </ul>
      </div>
    </div>
  );
};

export default CameraTest;
