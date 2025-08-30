import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { 
  Video, 
  Mic, 
  MicOff, 
  Camera, 
  CameraOff, 
  Users, 
  Play, 
  Square,
  Settings,
  UserCheck,
  Clock
} from 'lucide-react'
import Webcam from 'react-webcam'

const TeacherDashboard = () => {
  const [isStreaming, setIsStreaming] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isAudioOn, setIsAudioOn] = useState(true)
  const [sessionId, setSessionId] = useState('')
  const [students, setStudents] = useState([])
  const [attendanceData, setAttendanceData] = useState([])
  const [isRecording, setIsRecording] = useState(false)
  const webcamRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Generate session ID
    setSessionId(`session_${Date.now()}`)
    
    // Load enrolled students
    loadEnrolledStudents()
  }, [])

  const loadEnrolledStudents = async () => {
    // Mock data - replace with actual API call
    const mockStudents = [
      { id: 1, name: 'John Doe', rollNumber: '2024001', status: 'enrolled' },
      { id: 2, name: 'Jane Smith', rollNumber: '2024002', status: 'enrolled' },
      { id: 3, name: 'Mike Johnson', rollNumber: '2024003', status: 'enrolled' },
    ]
    setStudents(mockStudents)
  }

  const startSession = async () => {
    try {
      setIsStreaming(true)
      setIsRecording(true)
      toast.success('Session started successfully!')
      
      // Start attendance tracking
      startAttendanceTracking()
    } catch (error) {
      console.error('Error starting session:', error)
      toast.error('Failed to start session')
    }
  }

  const stopSession = async () => {
    try {
      setIsStreaming(false)
      setIsRecording(false)
      toast.success('Session ended successfully!')
      
      // Process attendance and upload to blockchain
      await processAttendanceData()
      
      // Navigate to session details
      navigate(`/teacher/session/${sessionId}`)
    } catch (error) {
      console.error('Error stopping session:', error)
      toast.error('Failed to stop session')
    }
  }

  const startAttendanceTracking = () => {
    // Start face detection and voice recognition
    // This would integrate with Google Vision API and Speech-to-Text API
    console.log('Starting attendance tracking...')
  }

  const processAttendanceData = async () => {
    // Process attendance data and prepare for blockchain upload
    const attendanceRecord = {
      sessionId,
      timestamp: new Date().toISOString(),
      students: students.map(student => ({
        ...student,
        status: Math.random() > 0.2 ? 'present' : 'absent' // Mock data
      })),
      totalStudents: students.length,
      presentCount: students.filter(s => Math.random() > 0.2).length
    }
    
    setAttendanceData(attendanceRecord)
    
    // Upload to IPFS and blockchain
    await uploadToBlockchain(attendanceRecord)
  }

  const uploadToBlockchain = async (data) => {
    try {
      // This would integrate with web3.storage and Thirdweb
      console.log('Uploading to blockchain:', data)
      toast.success('Attendance data uploaded to blockchain!')
    } catch (error) {
      console.error('Blockchain upload error:', error)
      toast.error('Failed to upload to blockchain')
    }
  }

  const toggleVideo = () => {
    setIsVideoOn(!isVideoOn)
  }

  const toggleAudio = () => {
    setIsAudioOn(!isAudioOn)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
          <p className="text-gray-600">Manage your live class and track attendance</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500">Session ID: {sessionId}</span>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-500">
              {isStreaming ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Stream */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Live Stream</h3>
              <div className="flex items-center space-x-2">
                {isStreaming && (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-red-600 font-medium">LIVE</span>
                  </div>
                )}
              </div>
            </div>

            <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
              {isVideoOn ? (
                <Webcam
                  ref={webcamRef}
                  audio={isAudioOn}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                  <CameraOff className="h-16 w-16 text-gray-400" />
                </div>
              )}

              {/* Stream Controls Overlay */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-2 bg-black bg-opacity-50 rounded-full px-4 py-2">
                <button
                  onClick={toggleVideo}
                  className={`p-2 rounded-full ${isVideoOn ? 'bg-white text-black' : 'bg-gray-600 text-white'}`}
                >
                  {isVideoOn ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
                </button>
                
                <button
                  onClick={toggleAudio}
                  className={`p-2 rounded-full ${isAudioOn ? 'bg-white text-black' : 'bg-gray-600 text-white'}`}
                >
                  {isAudioOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </button>

                {!isStreaming ? (
                  <button
                    onClick={startSession}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full flex items-center space-x-2"
                  >
                    <Play className="h-4 w-4" />
                    <span>Start Session</span>
                  </button>
                ) : (
                  <button
                    onClick={stopSession}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full flex items-center space-x-2"
                  >
                    <Square className="h-4 w-4" />
                    <span>End Session</span>
                  </button>
                )}
              </div>
            </div>

            {/* Session Info */}
            {isStreaming && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-green-800">Session Active</h4>
                    <p className="text-sm text-green-600">
                      Recording attendance and streaming live
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-green-600">Students Present</p>
                    <p className="text-lg font-bold text-green-800">
                      {attendanceData.presentCount || 0} / {students.length}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Student List */}
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Enrolled Students</h3>
              <span className="text-sm text-gray-500">{students.length} students</span>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {students.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-600">
                        {student.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{student.name}</p>
                      <p className="text-xs text-gray-500">Roll: {student.rollNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isStreaming ? (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-green-600">Present</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Not started</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/teacher/enrollment')}
                className="w-full btn-secondary flex items-center justify-center space-x-2"
              >
                <Users className="h-4 w-4" />
                <span>Manage Students</span>
              </button>
              
              <button
                onClick={() => navigate('/teacher/history')}
                className="w-full btn-secondary flex items-center justify-center space-x-2"
              >
                <UserCheck className="h-4 w-4" />
                <span>View History</span>
              </button>
              
              <button className="w-full btn-secondary flex items-center justify-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TeacherDashboard
