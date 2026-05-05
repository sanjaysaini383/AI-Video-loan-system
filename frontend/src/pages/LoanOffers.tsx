import React, { useState } from 'react'

interface Props {
  offers: any[]
  apiBase: string
}

export const LoanOffers: React.FC<Props> = ({ offers, apiBase }) => {
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set())

  const acceptOffer = async (offerId: string) => {
    if (acceptedIds.has(offerId)) return

    try {
      await fetch(`${apiBase}/api/offers/${offerId}/accept`, { method: 'POST' })
    } catch { /* API may not be running */ }

    setAcceptedIds(prev => new Set([...prev, offerId]))
  }

  const formatCurrency = (val: number): string => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`
    return `₹${val.toLocaleString('en-IN')}`
  }

  const formatAmount = (val: number): string => {
    return `₹${val.toLocaleString('en-IN')}`
  }

  if (!offers || offers.length === 0) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Offers Yet</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Complete the video KYC onboarding to receive personalized loan offers.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="offers-header">
        <h1 className="offers-title">Your Loan Offers</h1>
        <p className="offers-subtitle">
          {offers.length} personalized offer{offers.length !== 1 ? 's' : ''} based on your profile
        </p>
      </div>

      <div className="offers-grid">
        {offers.map((offer, index) => (
          <div key={offer.id || index} className={`offer-card ${index === 0 ? 'recommended' : ''}`}>
            {/* Badge */}
            <span className={`offer-badge ${offer.eligibilityStatus === 'approved' ? 'approved' : 'conditional'}`}>
              {offer.eligibilityStatus === 'approved' ? '✓ Approved' : '⚠ Conditional'}
            </span>

            {index === 0 && (
              <div style={{
                fontSize: '0.65rem', fontWeight: 700, color: 'var(--accent-cyan)',
                textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem'
              }}>
                ⭐ Best Match
              </div>
            )}

            {/* Amount */}
            <div className="offer-amount">
              <span className="offer-currency">₹</span>
              {offer.loanAmount >= 100000
                ? `${(offer.loanAmount / 100000).toFixed(offer.loanAmount % 100000 === 0 ? 0 : 1)}L`
                : offer.loanAmount.toLocaleString('en-IN')
              }
            </div>

            {/* Details Grid */}
            <div className="offer-details">
              <div className="offer-detail">
                <div className="offer-detail-value">{offer.interestRate}%</div>
                <div className="offer-detail-label">Interest Rate</div>
              </div>
              <div className="offer-detail">
                <div className="offer-detail-value">{offer.tenureMonths} mo</div>
                <div className="offer-detail-label">Tenure</div>
              </div>
              <div className="offer-detail">
                <div className="offer-detail-value">{formatCurrency(offer.emi)}</div>
                <div className="offer-detail-label">Monthly EMI</div>
              </div>
              <div className="offer-detail">
                <div className="offer-detail-value">
                  {offer.totalInterest ? formatCurrency(offer.totalInterest) : formatCurrency(offer.emi * offer.tenureMonths - offer.loanAmount)}
                </div>
                <div className="offer-detail-label">Total Interest</div>
              </div>
            </div>

            {/* Conditions */}
            {offer.conditions && offer.conditions.length > 0 && (
              <div className="offer-conditions">
                <div className="offer-conditions-title">⚠ Conditions</div>
                {offer.conditions.map((condition: string, idx: number) => (
                  <div key={idx} className="offer-condition-item">
                    <span>•</span> {condition}
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            {acceptedIds.has(offer.id) ? (
              <div className="offer-accepted">✓ Offer Accepted</div>
            ) : (
              <div className="offer-actions">
                <button className="btn btn-success" style={{ flex: 1 }} onClick={() => acceptOffer(offer.id)}>
                  Accept Offer
                </button>
                <button className="btn btn-outline" style={{ flex: 0 }}>
                  Details
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="glass-card" style={{ marginTop: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          💡 Offers expire in 48 hours. Accept your preferred offer to proceed with loan disbursement.
        </p>
      </div>
    </div>
  )
}

export default LoanOffers
