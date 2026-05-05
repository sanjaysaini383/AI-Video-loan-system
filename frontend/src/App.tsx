import React, { useState, useCallback, useEffect } from 'react'
import OnboardingFlow from './pages/OnboardingFlow'
import LoanOffers from './pages/LoanOffers'
import './index.css'

// API base URL — uses Vite proxy in dev, direct URL in production
const API_BASE = ''  // Will be proxied to :3000 by Vite

// ===========================
// AUTH SERVICE
// ===========================
class AuthService {
  private static TOKEN_KEY = 'loanvision_token'
  private static USER_KEY = 'loanvision_user'

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY)
  }

  static getUser(): any | null {
    const raw = localStorage.getItem(this.USER_KEY)
    return raw ? JSON.parse(raw) : null
  }

  static setAuth(token: string, user: any): void {
    localStorage.setItem(this.TOKEN_KEY, token)
    localStorage.setItem(this.USER_KEY, JSON.stringify(user))
  }

  static clearAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY)
    localStorage.removeItem(this.USER_KEY)
  }

  static isLoggedIn(): boolean {
    const token = this.getToken()
    if (!token) return false
    // Check if token is expired
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.exp * 1000 > Date.now()
    } catch {
      return false
    }
  }

  static async apiCall(path: string, options: RequestInit = {}): Promise<Response> {
    const token = this.getToken()
    const headers: any = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const response = await fetch(`${API_BASE}${path}`, { ...options, headers })

    // Auto-logout on 401
    if (response.status === 401) {
      this.clearAuth()
      window.location.reload()
    }

    return response
  }
}

export { AuthService }

export interface SessionData {
  sessionId: string
  customerData: {
    firstName: string
    lastName: string
    phoneNumber: string
    employmentStatus: string
    monthlyIncome: string
    loanPurpose: string
  }
  location: { latitude: number; longitude: number } | null
  transcript: string
  offers: any[]
  pipelineResult: any
}

function App() {
  const [currentPage, setCurrentPage] = useState<'onboarding' | 'offers'>('onboarding')
  const [isLoggedIn, setIsLoggedIn] = useState(AuthService.isLoggedIn())
  const [user, setUser] = useState(AuthService.getUser())
  const [session, setSession] = useState<SessionData>({
    sessionId: '',
    customerData: {
      firstName: '', lastName: '', phoneNumber: '',
      employmentStatus: '', monthlyIncome: '', loanPurpose: '',
    },
    location: null,
    transcript: '',
    offers: [],
    pipelineResult: null,
  })

  const updateSession = useCallback((updates: Partial<SessionData>) => {
    setSession(prev => ({ ...prev, ...updates }))
  }, [])

  const goToOffers = useCallback((offers: any[]) => {
    updateSession({ offers })
    setCurrentPage('offers')
  }, [updateSession])

  const handleLogout = useCallback(async () => {
    try {
      await AuthService.apiCall('/api/auth/logout', { method: 'POST' })
    } catch { } // ignore if API is down
    AuthService.clearAuth()
    setIsLoggedIn(false)
    setUser(null)
  }, [])

  const handleLogin = useCallback((token: string, userData: any) => {
    AuthService.setAuth(token, userData)
    setIsLoggedIn(true)
    setUser(userData)
  }, [])

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-brand">
          <div className="header-brand-icon">🏦</div>
          <div className="header-brand-text">LoanVision AI</div>
        </div>
        <nav className="header-nav">
          <button
            className={`header-nav-btn ${currentPage === 'onboarding' ? 'active' : ''}`}
            onClick={() => setCurrentPage('onboarding')}
          >
            Apply Now
          </button>
          <button
            className={`header-nav-btn ${currentPage === 'offers' ? 'active' : ''}`}
            onClick={() => setCurrentPage('offers')}
          >
            My Offers
          </button>
          {isLoggedIn && (
            <>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                👤 {user?.firstName || 'User'}
              </span>
              <button className="header-nav-btn" onClick={handleLogout} style={{ color: 'var(--accent-red)' }}>
                Logout
              </button>
            </>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <div className="page-enter" key={currentPage}>
          {currentPage === 'onboarding' && (
            <OnboardingFlow
              session={session}
              updateSession={updateSession}
              goToOffers={goToOffers}
              apiBase={API_BASE}
              isLoggedIn={isLoggedIn}
              onLogin={handleLogin}
            />
          )}
          {currentPage === 'offers' && (
            <LoanOffers
              offers={session.offers}
              apiBase={API_BASE}
            />
          )}
        </div>
      </main>
    </div>
  )
}

export default App
