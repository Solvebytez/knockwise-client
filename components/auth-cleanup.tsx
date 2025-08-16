"use client"

import { useEffect } from 'react'
import { useAuthStore } from '@/store/userStore'

export function AuthCleanup() {
  const { clearAllAuthData } = useAuthStore()

  useEffect(() => {
    // Check if we need to clear auth data
    const clearAuthHeader = document.querySelector('meta[name="x-clear-auth"]')
    
    if (clearAuthHeader) {
      // Clear all auth data using the store function
      clearAllAuthData()
      
      // Remove the meta tag
      clearAuthHeader.remove()
    }
  }, [clearAllAuthData])

  return null // This component doesn't render anything
}
