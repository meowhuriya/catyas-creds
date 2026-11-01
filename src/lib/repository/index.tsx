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
  signInWithGoogle: () => Promise<void>;
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
  const [terms, setTerms] = useState<Term[]>([]);
  const [currentTerm, setCurrentTerm] = useState<Term | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
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
      // Check for redirect sign-in result first
      getRedirectResult(auth)
        .then((cred) => {
          if (cred?.user) {
            setFirebaseUser(cred.user);
          }
        })
        .catch((err) => {
          console.warn("Redirect sign-in check failed:", err);
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
      setTerms([]);
      setCourses([]);
      return;
    }
    try {
      const [u, tList, cList] = await Promise.all([
        dataStore.getUser(),
        dataStore.getTerms(),
        dataStore.getCourses(),
      ]);
      setCurrentUser(u);
      setTerms(tList);
      const curr = tList.find((t) => t.isCurrent) || tList[0] || null;
      setCurrentTerm(curr);
      setCourses(cList);
    } catch (err) {
      console.error("Failed to load repository data:", err);
    }
  }, [dataStore, isRealMode, firebaseUser]);

  useEffect(() => {
    if (!authLoading) {
      refreshData();
    }
  }, [refreshData, version, authLoading]);

  const signInWithGoogle = async () => {
    if (isRealMode && auth && googleProvider) {
      try {
        await signInWithPopup(auth, googleProvider);
        setVersion((v) => v + 1);
      } catch (err: any) {
        if (err?.code === "auth/popup-blocked") {
          console.warn("Popup blocked. Falling back to redirect...");
          await signInWithRedirect(auth, googleProvider);
          return;
        }
        throw err;
      }
    } else {
      alert("Firebase is not configured. Running in local demo mode.");
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
