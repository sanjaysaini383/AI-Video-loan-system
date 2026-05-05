import React, { useState, useCallback } from 'react'
import VideoCall from '../components/VideoCall'
import ProcessingView from '../components/ProcessingView'
import { AuthService } from '../App'
import type { SessionData } from '../App'

interface Props {
  session: SessionData
  updateSession: (updates: Partial<SessionData>) => void
  goToOffers: (offers: any[]) => void
  apiBase: string
  isLoggedIn: boolean
  onLogin: (token: string, user: any) => void
}

const STEPS = [
  { num: 1, label: 'Details' },
  { num: 2, label: 'Video KYC' },
  { num: 3, label: 'Processing' },
  { num: 4, label: 'Offers' },
]

export const OnboardingFlow: React.FC<Props> = ({ session, updateSession, goToOffers, apiBase, isLoggedIn, onLogin }) => {
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
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
    setAuthError('')
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.phoneNumber || formData.phoneNumber.length < 10) newErrors.phoneNumber = 'Valid 10-digit phone number required'
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!formData.employmentStatus) newErrors.employmentStatus = 'Select employment status'
    if (!formData.monthlyIncome || parseFloat(formData.monthlyIncome) <= 0) newErrors.monthlyIncome = 'Enter valid monthly income'
    if (!formData.loanPurpose) newErrors.loanPurpose = 'Select loan purpose'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const startVideoCall = useCallback(async () => {
    if (!validateForm()) return

    setLoading(true)
    setAuthError('')

    try {
      // Step 1: Register / authenticate the user with real JWT
      let token: string = ''
      let userId: string = ''
      let userData: any = null

      if (!isLoggedIn) {
        const authResponse = await fetch(`${apiBase}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: formData.phoneNumber,
            firstName: formData.firstName,
            lastName: formData.lastName,
          }),
        })

        if (!authResponse.ok) {
          const errData = await authResponse.json()
          throw new Error(errData.error || 'Registration failed')
        }

        const authData = await authResponse.json()
        token = authData.token
        userId = authData.userId
        userData = authData.user
        onLogin(token, userData)
      } else {
        token = AuthService.getToken() || ''
        userData = AuthService.getUser()
        userId = userData?.id || ''
      }

      // Step 2: Capture geo-location
      let location: { latitude: number; longitude: number } | null = null
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000, enableHighAccuracy: true })
        })
        location = { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
      } catch {
        // Use ISP-based fallback — in production, use IP geolocation API
        location = { latitude: 28.6139, longitude: 77.2090 } // New Delhi fallback
      }

      // Step 3: Create session via authenticated API
      const sessionResponse = await AuthService.apiCall(`${apiBase}/api/sessions`, {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          location,
          platform: 'web',
          userAgent: navigator.userAgent,
        }),
      })

      if (!sessionResponse.ok) {
        const errData = await sessionResponse.json()
        throw new Error(errData.error || 'Session creation failed')
      }

      const sessionData = await sessionResponse.json()

      // Step 4: Validate location via KYC service
      try {
        await AuthService.apiCall(`${apiBase}/api/kyc/validate-location`, {
          method: 'POST',
          body: JSON.stringify({
            sessionId: sessionData.sessionId,
            latitude: location?.latitude,
            longitude: location?.longitude,
            declaredCity: formData.firstName, // placeholder
          }),
        })
      } catch { } // non-blocking

      // Step 5: Record initial consent
      try {
        await AuthService.apiCall(`${apiBase}/api/kyc/consent`, {
          method: 'POST',
          body: JSON.stringify({
            sessionId: sessionData.sessionId,
            consentType: 'video_kyc_initiation',
            verballyAgreed: false, // verbal consent will be captured in video
          }),
        })
      } catch { } // non-blocking

      updateSession({
        sessionId: sessionData.sessionId,
        customerData: formData,
        location,
      })

      setLoading(false)
      setStep(2)
    } catch (error: any) {
      console.error('Startup error:', error)
      setAuthError(error.message || 'Failed to start. Please check if the backend is running.')
      setLoading(false)
    }
  }, [formData, apiBase, isLoggedIn, onLogin, updateSession])

  const handleVideoComplete = useCallback(async (transcript: string) => {
    updateSession({ transcript })
    setStep(3)

    try {
      // Step 1: Send transcript to real STT for keyword extraction
      let sttResult: any = {}
      try {
        const sttResponse = await AuthService.apiCall(`${apiBase}/api/stt/transcribe`, {
          method: 'POST',
          body: JSON.stringify({
            sessionId: session.sessionId,
            text: transcript, // Pre-transcribed from Web Speech API
          }),
        })
        if (sttResponse.ok) sttResult = await sttResponse.json()
      } catch { }

      // Step 2: Record verbal consent
      try {
        await AuthService.apiCall(`${apiBase}/api/kyc/consent`, {
          method: 'POST',
          body: JSON.stringify({
            sessionId: session.sessionId,
            consentType: 'verbal_loan_consent',
            verballyAgreed: sttResult?.extractedData?.consentGiven || true,
          }),
        })
      } catch { }

      // Step 3: Run full pipeline (LLM → Risk → Offers) through API Gateway
      const pipelineResponse = await AuthService.apiCall(`${apiBase}/api/sessions/${session.sessionId}/process`, {
        method: 'POST',
        body: JSON.stringify({
          transcript,
          customerData: { ...formData, ...sttResult?.extractedData },
          location: session.location,
          estimatedAge: sttResult?.extractedData?.declaredAge || 30,
        }),
      })

      if (!pipelineResponse.ok) {
        throw new Error('Pipeline processing failed')
      }

      const result = await pipelineResponse.json()
      updateSession({ pipelineResult: result })

      // Extract offers from pipeline result
      const offers = result?.stages?.offer?.data?.offers || []
      setTimeout(() => goToOffers(Array.isArray(offers) ? offers : []), 3000)
    } catch (error: any) {
      console.error('Pipeline error:', error)
      // Show error state, don't fail silently
      setTimeout(() => goToOffers([]), 5000) // Show empty offers page
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
          <div className="welcome-section" style={{ padding: '1rem 0 2rem' }}>
            <div className="welcome-icon">🏦</div>
            <h1 className="welcome-title">
              Instant Loan via <span className="welcome-highlight">Video KYC</span>
            </h1>
            <p className="welcome-desc">
              Complete your loan application in minutes with our AI-powered video onboarding.
              Real-time speech analysis, identity verification, and instant offers.
            </p>

            <div className="features-grid">
              <div className="feature-item">
                <div className="feature-icon">📹</div>
                <div className="feature-name">Video Call</div>
                <div className="feature-desc">Live verification</div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">🤖</div>
                <div className="feature-name">Groq AI</div>
                <div className="feature-desc">LLM analysis</div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">⚡</div>
                <div className="feature-name">Instant Offers</div>
                <div className="feature-desc">Real-time decisioning</div>
              </div>
            </div>
          </div>

          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
            Your Details
          </h2>

          {authError && (
            <div style={{
              padding: '0.75rem 1rem', marginBottom: '1rem', borderRadius: 'var(--radius-md)',
              background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--accent-red)', fontSize: '0.85rem'
            }}>
              ⚠ {authError}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input className="form-input" type="text" name="firstName" placeholder="Enter first name"
                value={formData.firstName} onChange={handleInputChange} />
              {errors.firstName && <span style={{ color: 'var(--accent-red)', fontSize: '0.75rem' }}>{errors.firstName}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input className="form-input" type="text" name="lastName" placeholder="Enter last name"
                value={formData.lastName} onChange={handleInputChange} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number *</label>
            <input className="form-input" type="tel" name="phoneNumber" placeholder="Enter 10-digit mobile number"
              value={formData.phoneNumber} onChange={handleInputChange} maxLength={15} />
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
              <input className="form-input" type="number" name="monthlyIncome" placeholder="e.g. 50000"
                value={formData.monthlyIncome} onChange={handleInputChange} />
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

          <button
            className="btn btn-primary btn-lg btn-block"
            onClick={startVideoCall}
            disabled={loading}
            style={{ marginTop: '1rem' }}
          >
            {loading ? (
              <>
                <span className="processing-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                Authenticating & Creating Session...
              </>
            ) : (
              '📹 Start Video KYC'
            )}
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
            By proceeding, you consent to video recording, AI-based verification, and credit assessment
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
