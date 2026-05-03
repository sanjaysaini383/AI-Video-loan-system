import React from 'react'
import OnboardingFlow from './pages/OnboardingFlow'
import LoanOffers from './pages/LoanOffers'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = React.useState('onboarding')

  return (
    <div className="App">
      <nav className="navbar">
        <button onClick={() => setCurrentPage('onboarding')}>Onboarding</button>
        <button onClick={() => setCurrentPage('offers')}>My Offers</button>
      </nav>

      <main>
        {currentPage === 'onboarding' && <OnboardingFlow />}
        {currentPage === 'offers' && <LoanOffers />}
      </main>
    </div>
  )
}

export default App
