import React, { useState, useRef, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { VisionService } from '../services/visionService';
import { SessionService } from '../services/sessionService';
import { useBlockchainService } from '../services/blockchainService';
import { Camera, Users, Clock, CheckCircle, XCircle, AlertCircle, Play, Square, Eye } from 'lucide-react';
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
  const [blockchainStats, setBlockchainStats] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Use Thirdweb blockchain service
  const { contract, getStats, isConnected } = useBlockchainService();

  // Load students and sessions
  useEffect(() => {
    loadStudents();
    loadSessions();
    loadBlockchainStats();
  }, [contract]);

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
      const sessionsData = await SessionService.getActiveSessions();
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

  const loadBlockchainStats = async () => {
    try {
      if (isConnected && contract) {
        const stats = await getStats();
        setBlockchainStats(stats);
      } else {
        setBlockchainStats({
          totalRecords: 0,
          lastBlockNumber: 0,
          contractAddress: null,
          isConnected: false
        });
      }
    } catch (error) {
      console.error('Error loading blockchain stats:', error);
      setBlockchainStats({
        totalRecords: 0,
        lastBlockNumber: 0,
        contractAddress: null,
        isConnected: false
      });
    }
  };

  // Camera functionality
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        } 
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCapturing(true);
      setRecognitionResult(null);
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Unable to access camera');
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
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      
      canvasRef.current.toBlob((blob) => {
        setCapturedImage(blob);
        setCapturedImage(URL.createObjectURL(blob));
      }, 'image/jpeg', 0.8);
      
      stopCamera();
    }
  };

  // Face recognition using Google Cloud Vision API
  const processFaceRecognition = async () => {
    if (!capturedImage || !selectedSession) {
      toast.error('Please capture an image and select a session');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Try Google Cloud Vision API first
      let faceAnalysis;
      try {
        faceAnalysis = await VisionService.analyzeFace(capturedImage);
        console.log('Face analysis result:', faceAnalysis);
      } catch (visionError) {
        console.log('Vision API failed, using mock:', visionError);
        // Fallback to mock recognition
        faceAnalysis = await VisionService.mockFaceRecognition(capturedImage);
      }

      // Show manual student selection for attendance
      setShowManualEntry(true);
      
    } catch (error) {
      console.error('Face recognition error:', error);
      toast.error('Face recognition failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Mark attendance for selected student
  const markAttendance = async (student, status = 'present') => {
    if (!selectedSession) {
      toast.error('Please select a session first');
      return;
    }

    try {
      // Mark attendance using SessionService with blockchain contract
      const result = await SessionService.markAttendance(
        selectedSession.id,
        student.id,
        status,
        capturedImage,
        contract // Pass the blockchain contract
      );

      // Update blockchain stats
      loadBlockchainStats();
      
      setRecognitionResult({
        student: student,
        status: status,
        timestamp: new Date(),
        blockchainResult: result.blockchainResult
      });
      
      setShowManualEntry(false);
      setCapturedImage(null);
      
      if (result.blockchainResult) {
        toast.success(`Attendance marked for ${student.fullName} (Blockchain: ${result.blockchainResult.transactionHash.substring(0, 10)}...)`);
      } else {
        toast.success(`Attendance marked for ${student.fullName} (Firebase only)`);
      }
      
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('Failed to mark attendance');
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
        return 'bg-yellow-100 text-yellow-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary">AI Face Recognition Attendance</h1>
          <p className="text-text-secondary mt-2">
            Use Google Cloud Vision API and Thirdweb blockchain for secure attendance tracking
          </p>
        </div>

        {/* Session Selection */}
        <div className="bg-bg-secondary rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Select Session</h2>
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-text-tertiary mx-auto mb-2" />
              <p className="text-text-secondary">No active sessions found</p>
              <p className="text-text-tertiary text-sm">Create a session first to start marking attendance</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedSession?.id === session.id
                      ? 'border-accent-primary bg-accent-primary/10'
                      : 'border-border hover:border-accent-primary/50'
                  }`}
                  onClick={() => setSelectedSession(session)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-text-primary">{session.name}</h3>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(session.status)}`}>
                      {getStatusIcon(session.status)}
                      <span className="ml-1 capitalize">{session.status}</span>
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary mb-2">{session.course}</p>
                  <div className="flex items-center justify-between text-xs text-text-tertiary">
                    <span>Students: {session.totalStudents}</span>
                    <span>Present: {session.presentCount}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Blockchain Stats */}
        {blockchainStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-bg-secondary rounded-lg p-4 border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">Blockchain Status</p>
                  <p className={`text-2xl font-bold ${blockchainStats.isConnected ? 'text-green-600' : 'text-red-600'}`}>
                    {blockchainStats.isConnected ? 'Connected' : 'Disconnected'}
                  </p>
                </div>
                <div className={`p-2 rounded-full ${blockchainStats.isConnected ? 'bg-green-100' : 'bg-red-100'}`}>
                  {blockchainStats.isConnected ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
              </div>
            </div>

            <div className="bg-bg-secondary rounded-lg p-4 border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">Total Records</p>
                  <p className="text-2xl font-bold text-text-primary">{blockchainStats.totalRecords}</p>
                </div>
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-bg-secondary rounded-lg p-4 border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">Last Block</p>
                  <p className="text-2xl font-bold text-text-primary">{blockchainStats.lastBlockNumber}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-full">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-bg-secondary rounded-lg p-4 border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">Contract</p>
                  <p className="text-xs font-mono text-text-primary truncate">
                    {blockchainStats.contractAddress ? 
                      `${blockchainStats.contractAddress.substring(0, 6)}...${blockchainStats.contractAddress.substring(38)}` : 
                      'Not Available'
                    }
                  </p>
                </div>
                <div className="p-2 bg-purple-100 rounded-full">
                  <Eye className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Camera Section */}
          <div className="space-y-6">
            <div className="bg-bg-secondary rounded-lg p-6">
              <h2 className="text-xl font-semibold text-text-primary mb-4">Camera Capture</h2>
              
              {!selectedSession && (
                <div className="text-center py-8 text-yellow-600">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2" />
                  <p>Please select a session first</p>
                </div>
              )}
              
              {selectedSession && !isCapturing && !capturedImage && (
                <div className="text-center py-12">
                  <Camera className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
                  <p className="text-text-secondary mb-4">Ready to capture student photos</p>
                  <p className="text-sm text-accent-primary mb-4">Session: {selectedSession.name}</p>
                  <button
                    onClick={startCamera}
                    className="btn btn-primary"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Start Camera
                  </button>
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
                      className="w-full rounded-lg"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={captureImage}
                      className="btn btn-primary flex-1"
                    >
                      Capture Photo
                    </button>
                    <button
                      onClick={stopCamera}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
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
                      className="w-full rounded-lg"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={processFaceRecognition}
                      disabled={isProcessing}
                      className="btn btn-primary flex-1"
                    >
                      {isProcessing ? 'Processing...' : 'Recognize Face'}
                    </button>
                    <button
                      onClick={resetRecognition}
                      className="btn btn-secondary"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Recognition Result */}
            {recognitionResult && (
              <div className="bg-bg-secondary rounded-lg p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Recognition Result</h3>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-bg-tertiary">
                    {recognitionResult.student.photoURL ? (
                      <img
                        src={recognitionResult.student.photoURL}
                        alt={recognitionResult.student.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-tertiary">
                        <Users className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-text-primary">
                      {recognitionResult.student.fullName}
                    </p>
                    <p className="text-sm text-text-secondary">
                      Roll: {recognitionResult.student.rollNumber}
                    </p>
                    <p className="text-sm text-text-secondary">
                      Class: {recognitionResult.student.class}
                    </p>
                    {recognitionResult.blockchainResult && (
                      <p className="text-xs text-accent-primary font-mono">
                        Blockchain: {recognitionResult.blockchainResult.transactionHash.substring(0, 20)}...
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(recognitionResult.status)}`}>
                      {getStatusIcon(recognitionResult.status)}
                      <span className="ml-2 capitalize">{recognitionResult.status}</span>
                    </div>
                    <p className="text-xs text-text-tertiary mt-1">
                      {recognitionResult.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Manual Entry and Student Selection */}
          <div className="space-y-6">
            {/* Manual Student Selection */}
            {showManualEntry && (
              <div className="bg-bg-secondary rounded-lg p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Select Student</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-bg-tertiary cursor-pointer"
                      onClick={() => setSelectedStudent(student)}
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-bg-tertiary">
                        {student.photoURL ? (
                          <img
                            src={student.photoURL}
                            alt={student.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-text-tertiary">
                            <Users className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-text-primary">
                          {student.fullName}
                        </p>
                        <p className="text-sm text-text-secondary">
                          Roll: {student.rollNumber} | Class: {student.class}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {selectedStudent && (
                  <div className="mt-4 p-4 bg-accent-primary/10 rounded-lg border border-accent-primary/20">
                    <p className="text-sm text-text-secondary mb-3">
                      Mark attendance for: <span className="font-medium text-text-primary">{selectedStudent.fullName}</span>
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => markAttendance(selectedStudent, 'present')}
                        className="btn btn-success btn-sm"
                      >
                        Present
                      </button>
                      <button
                        onClick={() => markAttendance(selectedStudent, 'absent')}
                        className="btn btn-danger btn-sm"
                      >
                        Absent
                      </button>
                      <button
                        onClick={() => markAttendance(selectedStudent, 'late')}
                        className="btn btn-warning btn-sm"
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
              <div className="bg-bg-secondary rounded-lg p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Session Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-text-secondary">Session Name</p>
                    <p className="font-medium text-text-primary">{selectedSession.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Course</p>
                    <p className="font-medium text-text-primary">{selectedSession.course}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Status</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedSession.status)}`}>
                      {getStatusIcon(selectedSession.status)}
                      <span className="ml-1 capitalize">{selectedSession.status}</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-text-secondary">Total Students</p>
                      <p className="text-lg font-bold text-text-primary">{selectedSession.totalStudents}</p>
                    </div>
                    <div>
                      <p className="text-sm text-text-secondary">Present</p>
                      <p className="text-lg font-bold text-green-600">{selectedSession.presentCount}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceRecognition;
