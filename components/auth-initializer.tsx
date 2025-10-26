"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/userStore";

export function AuthInitializer() {
  const { fetchUser, user, isLoading, resetLoadingState } = useAuthStore();
  const hasAttemptedFetch = useRef(false);

  useEffect(() => {
    console.log("AuthInitializer: checking auth state", {
      user: !!user,
      isLoading,
      hasAttemptedFetch: hasAttemptedFetch.current,
    });

    // If we already have a user, don't fetch again
    if (user) {
      console.log("AuthInitializer: user already exists, skipping fetch");
      return;
    }

    // If we've already attempted to fetch and failed, don't try again
    if (hasAttemptedFetch.current) {
      console.log("AuthInitializer: already attempted fetch, skipping");
      return;
    }

    // Check if we have any cookies before attempting to fetch
    const hasTokens =
      typeof document !== "undefined" &&
      (document.cookie.includes("accessToken=") ||
        document.cookie.includes("refreshToken="));

    if (!hasTokens) {
      console.log("AuthInitializer: no tokens found, skipping fetch");
      resetLoadingState();
      return;
    }

    // Mark that we've attempted to fetch
    hasAttemptedFetch.current = true;

    console.log("AuthInitializer: fetching user...");
    fetchUser().catch((error) => {
      console.log("Auth initialization failed:", error);
      // Reset the flag so we can try again later if needed
      hasAttemptedFetch.current = false;
    });

    // Set a timeout to reset loading state if it gets stuck
    const timeoutId = setTimeout(() => {
      if (isLoading && !user) {
        console.log("AuthInitializer: loading state stuck, resetting...");
        resetLoadingState();
        hasAttemptedFetch.current = false;
      }
    }, 10000); // 10 second timeout

    return () => {
      clearTimeout(timeoutId);
    };
  }, [user, fetchUser, resetLoadingState]);

  return null; // This component doesn't render anything
}
