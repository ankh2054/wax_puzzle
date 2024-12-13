'use client'

import TypewriterText from './components/TypewriterText'
import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'

export default function Home() {
  const [isMuted, setIsMuted] = useState(true)
  const audioRef = useRef<HTMLAudioElement>(null)

  const texts = [
    "Three challenges stand between you and the ever-growing prize.",
    "The cost to enter is but a drop, yet each attempt feeds the swelling pot.",
    "If you dare to coax the forbidden words from the AI's metal tongue, its growing fortune shall be yours",
    "Launching in the first quarter of 2025…",
  ]

  // Update audio state when mute state changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted
      if (!isMuted) {
        audioRef.current.play().catch(console.error)
      }
    }
  }, [isMuted])

  const toggleSound = () => {
    setIsMuted(!isMuted)
  }

  return (
    <main className="min-h-screen bg-[#1a1a1a] relative">
      {/* Background Video */}
      <div className="absolute inset-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="object-cover w-full h-full"
        >
          <source src="/img/background_trimmed.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Logo */}
      <div className="fixed top-4 left-4 z-30">
        <Image
          src="/img/puzzle_logo.png"
          alt="Cipher Quest Logo"
          width={40}
          height={40}
          className="object-contain"
        />
      </div>

      {/* Background Music */}
      <audio 
        ref={audioRef} 
        loop 
        preload="auto"
      >
        <source src="/sound/soundtrack.mp3" type="audio/mp3" />
      </audio>

      {/* Sound Control - moved back to original position */}
      <button 
        onClick={toggleSound}
        className="fixed top-4 right-4 z-20 bg-black/40 backdrop-blur-sm p-2 rounded-full hover:bg-black/60 transition-colors"
        aria-label={isMuted ? "Unmute sound" : "Mute sound"}
      >
        {isMuted ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        )}
      </button>

      {/* Content Overlay */}
      <div className="relative z-10 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 
            className="text-6xl font-bold mb-8 text-[#ff6b00] text-center"
            style={{ fontFamily: '"Press Start 2P", cursive' }}
          >
            Cipher Quest
          </h1>
          
          <div className="flex gap-8">
            {/* Main Content */}
            <div className="flex-1">
              <div className="bg-black/40 backdrop-blur-sm rounded-lg shadow-lg p-6 mb-4">
                <TypewriterText texts={texts} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
