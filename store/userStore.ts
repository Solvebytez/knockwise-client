import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiInstance } from '@/lib/apiInstance';

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
    user: User | null
    setUser: (user: User | null) => void
    fetchUser: () => Promise<void>; // For manual refreshes
    isLoading: boolean;
    logout: () => void;
    clearAllAuthData: () => void;
  }

  export const useAuthStore = create<AuthStore>()(
    persist(
      (set) => ({
        user: null,
        isLoading: false,
        setUser: (user) => set({ user }),
        fetchUser: async () => {
            set({ isLoading: true });
            try {
              const { data } = await apiInstance.get('/get-user', {
                withCredentials: true,
              });
              set({ user: data.user, isLoading: false });
            } catch (error) {
              set({ user: null, isLoading: false });
              throw error; // Let components handle errors
            }
          },
        logout: () => {
          set({ user: null, isLoading: false });
        },
        clearAllAuthData: () => {
          set({ user: null, isLoading: false });
          // Clear all auth-related localStorage
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth-storage');
            localStorage.removeItem('selectedUserType');
          }
        },
      }),
      {
        name: 'auth-storage', // unique name for localStorage key
        partialize: (state) => ({ user: state.user }), // only persist user data
      }
    )
  )