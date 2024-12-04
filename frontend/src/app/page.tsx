'use client'

import WaxLogin from './components/WaxLogin'
import GameActions from './components/GameActions'
import { useState } from 'react'
import { Session } from '@wharfkit/session'

export default function Home() {
  const [session, setSession] = useState<Session | null>(null)

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">WAX Puzzle Game</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <WaxLogin onSessionUpdate={setSession} />
          <GameActions session={session} />
        </div>
      </div>
    </main>
  )
}



