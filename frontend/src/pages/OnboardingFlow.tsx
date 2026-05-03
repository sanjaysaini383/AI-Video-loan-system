import React, { useState } from 'react'
import axios from 'axios'

export const OnboardingFlow: React.FC = () => {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    phoneNumber: '',
    firstName: '',
    lastName: '',
    employmentStatus: '',
    monthlyIncome: '',
    loanPurpose: '',
  })
  const [sessionId, setSessionId] = useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const startSession = async () => {
    try {
      const response = await axios.post('/api/sessions', formData)
      setSessionId(response.data.sessionId)
      setStep(2)
    } catch (error) {
      console.error('Error starting session:', error)
    }
  }

  const completeOnboarding = async () => {
    try {
      const response = await axios.post('/api/sessions/{sessionId}/complete', {
        sessionId,
        formData,
      })
      console.log('Onboarding completed:', response.data)
      setStep(3)
    } catch (error) {
      console.error('Error completing onboarding:', error)
    }
  }

  return (
    <div className="onboarding-container">
      <h1>Digital Loan Onboarding</h1>

      {step === 1 && (
        <div className="form-step">
          <h2>Personal Information</h2>
          <input
            type="tel"
            name="phoneNumber"
            placeholder="Phone Number"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            required
          />
          <input
            type="text"
            name="firstName"
            placeholder="First Name"
            value={formData.firstName}
            onChange={handleInputChange}
            required
          />
          <input
            type="text"
            name="lastName"
            placeholder="Last Name"
            value={formData.lastName}
            onChange={handleInputChange}
          />
          <select name="employmentStatus" value={formData.employmentStatus} onChange={handleInputChange}>
            <option value="">Select Employment Status</option>
            <option value="employed">Employed</option>
            <option value="self-employed">Self-employed</option>
            <option value="unemployed">Unemployed</option>
          </select>
          <input
            type="number"
            name="monthlyIncome"
            placeholder="Monthly Income"
            value={formData.monthlyIncome}
            onChange={handleInputChange}
          />
          <select name="loanPurpose" value={formData.loanPurpose} onChange={handleInputChange}>
            <option value="">Select Loan Purpose</option>
            <option value="education">Education</option>
            <option value="home">Home</option>
            <option value="personal">Personal</option>
            <option value="business">Business</option>
          </select>
          <button onClick={startSession}>Start Video Call</button>
        </div>
      )}

      {step === 2 && sessionId && (
        <div className="video-step">
          <h2>Video Verification</h2>
          <p>Session ID: {sessionId}</p>
          {/* TODO: Embed VideoCall component here */}
          <button onClick={completeOnboarding}>Complete Verification</button>
        </div>
      )}

      {step === 3 && (
        <div className="confirmation-step">
          <h2>Onboarding Complete</h2>
          <p>Your application has been received. We will process it shortly.</p>
        </div>
      )}
    </div>
  )
}

export default OnboardingFlow
