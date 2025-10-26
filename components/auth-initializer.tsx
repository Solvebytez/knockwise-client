"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/userStore";

// Global flag to prevent multiple initializations
let isInitialized = false;

export function AuthInitializer() {
  const { fetchUser, user, isLoading, resetLoadingState } = useAuthStore();

  useEffect(() => {
    // Prevent multiple initializations
    if (isInitialized) {
      console.log("AuthInitializer: already initialized, skipping");
      return;
    }

    // Always try to fetch user data on mount if we don't have it
    console.log("AuthInitializer: checking auth state", {
      user: !!user,
      isLoading,
    });

    if (!user) {
      console.log("AuthInitializer: no user found, fetching...");
      isInitialized = true;
      fetchUser().catch((error) => {
        console.log("Auth initialization failed:", error);
        isInitialized = false; // Reset flag on error
        // This is expected for unauthenticated users
      });
    } else {
      console.log("AuthInitializer: user already exists, skipping fetch");
      isInitialized = true;
    }

    // Set a timeout to reset loading state if it gets stuck
    const timeoutId = setTimeout(() => {
      if (isLoading && !user) {
        console.log("AuthInitializer: loading state stuck, resetting...");
        resetLoadingState();
        isInitialized = false; // Reset flag
      }
    }, 10000); // 10 second timeout

    return () => {
      clearTimeout(timeoutId);
      isInitialized = false; // Reset flag on unmount
    };
  }, []); // Only run once on mount

  return null; // This component doesn't render anything
}
