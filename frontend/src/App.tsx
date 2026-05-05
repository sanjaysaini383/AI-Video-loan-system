import React, { useState, useCallback } from 'react'
import OnboardingFlow from './pages/OnboardingFlow'
import LoanOffers from './pages/LoanOffers'
import './index.css'

// API base URL
const API_BASE = 'http://localhost:3000'

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
