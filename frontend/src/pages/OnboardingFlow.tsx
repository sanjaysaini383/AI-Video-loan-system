import React, { useState, useCallback } from 'react'
import VideoCall from '../components/VideoCall'
import ProcessingView from '../components/ProcessingView'
import type { SessionData } from '../App'

interface Props {
  session: SessionData
  updateSession: (updates: Partial<SessionData>) => void
  goToOffers: (offers: any[]) => void
  apiBase: string
}

const STEPS = [
  { num: 1, label: 'Details' },
  { num: 2, label: 'Video KYC' },
  { num: 3, label: 'Processing' },
  { num: 4, label: 'Offers' },
]

export const OnboardingFlow: React.FC<Props> = ({ session, updateSession, goToOffers, apiBase }) => {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    phoneNumber: '',
    firstName: '',
    lastName: '',
    employmentStatus: '',
    monthlyIncome: '',
    loanPurpose: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.phoneNumber || formData.phoneNumber.length < 10) newErrors.phoneNumber = 'Valid phone number required'
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!formData.employmentStatus) newErrors.employmentStatus = 'Select employment status'
    if (!formData.monthlyIncome || parseFloat(formData.monthlyIncome) <= 0) newErrors.monthlyIncome = 'Enter valid income'
    if (!formData.loanPurpose) newErrors.loanPurpose = 'Select loan purpose'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const startVideoCall = useCallback(async () => {
    if (!validateForm()) return

    // Capture geo-location
    let location: { latitude: number; longitude: number } | null = null
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
      })
      location = { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
    } catch {
      location = { latitude: 28.6139, longitude: 77.2090 } // Default: New Delhi
    }

    // Create session via API
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    try {
      await fetch(`${apiBase}/api/sessions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, location }),
      })
    } catch { /* API may not be running yet, continue */ }

    updateSession({
      sessionId,
      customerData: formData,
      location,
    })

    setStep(2)
  }, [formData, apiBase, updateSession])

  const handleVideoComplete = useCallback(async (transcript: string) => {
    updateSession({ transcript })
    setStep(3)

    // Process through pipeline
    try {
      const response = await fetch(`${apiBase}/api/sessions/${session.sessionId}/process`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          customerData: formData,
          location: session.location,
          estimatedAge: 30,
        }),
      })
      const result = await response.json()
      updateSession({ pipelineResult: result })

      // Get offers from pipeline result
      const offers = result?.stages?.offer?.data?.offers || result?.stages?.offer?.data || []
      setTimeout(() => {
        goToOffers(Array.isArray(offers) ? offers : [offers])
      }, 4000)
    } catch {
      // Simulate pipeline if API unavailable
      const simulatedOffers = [
        { id: `offer_${Date.now()}_1`, loanAmount: parseFloat(formData.monthlyIncome || '50000') * 40, tenureMonths: 60, interestRate: 10.5, emi: Math.round(parseFloat(formData.monthlyIncome || '50000') * 40 * 0.0215), eligibilityStatus: 'approved', conditions: [], totalPayable: 0, totalInterest: 0 },
        { id: `offer_${Date.now()}_2`, loanAmount: parseFloat(formData.monthlyIncome || '50000') * 28, tenureMonths: 36, interestRate: 11.0, emi: Math.round(parseFloat(formData.monthlyIncome || '50000') * 28 * 0.0326), eligibilityStatus: 'approved', conditions: [], totalPayable: 0, totalInterest: 0 },
        { id: `offer_${Date.now()}_3`, loanAmount: parseFloat(formData.monthlyIncome || '50000') * 20, tenureMonths: 24, interestRate: 10.0, emi: Math.round(parseFloat(formData.monthlyIncome || '50000') * 20 * 0.0461), eligibilityStatus: 'approved', conditions: ['Income verification required'], totalPayable: 0, totalInterest: 0 },
      ].map(o => ({ ...o, totalPayable: o.emi * o.tenureMonths, totalInterest: o.emi * o.tenureMonths - o.loanAmount }))

      setTimeout(() => goToOffers(simulatedOffers), 4500)
    }
  }, [formData, session, apiBase, updateSession, goToOffers])

  return (
    <div>
      {/* Stepper */}
      <div className="stepper">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.num}>
            <div className="stepper-step">
              <div className={`stepper-circle ${step === s.num ? 'active' : step > s.num ? 'completed' : ''}`}>
                {step > s.num ? '✓' : s.num}
              </div>
              <span className={`stepper-label ${step >= s.num ? 'active' : ''}`}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`stepper-line ${step > s.num ? 'completed' : ''}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Personal Details */}
      {step === 1 && (
        <div className="glass-card page-enter" style={{ maxWidth: '700px', margin: '0 auto' }}>
          {/* Welcome section */}
          <div className="welcome-section" style={{ padding: '1rem 0 2rem' }}>
            <div className="welcome-icon">🏦</div>
            <h1 className="welcome-title">
              Instant Loan via <span className="welcome-highlight">Video KYC</span>
            </h1>
            <p className="welcome-desc">
              Complete your loan application in minutes with our AI-powered video onboarding.
              No paperwork. No branch visits. Real-time offers.
            </p>

            <div className="features-grid">
              <div className="feature-item">
                <div className="feature-icon">📹</div>
                <div className="feature-name">Video Call</div>
                <div className="feature-desc">Live verification</div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">🤖</div>
                <div className="feature-name">AI Analysis</div>
                <div className="feature-desc">Intelligent decisioning</div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">⚡</div>
                <div className="feature-name">Instant Offers</div>
                <div className="feature-desc">Get offers in minutes</div>
              </div>
            </div>
          </div>

          {/* Form */}
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
            Your Details
          </h2>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input
                className="form-input"
                type="text" name="firstName" placeholder="Enter first name"
                value={formData.firstName} onChange={handleInputChange}
              />
              {errors.firstName && <span style={{ color: 'var(--accent-red)', fontSize: '0.75rem' }}>{errors.firstName}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input
                className="form-input"
                type="text" name="lastName" placeholder="Enter last name"
                value={formData.lastName} onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number *</label>
            <input
              className="form-input"
              type="tel" name="phoneNumber" placeholder="Enter 10-digit phone number"
              value={formData.phoneNumber} onChange={handleInputChange}
              maxLength={15}
            />
            {errors.phoneNumber && <span style={{ color: 'var(--accent-red)', fontSize: '0.75rem' }}>{errors.phoneNumber}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Employment Status *</label>
              <select className="form-select" name="employmentStatus" value={formData.employmentStatus} onChange={handleInputChange}>
                <option value="">Select status</option>
                <option value="employed">Salaried / Employed</option>
                <option value="self-employed">Self-Employed</option>
                <option value="government">Government Employee</option>
                <option value="student">Student</option>
                <option value="unemployed">Unemployed</option>
              </select>
              {errors.employmentStatus && <span style={{ color: 'var(--accent-red)', fontSize: '0.75rem' }}>{errors.employmentStatus}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Monthly Income (₹) *</label>
              <input
                className="form-input"
                type="number" name="monthlyIncome" placeholder="e.g. 50000"
                value={formData.monthlyIncome} onChange={handleInputChange}
              />
              {errors.monthlyIncome && <span style={{ color: 'var(--accent-red)', fontSize: '0.75rem' }}>{errors.monthlyIncome}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Loan Purpose *</label>
            <select className="form-select" name="loanPurpose" value={formData.loanPurpose} onChange={handleInputChange}>
              <option value="">Select purpose</option>
              <option value="personal">Personal Loan</option>
              <option value="home">Home Renovation</option>
              <option value="education">Education</option>
              <option value="business">Business Expansion</option>
              <option value="vehicle">Vehicle Purchase</option>
              <option value="medical">Medical Emergency</option>
              <option value="wedding">Wedding</option>
            </select>
            {errors.loanPurpose && <span style={{ color: 'var(--accent-red)', fontSize: '0.75rem' }}>{errors.loanPurpose}</span>}
          </div>

          <button className="btn btn-primary btn-lg btn-block" onClick={startVideoCall} style={{ marginTop: '1rem' }}>
            📹 Start Video KYC
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
            By proceeding, you consent to video recording and AI-based verification
          </p>
        </div>
      )}

      {/* Step 2: Video Call */}
      {step === 2 && (
        <div className="page-enter">
          <VideoCall
            sessionId={session.sessionId}
            customerName={`${formData.firstName} ${formData.lastName}`.trim()}
            onComplete={handleVideoComplete}
          />
        </div>
      )}

      {/* Step 3: Processing */}
      {step === 3 && (
        <div className="page-enter">
          <ProcessingView />
        </div>
      )}
    </div>
  )
}

export default OnboardingFlow
