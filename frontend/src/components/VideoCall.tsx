import React, { useState, useEffect, useRef } from 'react'
import io from 'socket.io-client'

interface VideoCallProps {
  sessionId: string
}

export const VideoCall: React.FC<VideoCallProps> = ({ sessionId }) => {
  const [connected, setConnected] = useState(false)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const socketRef = useRef<any>(null)

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io('http://localhost:3001')

    socketRef.current.on('connect', () => {
      console.log('Connected to session service')
      setConnected(true)
      socketRef.current.emit('join-session', sessionId)
    })

    socketRef.current.on('sdp-offer', handleSdpOffer)
    socketRef.current.on('sdp-answer', handleSdpAnswer)
    socketRef.current.on('ice-candidate', handleIceCandidate)

    return () => {
      socketRef.current?.disconnect()
    }
  }, [sessionId])

  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      })
      setLocalStream(stream)
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error('Error accessing media devices:', error)
    }
  }

  const handleSdpOffer = (data: any) => {
    console.log('Received SDP offer:', data)
    // TODO: Implement WebRTC answer logic
  }

  const handleSdpAnswer = (data: any) => {
    console.log('Received SDP answer:', data)
    // TODO: Implement WebRTC answer handling
  }

  const handleIceCandidate = (data: any) => {
    console.log('Received ICE candidate:', data)
    // TODO: Implement ICE candidate handling
  }

  return (
    <div className="video-call-container">
      <h2>Video Call Session: {sessionId}</h2>
      <div className="video-container">
        <div className="video-stream">
          <video ref={localVideoRef} autoPlay muted playsInline />
          <p>Local Stream</p>
        </div>
        <div className="video-stream">
          <video ref={remoteVideoRef} autoPlay playsInline />
          <p>Remote Stream</p>
        </div>
      </div>
      <button onClick={startLocalStream}>Start Camera</button>
      <p>Status: {connected ? 'Connected' : 'Connecting...'}</p>
    </div>
  )
}

export default VideoCall
