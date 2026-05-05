import React, { useState, useEffect } from 'react'

const STAGES = [
    { id: 'stt', icon: '🎤', name: 'Speech Analysis', desc: 'Processing your verbal responses' },
    { id: 'llm', icon: '🤖', name: 'AI Intelligence', desc: 'Analyzing conversation context' },
    { id: 'risk', icon: '🛡️', name: 'Risk Assessment', desc: 'Evaluating credit & fraud signals' },
    { id: 'offer', icon: '💰', name: 'Offer Generation', desc: 'Creating personalized loan offers' },
]

const ProcessingView: React.FC = () => {
    const [activeStage, setActiveStage] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveStage(prev => {
                if (prev >= STAGES.length - 1) {
                    clearInterval(interval)
                    return prev
                }
                return prev + 1
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    return (
        <div className="glass-card processing-container">
            <div className="processing-title">Processing Your Application</div>
            <p className="processing-subtitle">
                Our AI is analyzing your video session and generating personalized offers
            </p>

            <div className="processing-stages">
                {STAGES.map((stage, i) => (
                    <div
                        key={stage.id}
                        className={`processing-stage ${i === activeStage ? 'active' : i < activeStage ? 'completed' : ''}`}
                    >
                        <div className="processing-stage-icon">{stage.icon}</div>
                        <div className="processing-stage-text">
                            <div className="processing-stage-name">{stage.name}</div>
                            <div className="processing-stage-desc">{stage.desc}</div>
                        </div>
                        {i === activeStage && <div className="processing-spinner" />}
                        {i < activeStage && (
                            <span style={{ color: 'var(--accent-green)', fontWeight: 700, fontSize: '1.1rem' }}>✓</span>
                        )}
                    </div>
                ))}
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2rem' }}>
                This usually takes less than 30 seconds...
            </p>
        </div>
    )
}

export default ProcessingView
