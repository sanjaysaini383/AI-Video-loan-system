import React, { useEffect, useState } from 'react'
import axios from 'axios'

export const LoanOffers: React.FC = () => {
  const [offers, setOffers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const response = await axios.get('/api/offers')
        setOffers(response.data)
      } catch (error) {
        console.error('Error fetching offers:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchOffers()
  }, [])

  const acceptOffer = async (offerId: string) => {
    try {
      await axios.post(`/api/offers/${offerId}/accept`)
      alert('Offer accepted!')
    } catch (error) {
      console.error('Error accepting offer:', error)
    }
  }

  if (loading) return <div>Loading offers...</div>

  return (
    <div className="offers-container">
      <h1>Your Loan Offers</h1>
      <div className="offers-list">
        {offers.map(offer => (
          <div key={offer.id} className="offer-card">
            <h3>Loan Amount: ₹{offer.loanAmount}</h3>
            <p>Tenure: {offer.tenureMonths} months</p>
            <p>Interest Rate: {offer.interestRate}%</p>
            <p>Monthly EMI: ₹{offer.emi}</p>
            <p>Status: {offer.eligibilityStatus}</p>
            {offer.conditions && offer.conditions.length > 0 && (
              <div>
                <h4>Conditions:</h4>
                <ul>
                  {offer.conditions.map((condition, idx) => (
                    <li key={idx}>{condition}</li>
                  ))}
                </ul>
              </div>
            )}
            <button onClick={() => acceptOffer(offer.id)}>Accept Offer</button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default LoanOffers
