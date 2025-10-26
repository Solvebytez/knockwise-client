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

    // Always try to fetch user - let the API handle authentication
    console.log("AuthInitializer: fetching user...");
    fetchUser().catch((error) => {
      console.log("Auth initialization failed:", error);
      // This is expected for unauthenticated users
    });

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
  }, [user, fetchUser, resetLoadingState]); // Remove isLoading from dependencies to prevent loops

  return null; // This component doesn't render anything
}
