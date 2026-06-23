import { useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { useAuthStore } from '../store';
import { User } from '../types';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export const useAuth = () => {
  const { user, setUser, setIsLoading, isLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch user profile from Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setUser({
              ...userData,
              uid: firebaseUser.uid,
              createdAt: userData.createdAt?.toDate?.() || new Date(),
            } as User);
          } else {
            // Create user profile if it doesn't exist
            const newUser: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'User',
              role: 'agent',
              createdAt: new Date(),
            };

            await setDoc(userDocRef, {
              ...newUser,
              createdAt: serverTimestamp(),
            });

            setUser(newUser);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // Still set basic user info even if profile fetch fails
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'User',
            role: 'agent',
            createdAt: new Date(),
          } as User);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setIsLoading]);

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return { user, isLoading, logout };
};
