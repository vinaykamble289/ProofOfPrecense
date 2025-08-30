import React, { useState, useRef, useEffect } from 'react';
import { collection, getDocs, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { VisionService } from '../services/visionService';
import { Camera, Users, Clock, CheckCircle, XCircle, AlertCircle, Plus, Minus, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

const FaceRecognition = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState(null);
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [sessionStudents, setSessionStudents] = useState([]);
  const [cameraDevices, setCameraDevices] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [isCameraInitializing, setIsCameraInitializing] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Load students and sessions
  useEffect(() => {
    loadStudents();
    loadSessions();
  }, []);

  // Load attendance records when session changes
  useEffect(() => {
    if (selectedSession) {
      loadAttendanceRecords();
      loadSessionStudents();
    }
  }, [selectedSession]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const loadStudents = async () => {
    try {
      const studentsRef = collection(db, 'students');
      const q = query(studentsRef, orderBy('fullName'));
      const querySnapshot = await getDocs(q);
      
      const studentsData = [];
      querySnapshot.forEach((doc) => {
        studentsData.push({ id: doc.id, ...doc.data() });
      });
      
      setStudents(studentsData);
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error('Failed to load students');
    }
  };

  const loadSessions = async () => {
    try {
      const sessionsRef = collection(db, 'sessions');
      const q = query(sessionsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const sessionsData = [];
      querySnapshot.forEach((doc) => {
        sessionsData.push({ id: doc.id, ...doc.data() });
      });
      
      setSessions(sessionsData);
      if (sessionsData.length > 0) {
        setSelectedSession(sessionsData[0]);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceRecords = async () => {
    if (!selectedSession) return;
    
    try {
      const attendanceRef = collection(db, 'attendance');
      const q = query(attendanceRef, orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const records = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.sessionId === selectedSession.id) {
          records.push({ id: doc.id, ...data });
        }
      });
      
      setAttendanceRecords(records);
    } catch (error) {
      console.error('Error loading attendance records:', error);
    }
  };

  const loadSessionStudents = async () => {
    if (!selectedSession) return;
    
    try {
      const sessionStudentsRef = collection(db, 'sessionStudents');
      const q = query(sessionStudentsRef, orderBy('fullName'));
      const querySnapshot = await getDocs(q);
      
      const sessionStudentsData = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.sessionId === selectedSession.id) {
          sessionStudentsData.push({ id: doc.id, ...data });
        }
      });
      
      setSessionStudents(sessionStudentsData);
    } catch (error) {
      console.error('Error loading session students:', error);
    }
  };

  // Camera functionality
  const startCamera = async () => {
    if (!selectedCamera) {
      toast.error('Please select a camera device.');
      return;
    }

    setIsCameraInitializing(true);
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser');
      }

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
          setRecognitionResult(null);
        };
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      let errorMessage = 'Unable to access camera';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is already in use by another application.';
      }
      
      toast.error(errorMessage);
      setCameraError(errorMessage);
    } finally {
      setIsCameraInitializing(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCapturing(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      try {
        const context = canvasRef.current.getContext('2d');
        const video = videoRef.current;
        
        canvasRef.current.width = video.videoWidth;
        canvasRef.current.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        canvasRef.current.toBlob((blob) => {
          if (blob) {
            const imageUrl = URL.createObjectURL(blob);
            setCapturedImage(imageUrl);
          } else {
            toast.error('Failed to capture image');
          }
        }, 'image/jpeg', 0.9);
        
        stopCamera();
      } catch (error) {
        console.error('Error capturing image:', error);
        toast.error('Failed to capture image');
      }
    }
  };

  // Face recognition
  const processFaceRecognition = async () => {
    if (!capturedImage || !selectedSession) {
      toast.error('Please capture an image and select a session');
      return;
    }

    setIsProcessing(true);
    
    try {
      const response = await fetch(capturedImage);
      const imageBlob = await response.blob();
      
      let faceAnalysis;
      try {
        faceAnalysis = await VisionService.analyzeFace(imageBlob);
      } catch (visionError) {
        faceAnalysis = await VisionService.mockFaceRecognition(imageBlob);
      }

      setShowManualEntry(true);
      
    } catch (error) {
      console.error('Face recognition error:', error);
      toast.error('Face recognition failed: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Mark attendance
  const markAttendance = async (student, status = 'present') => {
    if (!selectedSession) {
      toast.error('Please select a session first');
      return;
    }

    try {
      const attendanceData = {
        sessionId: selectedSession.id,
        sessionName: selectedSession.name,
        studentId: student.id,
        studentName: student.fullName,
        studentRoll: student.rollNumber,
        status: status,
        timestamp: serverTimestamp(),
        photoURL: capturedImage,
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'attendance'), attendanceData);
      
      const newRecord = { id: docRef.id, ...attendanceData };
      setAttendanceRecords(prev => [newRecord, ...prev]);
      
      setRecognitionResult({
        student: student,
        status: status,
        timestamp: new Date(),
        recordId: docRef.id
      });
      
      setShowManualEntry(false);
      setCapturedImage(null);
      
      toast.success(`Attendance marked for ${student.fullName} as ${status}`);
      
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('Failed to mark attendance: ' + error.message);
    }
  };

  // Add/Remove students from session
  const toggleStudentInSession = async (student) => {
    if (!selectedSession) return;
    
    try {
      const isInSession = sessionStudents.some(s => s.id === student.id);
      
      if (isInSession) {
        setSessionStudents(prev => prev.filter(s => s.id !== student.id));
        toast.success(`${student.fullName} removed from session`);
      } else {
        const sessionStudentData = {
          sessionId: selectedSession.id,
          sessionName: selectedSession.name,
          studentId: student.id,
          fullName: student.fullName,
          rollNumber: student.rollNumber,
          class: student.class,
          addedAt: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, 'sessionStudents'), sessionStudentData);
        const newSessionStudent = { id: docRef.id, ...sessionStudentData };
        setSessionStudents(prev => [...prev, newSessionStudent]);
        toast.success(`${student.fullName} added to session`);
      }
    } catch (error) {
      console.error('Error toggling student in session:', error);
      toast.error('Failed to update session students');
    }
  };

  const resetRecognition = () => {
    setCapturedImage(null);
    setRecognitionResult(null);
    setSelectedStudent(null);
    setShowManualEntry(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'absent':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'late':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'absent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'late':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCameraDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setCameraDevices(videoDevices);
      if (videoDevices.length > 0) {
        setSelectedCamera(videoDevices[0].deviceId);
      }
    } catch (error) {
      console.error('Error enumerating cameras:', error);
      setCameraError('Failed to enumerate cameras: ' + error.message);
    }
  };

  const switchCamera = async (deviceId) => {
    setSelectedCamera(deviceId);
    setCameraError(null);
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: deviceId },
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
          setRecognitionResult(null);
        };
      }
    } catch (error) {
      console.error('Error switching camera:', error);
      setCameraError('Failed to switch camera: ' + error.message);
    }
  };

  const retryCamera = () => {
    setCameraError(null);
    getCameraDevices();
  };

  useEffect(() => {
    getCameraDevices();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AI Face Recognition Attendance</h1>
          <p className="text-gray-600 mt-2">
            Use camera and face recognition to mark student attendance
          </p>
        </div>

        {/* Session Selection */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Session</h2>
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-yellow-600">
              <Clock className="w-12 h-12 mx-auto mb-2" />
              <p>No sessions found</p>
              <p className="text-sm text-gray-500">Create a session first to start marking attendance</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedSession?.id === session.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => setSelectedSession(session)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{session.name}</h3>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(session.status || 'active')}`}>
                      {getStatusIcon(session.status || 'active')}
                      <span className="ml-1 capitalize">{session.status || 'active'}</span>
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{session.course || 'General'}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Students: {sessionStudents.length}</span>
                    <span>Present: {attendanceRecords.filter(r => r.status === 'present').length}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Camera Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Camera Capture</h2>
              
              {!selectedSession && (
                <div className="text-center py-8 text-yellow-600">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2" />
                  <p>Please select a session first</p>
                </div>
              )}
              
              {selectedSession && !isCapturing && !capturedImage && (
                <div className="text-center py-12">
                  <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Ready to capture student photos</p>
                  <p className="text-sm text-blue-600 mb-4">Session: {selectedSession.name}</p>
                  
                  {/* Camera Selection */}
                  {cameraDevices.length > 0 && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-2">Select Camera:</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {cameraDevices.map((device) => (
                          <button
                            key={device.deviceId}
                            onClick={() => switchCamera(device.deviceId)}
                            className={`px-3 py-1 rounded text-sm transition-colors ${
                              selectedCamera === device.deviceId
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {device.label || `Camera ${device.deviceId.slice(0, 8)}...`}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={startCamera}
                    disabled={isCameraInitializing || !selectedCamera}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCameraInitializing ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Camera className="w-5 h-5 mr-2" />
                    )}
                    {isCameraInitializing ? 'Initializing...' : 'Start Camera'}
                  </button>
                  
                  {/* Camera Error Display */}
                  {cameraError && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="text-left">
                          <p className="text-sm text-red-800 font-medium">Camera Error</p>
                          <p className="text-sm text-red-700 mt-1">{cameraError}</p>
                          <button 
                            onClick={retryCamera}
                            className="mt-2 text-sm text-red-600 underline hover:text-red-800"
                          >
                            Retry Camera Check
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Camera Troubleshooting */}
                  {cameraError && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">Troubleshooting Tips:</h4>
                      <ul className="text-xs text-blue-700 space-y-1">
                        <li>• Make sure you're using HTTPS (required for camera access)</li>
                        <li>• Allow camera permissions when prompted by your browser</li>
                        <li>• Close other applications that might be using the camera</li>
                        <li>• Try refreshing the page if camera doesn't start</li>
                        <li>• Check if your device has a working camera</li>
                        <li>• Try using a different browser (Chrome, Firefox, Safari)</li>
                      </ul>
                    </div>
                  )}
                  
                  {/* Camera Status */}
                  <div className="mt-4 text-xs text-gray-500">
                    <p>Camera Status: {selectedCamera ? 'Ready' : 'Not Available'}</p>
                    <p>Devices Found: {cameraDevices.length}</p>
                    <p>Protocol: {location.protocol}</p>
                  </div>
                </div>
              )}

              {/* Camera View */}
              {isCapturing && (
                <div className="space-y-4">
                  <div className="relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full rounded-lg border-2 border-blue-300"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    
                    {/* Camera Controls Overlay */}
                    <div className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-lg p-2">
                      <button
                        onClick={stopCamera}
                        className="p-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        title="Stop Camera"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={captureImage}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex-1 flex items-center justify-center"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Capture Photo
                    </button>
                    <button
                      onClick={stopCamera}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                  
                  <div className="text-center text-sm text-gray-600">
                    <p>Position the student's face in the center of the frame</p>
                    <p>Ensure good lighting for better photo quality</p>
                  </div>
                </div>
              )}

              {/* Captured Image */}
              {capturedImage && (
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={capturedImage}
                      alt="Captured"
                      className="w-full rounded-lg border-2 border-green-300"
                    />
                    <div className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-lg p-2">
                      <button
                        onClick={resetRecognition}
                        className="p-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                        title="Reset"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={processFaceRecognition}
                      disabled={isProcessing}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-1 disabled:opacity-50 flex items-center justify-center"
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-2" />
                          Recognize Face
                        </>
                      )}
                    </button>
                    <button
                      onClick={resetRecognition}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Recognition Result */}
            {recognitionResult && (
              <div className="bg-white rounded-lg p-6 shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recognition Result</h3>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200">
                    {recognitionResult.student.photoURL ? (
                      <img
                        src={recognitionResult.student.photoURL}
                        alt={recognitionResult.student.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <Users className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {recognitionResult.student.fullName}
                    </p>
                    <p className="text-sm text-gray-600">
                      Roll: {recognitionResult.student.rollNumber}
                    </p>
                    <p className="text-sm text-gray-600">
                      Class: {recognitionResult.student.class}
                    </p>
                    <p className="text-xs text-blue-600 font-mono">
                      Record ID: {recognitionResult.recordId}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(recognitionResult.status)}`}>
                      {getStatusIcon(recognitionResult.status)}
                      <span className="ml-2 capitalize">{recognitionResult.status}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {recognitionResult.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Student Management and Attendance */}
          <div className="space-y-6">
            {/* Session Students Management */}
            {selectedSession && (
              <div className="bg-white rounded-lg p-6 shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Session Students</h3>
                  <span className="text-sm text-gray-500">{sessionStudents.length} students</span>
                </div>
                
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {students.map((student) => {
                    const isInSession = sessionStudents.some(s => s.id === student.id);
                    return (
                      <div
                        key={student.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                            {student.photoURL ? (
                              <img
                                src={student.photoURL}
                                alt={student.fullName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-500">
                                <Users className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {student.fullName}
                            </p>
                            <p className="text-sm text-gray-600">
                              Roll: {student.rollNumber} | Class: {student.class}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleStudentInSession(student)}
                          className={`p-2 rounded-full transition-colors ${
                            isInSession 
                              ? 'text-red-600 hover:bg-red-100' 
                              : 'text-green-600 hover:bg-green-100'
                          }`}
                          title={isInSession ? 'Remove from session' : 'Add to session'}
                        >
                          {isInSession ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Manual Attendance Marking */}
            {selectedSession && sessionStudents.length > 0 && (
              <div className="bg-white rounded-lg p-6 shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Manual Attendance Marking</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Mark attendance manually without using the camera
                </p>
                
                {/* Bulk Actions */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Quick Actions</span>
                    <span className="text-xs text-gray-500">
                      {attendanceRecords.filter(r => r.status === 'present').length} / {sessionStudents.length} marked
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const unmarkedStudents = sessionStudents.filter(student => 
                          !attendanceRecords.find(r => 
                            r.studentId === student.id && 
                            r.sessionId === selectedSession.id
                          )
                        );
                        if (unmarkedStudents.length === 0) {
                          toast.info('All students already marked!');
                          return;
                        }
                        if (confirm(`Mark ${unmarkedStudents.length} unmarked students as present?`)) {
                          unmarkedStudents.forEach(student => markAttendance(student, 'present'));
                        }
                      }}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                      title="Mark all unmarked students as present"
                    >
                      Mark All Present
                    </button>
                    <button
                      onClick={() => {
                        const markedStudents = sessionStudents.filter(student => 
                          attendanceRecords.find(r => 
                            r.studentId === student.id && 
                            r.sessionId === selectedSession.id
                          )
                        );
                        if (markedStudents.length === 0) {
                          toast.info('No students marked yet!');
                          return;
                        }
                        if (confirm(`Clear attendance for ${markedStudents.length} students?`)) {
                          // Note: This would require implementing a delete function
                          toast.info('Attendance clearing feature coming soon!');
                        }
                      }}
                      className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
                      title="Clear all attendance records"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {sessionStudents.map((student) => {
                    const existingRecord = attendanceRecords.find(r => 
                      r.studentId === student.id && 
                      r.sessionId === selectedSession.id
                    );
                    
                    return (
                      <div
                        key={student.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                            {student.photoURL ? (
                              <img
                                src={student.photoURL}
                                alt={student.fullName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-500">
                                <Users className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {student.fullName}
                            </p>
                            <p className="text-sm text-gray-600">
                              Roll: {student.rollNumber} | Class: {student.class}
                            </p>
                            {existingRecord && (
                              <p className="text-xs text-gray-500 mt-1">
                                Already marked as: <span className="capitalize">{existingRecord.status}</span>
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {!existingRecord ? (
                            <>
                              <button
                                onClick={() => markAttendance(student, 'present')}
                                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                                title="Mark as Present"
                              >
                                Present
                              </button>
                              <button
                                onClick={() => markAttendance(student, 'absent')}
                                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                                title="Mark as Absent"
                              >
                                Absent
                              </button>
                              <button
                                onClick={() => markAttendance(student, 'late')}
                                className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 transition-colors"
                                title="Mark as Late"
                              >
                                Late
                              </button>
                            </>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(existingRecord.status)}`}>
                                {getStatusIcon(existingRecord.status)}
                                <span className="ml-1 capitalize">{existingRecord.status}</span>
                              </span>
                              <button
                                onClick={() => markAttendance(student, 'present')}
                                className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                                title="Change to Present"
                              >
                                Change
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Manual Student Selection for Camera */}
            {showManualEntry && (
              <div className="bg-white rounded-lg p-6 shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Student for Camera Recognition</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {sessionStudents.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedStudent(student)}
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                        {student.photoURL ? (
                          <img
                            src={student.photoURL}
                            alt={student.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500">
                            <Users className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {student.fullName}
                        </p>
                        <p className="text-sm text-gray-600">
                          Roll: {student.rollNumber} | Class: {student.class}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {selectedStudent && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800 mb-3">
                      Mark attendance for: <span className="font-medium text-blue-900">{selectedStudent.fullName}</span>
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => markAttendance(selectedStudent, 'present')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        Present
                      </button>
                      <button
                        onClick={() => markAttendance(selectedStudent, 'absent')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        Absent
                      </button>
                      <button
                        onClick={() => markAttendance(selectedStudent, 'late')}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                      >
                        Late
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Session Info */}
            {selectedSession && (
              <div className="bg-white rounded-lg p-6 shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Session Name</p>
                    <p className="font-medium text-gray-900">{selectedSession.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Course</p>
                    <p className="font-medium text-gray-900">{selectedSession.course || 'General'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedSession.status || 'active')}`}>
                      {getStatusIcon(selectedSession.status || 'active')}
                      <span className="ml-1 capitalize">{selectedSession.status || 'active'}</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Students</p>
                      <p className="text-lg font-bold text-gray-900">{sessionStudents.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Present Today</p>
                      <p className="text-lg font-bold text-green-600">{attendanceRecords.filter(r => r.status === 'present').length}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Attendance Records */}
        {selectedSession && attendanceRecords.length > 0 && (
          <div className="mt-8 bg-white rounded-lg p-6 shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Today's Attendance Records</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photo</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendanceRecords.map((record) => (
                    <tr key={record.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 mr-3">
                            {record.photoURL ? (
                              <img
                                src={record.photoURL}
                                alt={record.studentName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-500">
                                <Users className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{record.studentName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.studentRoll}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(record.status)}`}>
                          {getStatusIcon(record.status)}
                          <span className="ml-1 capitalize">{record.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.timestamp ? new Date(record.timestamp.toDate()).toLocaleTimeString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.photoURL && (
                          <img
                            src={record.photoURL}
                            alt="Attendance Photo"
                            className="w-12 h-12 rounded object-cover"
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FaceRecognition;
