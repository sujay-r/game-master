import { defineStore } from 'pinia'
import type { Session, User, AuthChangeEvent } from '@supabase/supabase-js'
import { signInWithOtp, verifyOtp, signOut, getSession, onAuthStateChange } from '@/lib/supabase'

const ALLOWED_EMAIL = import.meta.env.VITE_ALLOWED_EMAIL

interface AuthState {
  session: Session | null
  user: User | null
  loading: boolean
  error: string | null
  email: string
  otpSent: boolean
  authReady: Promise<void>
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    session: null,
    user: null,
    loading: false,
    error: null,
    email: '',
    otpSent: false,
    authReady: Promise.resolve(),
  }),

  getters: {
    isAuthenticated: (state) => !!state.session,
    isAllowedEmail: (state) => state.email.toLowerCase() === ALLOWED_EMAIL.toLowerCase(),
  },

  actions: {
    async initializeAuth() {
      let resolveReady: () => void
      this.authReady = new Promise((resolve) => {
        resolveReady = resolve
      })

      this.loading = true
      try {
        const session = await getSession()
        if (session) {
          this.session = session
          this.user = session.user
        }

        // Set up auth state listener
        onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
          if (event === 'SIGNED_IN' && session) {
            this.session = session
            this.user = session.user
          } else if (event === 'SIGNED_OUT') {
            this.session = null
            this.user = null
          }
        })
      } catch (err) {
        console.error('Error initializing auth:', err)
      } finally {
        this.loading = false
        resolveReady!()
      }
    },

    async sendOtp(email: string) {
      this.loading = true
      this.error = null
      this.email = email

      // Check if ALLOWED_EMAIL is configured
      if (!ALLOWED_EMAIL) {
        this.error =
          'Server configuration error: ALLOWED_EMAIL not set. Please contact the administrator.'
        this.loading = false
        return false
      }

      // Validate email is allowed
      if (!this.isAllowedEmail) {
        this.error = 'This email is not authorized to access this application.'
        this.loading = false
        return false
      }

      try {
        await signInWithOtp(email)
        this.otpSent = true
        return true
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to send OTP. Please try again.'
        this.error = errorMessage
        console.error('Error sending OTP:', err)
        return false
      } finally {
        this.loading = false
      }
    },

    async verifyOtp(token: string) {
      this.loading = true
      this.error = null

      try {
        const { session } = await verifyOtp(this.email, token)
        this.session = session
        this.user = session?.user ?? null
        this.otpSent = false
        this.email = ''
        return true
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Invalid OTP. Please try again.'
        this.error = errorMessage
        console.error('Error verifying OTP:', err)
        return false
      } finally {
        this.loading = false
      }
    },

    async logout() {
      this.loading = true
      try {
        await signOut()
        this.session = null
        this.user = null
        this.otpSent = false
        this.email = ''
        this.error = null
      } catch (err) {
        console.error('Error signing out:', err)
      } finally {
        this.loading = false
      }
    },

    clearError() {
      this.error = null
    },

    resetOtpFlow() {
      this.otpSent = false
      this.error = null
    },
  },
})
