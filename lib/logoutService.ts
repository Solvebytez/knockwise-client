import { apiInstance } from './apiInstance'

export interface LogoutResponse {
  success: boolean
  message: string
}

export class LogoutService {
  /**
   * Complete logout process that:
   * 1. Calls backend logout API
   * 2. Clears all browser localStorage data
   * 3. Clears all sessionStorage
   * 4. Clears all cookies
   * 5. Redirects to user selection page
   */
  static async logout(): Promise<void> {
    try {
      // 1. Call backend logout API
      await apiInstance.post('/auth/logout', {}, {
        withCredentials: true
      })
    } catch (error) {
      console.error('Logout API error:', error)
      // Continue with client-side cleanup even if API fails
    }

    // 2. Clear all browser localStorage data
    if (typeof window !== 'undefined') {
      // Clear all localStorage completely
      localStorage.clear()
      
      // Also clear specific known storage keys to be extra sure
      const knownStorageKeys = [
        'auth-storage',
        'selectedUserType', 
        'userType',
        'accessToken',
        'refreshToken',
        'user',
        'territory-storage',
        'user-storage',
        'knockwise-auth',
        'knockwise-user',
        'knockwise-tokens'
      ]
      
      knownStorageKeys.forEach(key => {
        localStorage.removeItem(key)
      })
      
      console.log('✅ All browser localStorage data cleared')
    }

    // 3. Clear all sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.clear()
      console.log('✅ All sessionStorage data cleared')
    }

    // 4. Clear all cookies (client-side)
    this.clearAllCookies()

    // 5. Redirect to select user type page
    if (typeof window !== 'undefined') {
      console.log('🔄 Redirecting to select user type page...')
      window.location.href = '/select-user-type'
    }
  }

  /**
   * Clear all cookies from the client side
   */
  private static clearAllCookies(): void {
    if (typeof document === 'undefined') return

    const cookies = document.cookie.split(';')

    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i]
      const eqPos = cookie.indexOf('=')
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
      
      // Clear cookie by setting it to expire in the past
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`
    }
  }

  /**
   * Force logout without API call (for emergency logout)
   */
  static forceLogout(): void {
    // Clear all storage
    if (typeof window !== 'undefined') {
      localStorage.clear()
      sessionStorage.clear()
    }

    // Clear cookies
    this.clearAllCookies()

    // Redirect
    if (typeof window !== 'undefined') {
      window.location.href = '/select-user-type'
    }
  }
}
