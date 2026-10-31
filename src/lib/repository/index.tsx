"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { DataStore } from "./data-interface";
import { DemoDataStore } from "./demo-store";
import { FirebaseDataStore } from "./firebase-store";
import { isFirebaseConfigured, auth, googleProvider } from "@/lib/firebase/config";
import { signInWithPopup, signOut as fbSignOut, onAuthStateChanged, User } from "firebase/auth";
import { UserProfile, Term, Course } from "@/types/schemas";

interface DataStoreContextValue {
  dataStore: DataStore;
  isDemo: boolean;
  currentUser: UserProfile | null;
  firebaseUser: User | null;
  currentTerm: Term | null;
  terms: Term[];
  courses: Course[];
  refreshData: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  loadDemoData: () => Promise<void>;
  clearDemoData: () => Promise<void>;
}

const DataStoreContext = createContext<DataStoreContextValue | null>(null);

export function DataStoreProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isDemo, setIsDemo] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [terms, setTerms] = useState<Term[]>([]);
  const [currentTerm, setCurrentTerm] = useState<Term | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [version, setVersion] = useState(0);

  // Initialize data store instance
  const dataStore = useMemo<DataStore>(() => {
    if (isFirebaseConfigured && !isDemo && firebaseUser) {
      return new FirebaseDataStore();
    }
    return new DemoDataStore();
  }, [isDemo, firebaseUser, version]);

  // Listen to Firebase Auth state if configured
  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setFirebaseUser(user);
        if (user) {
          setIsDemo(false);
        }
      });
      return () => unsubscribe();
    }
  }, []);

  const refreshData = useCallback(async () => {
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
  }, [dataStore]);

  useEffect(() => {
    refreshData();
  }, [refreshData, version]);

  const signInWithGoogle = async () => {
    if (isFirebaseConfigured && auth && googleProvider) {
      try {
        await signInWithPopup(auth, googleProvider);
        setIsDemo(false);
        setVersion((v) => v + 1);
      } catch (err) {
        console.error("Google sign in failed:", err);
      }
    } else {
      alert("Firebase is not configured yet. Running in high-fidelity demo mode with full sample data.");
    }
  };

  const signOut = async () => {
    if (isFirebaseConfigured && auth) {
      await fbSignOut(auth);
    }
    setIsDemo(true);
    setVersion((v) => v + 1);
  };

  const loadDemoData = async () => {
    await dataStore.loadDemoData();
    setVersion((v) => v + 1);
  };

  const clearDemoData = async () => {
    await dataStore.clearDemoData();
    setVersion((v) => v + 1);
  };

  const value = useMemo(
    () => ({
      dataStore,
      isDemo,
      currentUser,
      firebaseUser,
      currentTerm,
      terms,
      courses,
      refreshData,
      signInWithGoogle,
      signOut,
      loadDemoData,
      clearDemoData,
    }),
    [
      dataStore,
      isDemo,
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
