"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/userStore";

export function AuthInitializer() {
  const { resetLoadingState } = useAuthStore();

  useEffect(() => {
    console.log("AuthInitializer: disabled to prevent infinite loops");
    // Just reset loading state and don't fetch user
    resetLoadingState();
  }, [resetLoadingState]);

  return null; // This component doesn't render anything
}
