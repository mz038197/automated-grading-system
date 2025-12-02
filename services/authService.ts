import { APP_MODE, FIREBASE_CONFIG } from "../config";
import { User } from "../types";
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";

// Mock User Data
const MOCK_USER: User = {
  uid: "mock-dev-user-001",
  displayName: "Dev Developer",
  email: "dev@pytutor.ai",
  photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
};

// Singleton instance for Auth
let auth: any = null;

const getFirebaseAuth = () => {
  if (APP_MODE === 'prod' && !auth) {
    try {
      const app = initializeApp(FIREBASE_CONFIG);
      auth = getAuth(app);
    } catch (e) {
      console.error("Auth Init Error:", e);
    }
  }
  return auth;
};

// Current cached user
let currentUser: User | null = null;

// ==========================================
// Dev Mode (Mock) Implementation
// ==========================================
const DevAuth = {
  signIn: async (): Promise<User> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    currentUser = MOCK_USER;
    localStorage.setItem("pytutor_dev_auth", "true");
    return MOCK_USER;
  },

  signOut: async (): Promise<void> => {
    currentUser = null;
    localStorage.removeItem("pytutor_dev_auth");
    // 清理可能的敏感資料
    console.log("Dev user signed out successfully");
  },

  observeAuth: (callback: (user: User | null) => void) => {
    // Check if we were "logged in" previously in this browser session
    const isIdsLogged = localStorage.getItem("pytutor_dev_auth") === "true";
    if (isIdsLogged) {
      currentUser = MOCK_USER;
      callback(MOCK_USER);
    } else {
      currentUser = null;
      callback(null);
    }
    // Return unsubscribe (noop for dev)
    return () => {};
  },

  getCurrentUser: () => currentUser
};

// ==========================================
// Prod Mode (Firebase) Implementation
// ==========================================
const ProdAuth = {
  signIn: async (): Promise<User> => {
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = mapFirebaseUser(result.user);
      currentUser = user;
      return user;
    } catch (error) {
      console.error("Login failed", error);
      throw error;
    }
  },

  signOut: async (): Promise<void> => {
    const auth = getFirebaseAuth();
    await firebaseSignOut(auth);
    currentUser = null;
    // 清理可能的敏感資料
    console.log("User signed out successfully");
  },

  observeAuth: (callback: (user: User | null) => void) => {
    const auth = getFirebaseAuth();
    return onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const user = mapFirebaseUser(firebaseUser);
        currentUser = user;
        callback(user);
      } else {
        currentUser = null;
        callback(null);
      }
    });
  },

  getCurrentUser: () => currentUser
};

// Helper
const mapFirebaseUser = (u: FirebaseUser): User => ({
  uid: u.uid,
  displayName: u.displayName,
  email: u.email,
  photoURL: u.photoURL
});

// ==========================================
// Facade
// ==========================================

const getService = () => (APP_MODE === 'prod' ? ProdAuth : DevAuth);

export const signIn = () => getService().signIn();
export const signOut = () => getService().signOut();
export const observeAuth = (cb: (u: User | null) => void) => getService().observeAuth(cb);
export const getCurrentUserId = () => getService().getCurrentUser()?.uid;
export const getCurrentUser = () => getService().getCurrentUser();
