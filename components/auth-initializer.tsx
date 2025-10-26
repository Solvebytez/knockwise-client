"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/userStore";

// Global flag to prevent multiple initializations
let isInitialized = false;

export function AuthInitializer() {
  const { fetchUser, user, isLoading, resetLoadingState } = useAuthStore();

  useEffect(() => {
    console.log("AuthInitializer: checking auth state", {
      user: !!user,
      isLoading,
    });

    if (user) {
      console.log("AuthInitializer: user already exists, skipping fetch");
      return;
    }

    if (!isLoading) {
      console.log("AuthInitializer: no user found, fetching...");
      fetchUser().catch((error) => {
        console.log("Auth initialization failed:", error);
        // This is expected for unauthenticated users
      });
    }

    // Set a timeout to reset loading state if it gets stuck
    const timeoutId = setTimeout(() => {
      if (isLoading && !user) {
        console.log("AuthInitializer: loading state stuck, resetting...");
        resetLoadingState();
      }
    }, 10000); // 10 second timeout

    return () => {
      clearTimeout(timeoutId);
    };
  }, [user, isLoading, fetchUser, resetLoadingState]); // React to user and loading state changes

  return null; // This component doesn't render anything
}
