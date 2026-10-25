import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  signInWithPopup, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp, collection } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType, isFirebasePlaceholder } from '../lib/firebase';

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  userProfile: any | null;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isDemo: boolean;
  canEnterDemo: boolean;
  enterDemo: () => void;
}

// Sample tasks and calendar items for the local demo session. Writes stay in the
// offline local cache; nothing is sent anywhere.
function seedDemoData(uid: string) {
  const day = 24 * 60 * 60 * 1000;
  const at = (days: number, hour: number) => {
    const d = new Date(Date.now() + days * day);
    d.setHours(hour, 0, 0, 0);
    return d;
  };
  const tasks = [
    { id: 'demo-task-1', title: 'Draft spring referral campaign brief', description: 'Outline goal, audience, channels, and success metrics.', status: 'todo', priority: 'high', tags: ['Campaigns'], category: 'Marketing', folder: 'Campaigns', dueDate: at(2, 15) },
    { id: 'demo-task-2', title: 'Review onboarding video series results', description: 'Compare activation before and after the relaunch.', status: 'todo', priority: 'medium', tags: ['Analytics'], category: 'Operations', folder: 'General', dueDate: at(4, 11) },
    { id: 'demo-task-3', title: 'Send partner webinar invites', description: '', status: 'completed', priority: 'low', tags: ['Email'], category: 'Marketing', folder: 'General', dueDate: at(-1, 10) },
    { id: 'demo-task-4', title: 'Update brand voice guidelines', description: 'Add examples for push notifications.', status: 'todo', priority: 'medium', tags: ['Brand'], category: 'General', folder: 'Personal', dueDate: at(7, 14) },
  ];
  const events = [
    { id: 'demo-event-1', title: 'Weekly marketing sync', description: 'Status, blockers, and next steps.', type: 'meeting', color: 'bg-blue-500', start: at(1, 10) },
    { id: 'demo-event-2', title: 'Spring campaign launch', description: 'Go live across email and in-app.', type: 'campaign', color: 'bg-emerald-500', start: at(5, 9) },
    { id: 'demo-event-3', title: 'Quarterly results review', description: '', type: 'meeting', color: 'bg-blue-500', start: at(9, 13) },
  ];
  tasks.forEach(({ id, ...t }) => {
    setDoc(doc(collection(db, 'users', uid, 'tasks'), id), { ...t, cardStyle: 'accent', createdAt: new Date() }).catch(() => {});
  });
  events.forEach(({ id, ...e }) => {
    setDoc(doc(collection(db, 'users', uid, 'calendarEvents'), id), { ...e, end: e.start, cardStyle: 'accent' }).catch(() => {});
  });
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const isDemoRef = React.useRef(false);

  // Local-only demo session for when no Firebase project is configured.
  const enterDemo = () => {
    if (!isFirebasePlaceholder) return;
    const demoUser = {
      uid: 'demo-user',
      email: 'demo@example.com',
      displayName: 'Demo User',
      photoURL: null,
      emailVerified: true,
      providerData: [],
    } as unknown as User;
    isDemoRef.current = true;
    seedDemoData('demo-user');
    setIsDemo(true);
    setUser(demoUser);
    setUserProfile({
      fullName: 'Demo User',
      email: 'demo@example.com',
      photoUrl: '',
      theme: 'system',
      language: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    setLoading(false);
  };

  useEffect(() => {
    let unsubProfile: (() => void) | undefined;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (isDemoRef.current) return;
      setUser(currentUser);
      setLoading(false);
      
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = undefined;
      }

      if (currentUser) {
        // Sync/Fetch profile
        const userDocRef = doc(db, 'users', currentUser.uid);
        
        // Fast initial load
        getDoc(userDocRef).then(async (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data());
          } else {
            const initialProfile = {
              fullName: currentUser.displayName || '',
              email: currentUser.email,
              photoUrl: currentUser.photoURL || '',
              updatedAt: serverTimestamp(),
              theme: 'system',
              language: 'en',
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              brandIdentity: {
                logoUrl: null,
                primaryColor: '#FF2B2B',
                secondaryColor: '#000000',
                accentColor: '#FF2B2B',
                toneOfVoice: 'Authoritative, driver-centric, persuasive, and data-driven',
                guidelines: 'Brand: Northbeam (sample ride-hailing demo brand). Audience: Ride-hailing drivers (cars/motorcycles). Core Metrics: Maximize Supply Hours (SH), increase Active Drivers, reduce churn, lower Driver Acquisition Cost (DAC). Focus Areas: CRM & Trigger Campaigns, Content Localization/Education, Community Management, Incentives & Challenges, Events & PR, Strategic Partnerships.'
              }
            };
            try {
              await setDoc(userDocRef, initialProfile);
              setUserProfile(initialProfile);
            } catch (err: any) {
              handleFirestoreError(err, OperationType.CREATE, `users/${currentUser.uid}`);
            }
          }
        }).catch(error => {
          if (error?.message?.includes('client is offline')) {
            console.warn("Client is offline. Waiting for onSnapshot to restore data once online.");
          } else {
             handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
          }
        });

        // Use onSnapshot for real-time profile updates (themes, settings, etc.)
        unsubProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data());
          }
        }, (error) => {
          console.error("Profile sync error", error);
        });

      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubProfile) {
        unsubProfile();
      }
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      await sendEmailVerification(userCredential.user);
    } catch (error) {
      console.error('Sign up failed', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Sign in failed', error);
      throw error;
    }
  };

  const logout = async () => {
    if (isDemoRef.current) {
      isDemoRef.current = false;
      setIsDemo(false);
      setUser(null);
      setUserProfile(null);
      return;
    }
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <FirebaseContext.Provider value={{ user, loading, userProfile, signInWithGoogle, signUpWithEmail, signInWithEmail, logout, isDemo, canEnterDemo: isFirebasePlaceholder, enterDemo }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a FirebaseProvider');
  }
  return context;
};

