import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, where, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Users, Clock, CheckCircle, XCircle, TrendingUp, Calendar, BarChart3, Activity, Camera } from 'lucide-react';
import WalletConnection from '../components/WalletConnection';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    attendanceRate: 0
  });
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('today');

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load students count
      const studentsRef = collection(db, 'students');
      const studentsSnapshot = await getDocs(studentsRef);
      const totalStudents = studentsSnapshot.size;

      // Load attendance data
      const attendanceRef = collection(db, 'attendance');
      let attendanceQuery;
      
      if (selectedPeriod === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        attendanceQuery = query(
          attendanceRef,
          where('timestamp', '>=', today.toISOString()),
          orderBy('timestamp', 'desc')
        );
      } else if (selectedPeriod === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        attendanceQuery = query(
          attendanceRef,
          where('timestamp', '>=', weekAgo.toISOString()),
          orderBy('timestamp', 'desc')
        );
      } else {
        attendanceQuery = query(attendanceRef, orderBy('timestamp', 'desc'), limit(100));
      }

      const attendanceSnapshot = await getDocs(attendanceQuery);
      
      let presentCount = 0;
      let absentCount = 0;
      const attendanceData = [];
      
      attendanceSnapshot.forEach((doc) => {
        const data = doc.data();
        attendanceData.push({ id: doc.id, ...data });
        
        if (data.status === 'present') {
          presentCount++;
        } else if (data.status === 'absent') {
          absentCount++;
        }
      });

      const attendanceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

      setStats({
        totalStudents,
        presentToday: presentCount,
        absentToday: absentCount,
        attendanceRate
      });

      setRecentAttendance(attendanceData.slice(0, 10));
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'absent':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'late':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <Activity className="w-5 h-5 text-gray-500" />;
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

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
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
          <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-text-secondary mt-2">
            Overview of attendance system and student statistics
          </p>
        </div>

        {/* Period Selector */}
        <div className="mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedPeriod('today')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedPeriod === 'today'
                  ? 'bg-accent-primary text-white'
                  : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setSelectedPeriod('week')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedPeriod === 'week'
                  ? 'bg-accent-primary text-white'
                  : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setSelectedPeriod('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedPeriod === 'all'
                  ? 'bg-accent-primary text-white'
                  : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
              }`}
            >
              All Time
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-bg-secondary rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm font-medium">Total Students</p>
                <p className="text-3xl font-bold text-text-primary">{stats.totalStudents}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-bg-secondary rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm font-medium">Present Today</p>
                <p className="text-3xl font-bold text-green-600">{stats.presentToday}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-bg-secondary rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm font-medium">Absent Today</p>
                <p className="text-3xl font-bold text-red-600">{stats.absentToday}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-bg-secondary rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm font-medium">Attendance Rate</p>
                <p className="text-3xl font-bold text-accent-primary">{stats.attendanceRate}%</p>
              </div>
              <div className="p-3 bg-accent-primary/10 rounded-full">
                <TrendingUp className="w-6 h-6 text-accent-primary" />
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Connection Status */}
        <div className="mt-8">
          <WalletConnection />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Attendance */}
          <div className="bg-bg-secondary rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-text-primary">Recent Attendance</h2>
              <Calendar className="w-5 h-5 text-text-tertiary" />
            </div>
            
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recentAttendance.length > 0 ? (
                recentAttendance.map((record, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-bg-tertiary">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-bg-tertiary">
                      {record.studentPhoto ? (
                        <img
                          src={record.studentPhoto}
                          alt={record.studentName}
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
                        {record.studentName}
                      </p>
                      <p className="text-sm text-text-secondary">
                        {formatDate(record.timestamp)} • {new Date(record.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(record.status)}`}>
                      {getStatusIcon(record.status)}
                      <span className="ml-1 capitalize">{record.status}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-text-tertiary">
                  <Clock className="w-8 h-8 mx-auto mb-2" />
                  <p>No attendance records for {selectedPeriod === 'today' ? 'today' : selectedPeriod === 'week' ? 'this week' : 'this period'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-bg-secondary rounded-lg p-6 border border-border">
            <h2 className="text-xl font-semibold text-text-primary mb-6">Quick Actions</h2>
            
            <div className="grid grid-cols-1 gap-4">
              <button className="flex items-center p-4 bg-accent-primary/10 border border-accent-primary/20 rounded-lg hover:bg-accent-primary/20 transition-colors">
                <div className="p-2 bg-accent-primary rounded-lg mr-4">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-text-primary">Start Face Recognition</p>
                  <p className="text-sm text-text-secondary">Begin attendance session</p>
                </div>
              </button>

              <button className="flex items-center p-4 bg-blue-100 border border-blue-200 rounded-lg hover:bg-blue-200 transition-colors">
                <div className="p-2 bg-blue-600 rounded-lg mr-4">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-text-primary">Manage Students</p>
                  <p className="text-sm text-text-secondary">Add, edit, or remove students</p>
                </div>
              </button>

              <button className="flex items-center p-4 bg-green-100 border border-green-200 rounded-lg hover:bg-green-200 transition-colors">
                <div className="p-2 bg-green-600 rounded-lg mr-4">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-text-primary">View Reports</p>
                  <p className="text-sm text-text-secondary">Generate attendance reports</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="mt-8 bg-bg-secondary rounded-lg p-6 border border-border">
          <h2 className="text-xl font-semibold text-text-primary mb-4">System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-text-primary">Firebase Connected</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-text-primary">Database Active</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-text-primary">Storage Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
