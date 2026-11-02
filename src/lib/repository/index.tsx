"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { DataStore } from "./data-interface";
import { DemoDataStore } from "./demo-store";
import { FirebaseDataStore } from "./firebase-store";
import { isFirebaseConfigured, auth, googleProvider } from "@/lib/firebase/config";
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as fbSignOut,
  onAuthStateChanged,
  deleteUser,
  User,
} from "firebase/auth";
import { UserProfile, Term, Course } from "@/types/schemas";
import { SEED_TERMS, SEED_COURSES } from "@/lib/demo/seed-data";

interface DataStoreContextValue {
  dataStore: DataStore;
  isDemo: boolean;
  isRealMode: boolean;
  authLoading: boolean;
  isSampleActive: boolean;
  currentUser: UserProfile | null;
  firebaseUser: User | null;
  currentTerm: Term | null;
  terms: Term[];
  courses: Course[];
  refreshData: () => Promise<void>;
  signInWithGoogle: () => Promise<any>;
  signOut: () => Promise<void>;
  deleteMyAccountAndData: () => Promise<void>;
  loadDemoData: () => Promise<void>;
  clearDemoData: () => Promise<void>;
  restoreOriginalSyllabus: (courseId?: string) => Promise<void>;
}

const DataStoreContext = createContext<DataStoreContextValue | null>(null);

export function DataStoreProvider({ children }: { children: React.ReactNode }) {
  const isRealMode = isFirebaseConfigured;
  const isDemo = !isRealMode;

  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(isRealMode);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [terms, setTerms] = useState<Term[]>(() => SEED_TERMS.map((t) => ({ ...t })));
  const [currentTerm, setCurrentTerm] = useState<Term | null>(() => ({ ...SEED_TERMS[0] }));
  const [courses, setCourses] = useState<Course[]>(() => SEED_COURSES.map((c) => ({ ...c })));
  const [version, setVersion] = useState(0);

  // Initialize data store instance
  const dataStore = useMemo<DataStore>(() => {
    if (isRealMode && firebaseUser) {
      return new FirebaseDataStore();
    }
    return new DemoDataStore();
  }, [isRealMode, firebaseUser, version]);

  // Listen to Firebase Auth state if in real mode
  useEffect(() => {
    if (isRealMode && auth) {
      // Check for redirect sign-in result once on load and clear any stuck pending-redirect state
      getRedirectResult(auth)
        .then((cred) => {
          if (cred?.user) {
            setFirebaseUser(cred.user);
          }
        })
        .catch((err) => {
          console.warn("Redirect sign-in check caught:", err?.code, err?.message);
          if (err?.code === "auth/missing-initial-state" || err?.code === "auth/popup-blocked") {
            try {
              if (typeof window !== "undefined") {
                for (let i = sessionStorage.length - 1; i >= 0; i--) {
                  const key = sessionStorage.key(i);
                  if (key && (key.startsWith("firebase:") || key.includes("redirect"))) {
                    sessionStorage.removeItem(key);
                  }
                }
              }
            } catch {}
          }
        });

      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setFirebaseUser(user);
        setAuthLoading(false);
      });
      return () => unsubscribe();
    } else {
      setAuthLoading(false);
    }
  }, [isRealMode]);

  const refreshData = useCallback(async () => {
    if (isRealMode && !firebaseUser) {
      setCurrentUser(null);
      setTerms(SEED_TERMS.map((t) => ({ ...t })));
      setCurrentTerm({ ...SEED_TERMS[0] });
      setCourses(SEED_COURSES.map((c) => ({ ...c })));
      return;
    }
    try {
      const u = await dataStore.getUser();
      setCurrentUser(u);

      const tList = await dataStore.getTerms();
      if (tList && tList.length > 0) {
        setTerms(tList);
        const curr = tList.find((t) => t.isCurrent) || tList[0] || null;
        setCurrentTerm(curr);
      }

      const cList = await dataStore.getCourses();
      if (cList && cList.length > 0) {
        setCourses(cList);
      }
    } catch (err) {
      console.error("Failed to load repository data:", err);
    }
  }, [dataStore, isRealMode, firebaseUser]);

  useEffect(() => {
    if (!authLoading) {
      refreshData();
    }
  }, [refreshData, version, authLoading]);

  const signInWithGoogle = () => {
    if (isRealMode && auth && googleProvider) {
      // Must be called synchronously to avoid Safari blocking the popup window
      return signInWithPopup(auth, googleProvider).then((res) => {
        setVersion((v) => v + 1);
        return res;
      });
    } else {
      alert("Firebase is not configured. Running in local demo mode.");
      return Promise.reject(new Error("Firebase is not configured"));
    }
  };

  const signOut = async () => {
    if (isRealMode && auth) {
      await fbSignOut(auth);
    }
    setFirebaseUser(null);
    setCurrentUser(null);
    setVersion((v) => v + 1);
  };

  const deleteMyAccountAndData = async () => {
    if (isRealMode && auth && auth.currentUser) {
      const currAuthUser = auth.currentUser;
      try {
        await dataStore.deleteAccountAndData?.();
      } catch (err) {
        console.warn("Failed to delete Firestore user data:", err);
      }
      try {
        await deleteUser(currAuthUser);
      } catch (err) {
        console.warn("Auth user deletion required re-auth:", err);
        await fbSignOut(auth);
      }
      setFirebaseUser(null);
      setCurrentUser(null);
      setVersion((v) => v + 1);
    } else {
      await dataStore.clearDemoData();
      setVersion((v) => v + 1);
    }
  };

  const loadDemoData = async () => {
    await dataStore.loadDemoData();
    setVersion((v) => v + 1);
  };

  const clearDemoData = async () => {
    await dataStore.clearDemoData();
    setVersion((v) => v + 1);
  };

  const restoreOriginalSyllabus = async (courseId?: string) => {
    await dataStore.restoreOriginalSyllabus(courseId);
    setVersion((v) => v + 1);
  };

  const isSampleActive = dataStore.isSampleDataActive();

  const value = useMemo(
    () => ({
      dataStore,
      isDemo,
      isRealMode,
      authLoading,
      isSampleActive,
      currentUser,
      firebaseUser,
      currentTerm,
      terms,
      courses,
      refreshData,
      signInWithGoogle,
      signOut,
      deleteMyAccountAndData,
      loadDemoData,
      clearDemoData,
      restoreOriginalSyllabus,
    }),
    [
      dataStore,
      isDemo,
      isRealMode,
      authLoading,
      isSampleActive,
      currentUser,
      firebaseUser,
      currentTerm,
      terms,
      courses,
      refreshData,
    ]
  );

  return (
    <DataStoreContext.Provider value={value}>
      {children}
    </DataStoreContext.Provider>
  );
}

export function useDataStore(): DataStoreContextValue {
  const ctx = useContext(DataStoreContext);
  if (!ctx) {
    throw new Error("useDataStore must be used within a DataStoreProvider");
  }
  return ctx;
}
