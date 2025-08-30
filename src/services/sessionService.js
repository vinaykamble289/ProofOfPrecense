import { collection, addDoc, getDocs, updateDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { BlockchainService } from './blockchainService';

export class SessionService {
  // Create a new attendance session
  static async createSession(sessionData) {
    try {
      const session = {
        ...sessionData,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalStudents: 0,
        presentCount: 0,
        absentCount: 0
      };

      const docRef = await addDoc(collection(db, 'sessions'), session);
      
      return {
        id: docRef.id,
        ...session
      };
    } catch (error) {
      console.error('Error creating session:', error);
      throw new Error('Failed to create session');
    }
  }

  // Get all sessions
  static async getSessions() {
    try {
      const sessionsRef = collection(db, 'sessions');
      const q = query(sessionsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const sessions = [];
      querySnapshot.forEach((doc) => {
        sessions.push({ id: doc.id, ...doc.data() });
      });
      
      return sessions;
    } catch (error) {
      console.error('Error getting sessions:', error);
      throw new Error('Failed to get sessions');
    }
  }

  // Get active sessions
  static async getActiveSessions() {
    try {
      const sessionsRef = collection(db, 'sessions');
      const q = query(sessionsRef, where('status', '==', 'active'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const sessions = [];
      querySnapshot.forEach((doc) => {
        sessions.push({ id: doc.id, ...doc.data() });
      });
      
      return sessions;
    } catch (error) {
      console.error('Error getting active sessions:', error);
      throw new Error('Failed to get active sessions');
    }
  }

  // Get session by ID
  static async getSessionById(sessionId) {
    try {
      const sessionsRef = collection(db, 'sessions');
      const q = query(sessionsRef, where('__name__', '==', sessionId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('Session not found');
      }
      
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Error getting session:', error);
      throw new Error('Failed to get session');
    }
  }

  // Update session status
  static async updateSessionStatus(sessionId, status) {
    try {
      const sessionRef = doc(db, 'sessions', sessionId);
      await updateDoc(sessionRef, {
        status,
        updatedAt: new Date().toISOString()
      });
      
      return { success: true, message: 'Session status updated' };
    } catch (error) {
      console.error('Error updating session status:', error);
      throw new Error('Failed to update session status');
    }
  }

  // Close session
  static async closeSession(sessionId) {
    try {
      const sessionRef = doc(db, 'sessions', sessionId);
      await updateDoc(sessionRef, {
        status: 'closed',
        closedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      return { success: true, message: 'Session closed successfully' };
    } catch (error) {
      console.error('Error closing session:', error);
      throw new Error('Failed to close session');
    }
  }

  // Add student to session
  static async addStudentToSession(sessionId, studentId, studentData) {
    try {
      const sessionRef = doc(db, 'sessions', sessionId);
      const session = await this.getSessionById(sessionId);
      
      if (session.status !== 'active') {
        throw new Error('Cannot add student to inactive session');
      }
      
      // Update session with new student
      await updateDoc(sessionRef, {
        totalStudents: session.totalStudents + 1,
        updatedAt: new Date().toISOString()
      });
      
      // Add student to session students collection
      await addDoc(collection(db, 'sessions', sessionId, 'students'), {
        studentId,
        ...studentData,
        addedAt: new Date().toISOString()
      });
      
      return { success: true, message: 'Student added to session' };
    } catch (error) {
      console.error('Error adding student to session:', error);
      throw new Error('Failed to add student to session');
    }
  }

  // Mark attendance for a student in a session
  static async markAttendance(sessionId, studentId, status, photoBlob = null, blockchainContract = null) {
    try {
      const session = await this.getSessionById(sessionId);
      
      if (session.status !== 'active') {
        throw new Error('Cannot mark attendance in inactive session');
      }
      
      // Generate photo hash if photo provided
      let photoHash = null;
      if (photoBlob) {
        photoHash = await this.generatePhotoHash(photoBlob);
      }
      
      // Create attendance record
      const attendanceRecord = {
        sessionId,
        studentId,
        status,
        timestamp: new Date().toISOString(),
        photoHash,
        method: 'face_recognition'
      };
      
      // Add to Firebase
      const docRef = await addDoc(collection(db, 'attendance'), attendanceRecord);
      
      // Add to blockchain if contract is available
      let blockchainResult = null;
      if (blockchainContract) {
        try {
          const blockchainRecord = BlockchainService.createAttendanceRecord(
            studentId,
            sessionId,
            attendanceRecord.timestamp,
            status,
            photoHash
          );
          
          blockchainResult = await BlockchainService.addAttendanceRecord(blockchainRecord, blockchainContract);
        } catch (blockchainError) {
          console.warn('Blockchain storage failed, but Firebase record was saved:', blockchainError);
        }
      }
      
      // Update session counts
      const sessionRef = doc(db, 'sessions', sessionId);
      const updateData = { updatedAt: new Date().toISOString() };
      
      if (status === 'present') {
        updateData.presentCount = session.presentCount + 1;
      } else if (status === 'absent') {
        updateData.absentCount = session.absentCount + 1;
      }
      
      await updateDoc(sessionRef, updateData);
      
      return {
        success: true,
        message: 'Attendance marked successfully',
        recordId: docRef.id,
        blockchainResult: blockchainResult
      };
    } catch (error) {
      console.error('Error marking attendance:', error);
      throw new Error('Failed to mark attendance');
    }
  }

  // Get session attendance
  static async getSessionAttendance(sessionId, blockchainContract = null) {
    try {
      // Get from Firebase
      const attendanceRef = collection(db, 'attendance');
      const q = query(attendanceRef, where('sessionId', '==', sessionId), orderBy('timestamp'));
      const querySnapshot = await getDocs(q);
      
      const attendance = [];
      querySnapshot.forEach((doc) => {
        attendance.push({ id: doc.id, ...doc.data() });
      });
      
      // Get from blockchain if contract is available
      let blockchainAttendance = [];
      if (blockchainContract) {
        try {
          blockchainAttendance = await BlockchainService.getAttendanceRecords(blockchainContract, sessionId);
        } catch (blockchainError) {
          console.warn('Failed to get blockchain attendance:', blockchainError);
        }
      }
      
      return {
        firebase: attendance,
        blockchain: blockchainAttendance,
        total: attendance.length + blockchainAttendance.length
      };
    } catch (error) {
      console.error('Error getting session attendance:', error);
      throw new Error('Failed to get session attendance');
    }
  }

  // Generate photo hash
  static async generatePhotoHash(photoBlob) {
    try {
      const arrayBuffer = await photoBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Simple hash function (use crypto-js or similar in production)
      let hash = 0;
      for (let i = 0; i < uint8Array.length; i++) {
        hash = ((hash << 5) - hash) + uint8Array[i];
        hash = hash & hash;
      }
      
      return Math.abs(hash).toString(16);
    } catch (error) {
      console.error('Error generating photo hash:', error);
      return null;
    }
  }

  // Get session statistics
  static async getSessionStats(sessionId, blockchainContract = null) {
    try {
      const session = await this.getSessionById(sessionId);
      const attendance = await this.getSessionAttendance(sessionId, blockchainContract);
      
      const presentCount = attendance.firebase.filter(r => r.status === 'present').length;
      const absentCount = attendance.firebase.filter(r => r.status === 'absent').length;
      const attendanceRate = session.totalStudents > 0 ? (presentCount / session.totalStudents) * 100 : 0;
      
      return {
        sessionId,
        sessionName: session.name,
        status: session.status,
        totalStudents: session.totalStudents,
        presentCount,
        absentCount,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
        totalRecords: attendance.total,
        blockchainRecords: attendance.blockchain.length,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      };
    } catch (error) {
      console.error('Error getting session stats:', error);
      throw new Error('Failed to get session statistics');
    }
  }
}
