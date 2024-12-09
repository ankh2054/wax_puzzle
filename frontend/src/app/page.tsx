'use client'

import WaxLogin from './components/WaxLogin'
import GameActions from './components/GameActions'
import TypewriterText from './components/TypewriterText'
import { useState, useRef, useEffect } from 'react'
import { Session, SessionKit } from '@wharfkit/session'
import { WebRenderer } from '@wharfkit/web-renderer'
import { WalletPluginAnchor } from '@wharfkit/wallet-plugin-anchor'

const webRenderer = new WebRenderer()
const sessionKit = new SessionKit({
  appName: 'WAX Puzzle Game',
  chains: [{
    id: process.env.NEXT_PUBLIC_WAX_CHAIN_ID!,
    url: process.env.NEXT_PUBLIC_WAX_RPC_URL!
  }],
  walletPlugins: [new WalletPluginAnchor()],
  ui: webRenderer
})

interface GameProgress {
  user: string;
  challenge1: boolean;
  challenge2: boolean;
  challenge3: boolean;
  game_entries: number;
}

export default function Home() {
  const [session, setSession] = useState<Session | null>(null)
  const [isMuted, setIsMuted] = useState(true)
  const [showLogin, setShowLogin] = useState(false)
  const [gameProgress, setGameProgress] = useState<GameProgress | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const audioRef = useRef<HTMLAudioElement>(null)

  const getTexts = (progress: GameProgress | null) => {
    if (!progress) {
      return [
        "In order to win the prize, you need to pass 3 challenges.",
        "The first challenge is to solve the riddle: What has keys, but no locks; space, but no room; and you can enter, but not go in?",
        "Please login and buy a ticket to play, each time you play you will use 1 ticket. Ticket prices cost 10 WAX"
      ]
    }

    if (progress.challenge2) {
      return [
        "Congratulations for passing Challenge 2!",
        "The third and final challenge is to solve this riddle: I am not alive, but I grow; I don't have lungs, but I need air; I don't have a mouth, but water kills me. What am I?",
        "Remember, each attempt costs 1 ticket."
      ]
    }

    if (progress.challenge1) {
      return [
        "Congratulations for passing Challenge 1!",
        "The second challenge is to solve this riddle: I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?",
        "Remember, each attempt costs 1 ticket."
      ]
    }

    return [
      "In order to win the prize, you need to pass 3 challenges.",
      "The first challenge is to solve the riddle: What has keys, but no locks; space, but no room; and you can enter, but not go in?",
      "Please login and buy a ticket to play, each time you play you will use 1 ticket. Ticket prices cost 10 WAX"
    ]
  }

  // Check for existing session on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const restored = await sessionKit.restore()
        if (restored) {
          setSession(restored)
        }
      } catch (err) {
        console.error('Failed to restore session:', err)
      } finally {
        setIsLoading(false)
      }
    }

    restoreSession()
  }, [])

  useEffect(() => {
    const fetchGameProgress = async () => {
      if (!session) return

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_WAX_RPC_URL}/v1/chain/get_table_rows`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            json: true,
            code: process.env.NEXT_PUBLIC_WAX_CONTRACT_ACCOUNT,
            scope: process.env.NEXT_PUBLIC_WAX_CONTRACT_ACCOUNT,
            table: 'games',
            lower_bound: session.actor.toString(),
            upper_bound: session.actor.toString(),
            limit: 1
          })
        })

        const data = await response.json()
        if (data.rows && data.rows.length > 0) {
          setGameProgress(data.rows[0])
          setShowLogin(true)
        }
      } catch (error) {
        console.error('Error fetching game progress:', error)
      }
    }

    fetchGameProgress()
  }, [session])

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

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#1a1a1a] relative flex items-center justify-center">
        <div className="text-[#ff6b00] text-xl" style={{ fontFamily: '"Press Start 2P", cursive' }}>
          Loading...
        </div>
      </main>
    )
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

      {/* Background Music */}
      <audio 
        ref={audioRef} 
        loop 
        preload="auto"
      >
        <source src="/sound/soundtrack.mp3" type="audio/mp3" />
      </audio>

      {/* Sound Control */}
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
                <TypewriterText texts={getTexts(gameProgress)} onComplete={() => setShowLogin(true)} />
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="w-80">
              <div className="bg-black/40 backdrop-blur-sm rounded-lg shadow-lg p-6 sticky top-8">
              <WaxLogin onSessionUpdate={setSession} session={session} />
                {session && <GameActions session={session} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}



