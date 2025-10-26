import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiInstance } from "@/lib/apiInstance";

export interface User {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role?: string;
  status?: string;
  teamId?: any;
  zoneId?: any;
  createdAt?: string;
  // ...other fields
}

interface AuthStore {
  user: User | null;
  setUser: (user: User | null) => void;
  fetchUser: () => Promise<void>; // For manual refreshes
  isLoading: boolean;
  logout: () => void;
  clearAllAuthData: () => void;
  resetLoadingState: () => void; // Reset loading state if stuck
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true, // Start with loading true to show loading states
      setUser: (user) => set({ user }),
      fetchUser: async () => {
        const currentState = get();

        // Prevent multiple calls if we already have user data
        if (currentState.user && currentState.user.name) {
          console.log("User already exists, skipping fetchUser");
          set({ isLoading: false });
          return;
        }

        console.log("Starting fetchUser...");
        set({ isLoading: true });
        try {
          const response = await apiInstance.get("/users/my-profile", {
            withCredentials: true,
          });
          console.log("fetchUser response status:", response.status);
          console.log("fetchUser response data:", response.data);
          
          // Handle 304 (Not Modified) responses
          if (response.status === 304) {
            console.log("304 response - using cached data");
            // For 304 responses, we need to get the user data from somewhere else
            // or make a fresh request without cache
            const freshResponse = await apiInstance.get("/users/my-profile", {
              withCredentials: true,
              headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
              }
            });
            console.log("Fresh response data:", freshResponse.data);
            
            if (freshResponse.data.user && freshResponse.data.user.name) {
              set({ user: freshResponse.data.user, isLoading: false });
            } else {
              console.log("Invalid user data in fresh response");
              set({ user: null, isLoading: false });
            }
          } else if (response.data.user && response.data.user.name) {
            set({ user: response.data.user, isLoading: false });
          } else {
            console.log("Invalid user data received, redirecting to login");
            set({ user: null, isLoading: false });
            // Redirect to login if user data is invalid
            if (typeof window !== "undefined") {
              window.location.href = "/login";
            }
          }
        } catch (error) {
          console.log("fetchUser failed:", error);
          set({ user: null, isLoading: false });
          // Redirect to login on authentication error
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
          throw error; // Let components handle errors
        }
      },
      logout: () => {
        set({ user: null, isLoading: false });
      },
      clearAllAuthData: () => {
        set({ user: null, isLoading: false });
        // Clear all auth-related localStorage
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth-storage");
          localStorage.removeItem("selectedUserType");
        }
      },
      resetLoadingState: () => {
        console.log("Resetting loading state");
        set({ isLoading: false });
      },
    }),
    {
      name: "auth-storage", // unique name for localStorage key
      partialize: (state) => ({ user: state.user }), // only persist user data
      onRehydrateStorage: () => (state) => {
        // When rehydrating from localStorage, check if we have user data
        if (state) {
          if (state.user) {
            // If we have user data, we're not loading
            state.isLoading = false;
          } else {
            // If no user data, we need to fetch it
            state.isLoading = true;
          }
        }
      },
    }
  )
);

