import React, { createContext, useContext, useEffect, useState } from 'react'
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile 
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '../config/firebase'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [firebaseError, setFirebaseError] = useState(null)

  // Check Firebase connection status
  const checkFirebaseConnection = () => {
    try {
      if (!auth || !db) {
        setFirebaseError('Firebase services not initialized');
        return false;
      }
      setFirebaseError(null);
      return true;
    } catch (error) {
      setFirebaseError(`Firebase connection error: ${error.message}`);
      return false;
    }
  };

  async function signup(email, password, role, displayName) {
    if (!checkFirebaseConnection()) {
      throw new Error('Firebase not available. Please check your configuration.');
    }

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      
      // Update profile with display name
      await updateProfile(result.user, { displayName })
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', result.user.uid), {
        uid: result.user.uid,
        email,
        displayName,
        role,
        createdAt: new Date().toISOString(),
        isActive: true
      })
      
      return result
    } catch (error) {
      console.error('Signup error:', error)
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to create account';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password must be at least 6 characters long';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address';
      } else if (error.code === 'auth/configuration-not-found') {
        errorMessage = 'Firebase configuration error. Please contact administrator.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      throw new Error(errorMessage);
    }
  }

  async function login(email, password) {
    if (!checkFirebaseConnection()) {
      throw new Error('Firebase not available. Please check your configuration.');
    }

    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      
      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', result.user.uid))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        setUser({
          ...result.user,
          role: userData.role,
          displayName: userData.displayName
        })
      }
      
      return result
    } catch (error) {
      console.error('Login error:', error)
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to sign in';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (error.code === 'auth/configuration-not-found') {
        errorMessage = 'Firebase configuration error. Please contact administrator.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      throw new Error(errorMessage);
    }
  }

  async function logout() {
    try {
      if (auth) {
        await signOut(auth)
      }
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
      // Even if logout fails, clear local user state
      setUser(null)
      throw new Error('Failed to sign out. Please try again.');
    }
  }

  async function updateUserRole(uid, newRole) {
    if (!checkFirebaseConnection()) {
      throw new Error('Firebase not available. Please check your configuration.');
    }

    try {
      await setDoc(doc(db, 'users', uid), { role: newRole }, { merge: true })
      
      // Update local user state if it's the current user
      if (user && user.uid === uid) {
        setUser(prev => ({ ...prev, role: newRole }))
      }
    } catch (error) {
      console.error('Update user role error:', error)
      throw new Error('Failed to update user role. Please try again.');
    }
  }

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check Firebase connection first
        if (!checkFirebaseConnection()) {
          setLoading(false);
          return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (user) {
            try {
              // Get user data from Firestore
              const userDoc = await getDoc(doc(db, 'users', user.uid))
              if (userDoc.exists()) {
                const userData = userDoc.data()
                setUser({
                  ...user,
                  role: userData.role,
                  displayName: userData.displayName
                })
              } else {
                setUser(user)
              }
            } catch (error) {
              console.error('Error fetching user data:', error)
              setUser(user)
            }
          } else {
            setUser(null)
          }
          setLoading(false)
        })

        return unsubscribe
      } catch (error) {
        console.error('Firebase auth check failed:', error)
        setFirebaseError(`Authentication error: ${error.message}`);
        setLoading(false)
      }
    }
    
    checkAuth()
  }, [])

  const value = {
    user,
    signup,
    login,
    logout,
    updateUserRole,
    loading,
    firebaseError,
    checkFirebaseConnection
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
