import React, { useState, useEffect } from 'react';
import { SessionService } from '../services/sessionService';
import { useBlockchainService } from '../services/blockchainService';
import { Plus, Play, Square, Clock, Users, CheckCircle, XCircle, BarChart3, Camera, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

const Sessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [blockchainStats, setBlockchainStats] = useState(null);

  const [newSession, setNewSession] = useState({
    name: '',
    description: '',
    course: '',
    instructor: '',
    maxStudents: 50
  });

  // Use Thirdweb blockchain service
  const { contract, getStats, isConnected } = useBlockchainService();

  useEffect(() => {
    loadSessions();
    loadBlockchainStats();
  }, [contract]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const sessionsData = await SessionService.getSessions();
      setSessions(sessionsData);
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

  const handleCreateSession = async (e) => {
    e.preventDefault();
    
    if (!newSession.name || !newSession.course) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await SessionService.createSession(newSession);
      toast.success('Session created successfully');
      setShowCreateModal(false);
      setNewSession({ name: '', description: '', course: '', instructor: '', maxStudents: 50 });
      loadSessions();
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to create session');
    }
  };

  const handleCloseSession = async (sessionId) => {
    if (window.confirm('Are you sure you want to close this session?')) {
      try {
        await SessionService.closeSession(sessionId);
        toast.success('Session closed successfully');
        loadSessions();
      } catch (error) {
        console.error('Error closing session:', error);
        toast.error('Failed to close session');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'closed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <Play className="w-4 h-4" />;
      case 'closed':
        return <Square className="w-4 h-4" />;
      case 'paused':
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Attendance Sessions</h1>
            <p className="text-text-secondary mt-2">Manage and monitor attendance sessions with blockchain storage</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary mt-4 sm:mt-0"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Session
          </button>
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
                  <BarChart3 className="w-5 h-5 text-blue-600" />
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

        {/* Sessions List */}
        <div className="bg-bg-secondary rounded-lg overflow-hidden">
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
              <p className="text-text-secondary text-lg">No sessions found</p>
              <p className="text-text-tertiary mt-2">Create your first attendance session to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-bg-tertiary">
                  <tr>
                    <th className="text-left p-4 text-text-primary font-medium">Session</th>
                    <th className="text-left p-4 text-text-primary font-medium">Course</th>
                    <th className="text-left p-4 text-text-primary font-medium">Students</th>
                    <th className="text-left p-4 text-text-primary font-medium">Attendance</th>
                    <th className="text-left p-4 text-text-primary font-medium">Status</th>
                    <th className="text-left p-4 text-text-primary font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sessions.map((session) => (
                    <tr key={session.id} className="hover:bg-bg-tertiary/50">
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-text-primary">{session.name}</p>
                          <p className="text-sm text-text-secondary">{session.description}</p>
                          <p className="text-xs text-text-tertiary">
                            Created: {new Date(session.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-text-primary">{session.course}</span>
                        {session.instructor && (
                          <p className="text-sm text-text-secondary">by {session.instructor}</p>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-text-tertiary" />
                          <span className="text-text-primary">
                            {session.presentCount + session.absentCount}/{session.maxStudents}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-green-600">{session.presentCount}</span>
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span className="text-red-600">{session.absentCount}</span>
                        </div>
                        {session.totalStudents > 0 && (
                          <p className="text-xs text-text-tertiary">
                            {Math.round((session.presentCount / session.totalStudents) * 100)}% rate
                          </p>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(session.status)}`}>
                          {getStatusIcon(session.status)}
                          <span className="ml-1 capitalize">{session.status}</span>
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          {session.status === 'active' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedSession(session);
                                  setShowAttendanceModal(true);
                                }}
                                className="btn btn-primary btn-sm"
                              >
                                <Camera className="w-4 h-4" />
                                Mark Attendance
                              </button>
                              <button
                                onClick={() => handleCloseSession(session.id)}
                                className="btn btn-danger btn-sm"
                              >
                                <Square className="w-4 h-4" />
                                Close
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => {
                              setSelectedSession(session);
                              // Navigate to session details
                            }}
                            className="btn btn-secondary btn-sm"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Session Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-bg-secondary rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-text-primary mb-4">Create New Session</h2>
              
              <form onSubmit={handleCreateSession} className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Session Name *</label>
                  <input
                    type="text"
                    value={newSession.name}
                    onChange={(e) => setNewSession(prev => ({ ...prev, name: e.target.value }))}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    value={newSession.description}
                    onChange={(e) => setNewSession(prev => ({ ...prev, description: e.target.value }))}
                    className="form-input"
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Course *</label>
                  <input
                    type="text"
                    value={newSession.course}
                    onChange={(e) => setNewSession(prev => ({ ...prev, course: e.target.value }))}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Instructor</label>
                  <input
                    type="text"
                    value={newSession.instructor}
                    onChange={(e) => setNewSession(prev => ({ ...prev, instructor: e.target.value }))}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Max Students</label>
                  <input
                    type="number"
                    value={newSession.maxStudents}
                    onChange={(e) => setNewSession(prev => ({ ...prev, maxStudents: parseInt(e.target.value) }))}
                    className="form-input"
                    min="1"
                    max="200"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="submit" className="btn btn-primary flex-1">
                    Create Session
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sessions;
