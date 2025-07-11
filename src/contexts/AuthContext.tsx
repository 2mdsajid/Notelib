import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  reload
} from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, runTransaction, serverTimestamp, updateDoc, setDoc, increment } from 'firebase/firestore';

interface AuthContextType {
  currentUser: User | null;
  isAdmin: boolean;
  loading: boolean;
  isNewUser: boolean;
  signInWithGoogle: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, userData: any) => Promise<void>;
  logout: () => Promise<void>;
  markUserAsOld: () => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  checkEmailVerified: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setIsAdmin(userData.role === 'admin');
          setIsNewUser(userData.isNewUser === true);
        } else {
          setIsAdmin(false);
          setIsNewUser(false);
        }
      } else {
        setIsAdmin(false);
        setIsNewUser(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const markUserAsOld = async () => {
    if (currentUser) {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userDocRef, {
          isNewUser: false,
        });
        setIsNewUser(false);
      } catch (error) {
        console.error("Error marking user as old:", error);
      }
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(db, 'users', user.uid);
      const enrollmentCounterRef = doc(db, 'enrollment', 'counter');
      
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        await updateDoc(userDocRef, {
          lastLogin: serverTimestamp()
        });
      } else {
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          role: 'student',
          providerId: 'google.com',
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          isNewUser: true,
        });

        const enrollmentDocSnap = await getDoc(enrollmentCounterRef);
        if (!enrollmentDocSnap.exists()) {
          await setDoc(enrollmentCounterRef, { count: 1 });
        } else {
          await updateDoc(enrollmentCounterRef, { count: increment(1) });
        }
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;

      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        const isAdminUser = email === 'note@admin.notelibrary.com';
        await runTransaction(db, async (transaction) => {
          const enrollmentCounterRef = doc(db, 'enrollment', 'counter');
          const enrollmentDoc = await transaction.get(enrollmentCounterRef);
          
          transaction.set(userDocRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || email.split('@')[0],
            role: isAdminUser ? 'admin' : 'student',
            providerId: 'password',
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            isNewUser: true,
          });

          if (!enrollmentDoc.exists()) {
            transaction.set(enrollmentCounterRef, { count: 1 });
          } else {
            transaction.update(enrollmentCounterRef, { count: increment(1) });
          }
        });
      } else {
        await updateDoc(userDocRef, { 
          lastLogin: serverTimestamp() 
        });
      }

      // Check if email verification is required for email/password users
      if (user.providerData[0]?.providerId === 'password' && !user.emailVerified && email !== 'note@admin.notelibrary.com') {
        // Don't navigate automatically - let the component handle this
        throw new Error('EMAIL_NOT_VERIFIED');
      }
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  };

  const signup = async (email: string, password: string, userData: any) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;
      const isAdminUser = email === 'note@admin.notelibrary.com';

      await runTransaction(db, async (transaction) => {
        const userDocRef = doc(db, 'users', user.uid);
        const enrollmentCounterRef = doc(db, 'enrollment', 'counter');
        
        const enrollmentDoc = await transaction.get(enrollmentCounterRef);
        
        transaction.set(userDocRef, {
          ...userData,
          uid: user.uid,
          email,
          displayName: userData.displayName || userData.fullName || user.displayName || email.split('@')[0],
          role: isAdminUser ? 'admin' : 'student',
          providerId: 'password',
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          isNewUser: true,
        });
        
        if (!enrollmentDoc.exists()) {
          transaction.set(enrollmentCounterRef, { count: 1 });
        } else {
          transaction.update(enrollmentCounterRef, { count: increment(1) });
        }
      });

      // Send verification email for non-admin users
      if (!isAdminUser) {
        await sendEmailVerification(user);
      }
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  };

  const sendVerificationEmail = async () => {
    if (currentUser && !currentUser.emailVerified) {
      try {
        await sendEmailVerification(currentUser);
      } catch (error) {
        console.error('Error sending verification email:', error);
        throw error;
      }
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  };

  const checkEmailVerified = async (): Promise<boolean> => {
    if (currentUser) {
      try {
        await reload(currentUser);
        return currentUser.emailVerified;
      } catch (error) {
        console.error('Error checking email verification:', error);
        return false;
      }
    }
    return false;
  };

  const value = {
    currentUser,
    isAdmin,
    loading,
    isNewUser,
    signInWithGoogle,
    login,
    signup,
    logout,
    markUserAsOld,
    sendVerificationEmail,
    resetPassword,
    checkEmailVerified,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};