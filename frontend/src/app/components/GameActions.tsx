import { useState } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function GameActions({ session }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAction = async (endpoint: string, data: any) => {
    if (!session?.auth) {
      setError('Not authenticated')
      return
    }

    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_URL}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${session.actor} ${session.auth.signature}`
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Action failed')
      }
      
      const result = await response.json()
      return result
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const updateChallenge = async (challengeId: number) => {
    await handleAction('updateChallenge', {
      user: session.actor,
      challengeId
    })
  }

  const validateFee = async () => {
    await handleAction('validateFee', {
      user: session.actor,
      fee: '1.0000 WAX'
    })
  }

  const transfer = async () => {
    await handleAction('transfer', {
      user: session.actor
    })
  }

  if (!session) {
    return <p className="text-red-500">Please login first</p>
  }

  return (
    <div className="space-y-4 p-4">
      <div className="space-y-2">
        <h3 className="text-lg font-bold">Challenges</h3>
        {[1, 2, 3].map((id) => (
          <button
            key={id}
            onClick={() => updateChallenge(id)}
            className="block w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Complete Challenge {id}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <button
          onClick={validateFee}
          className="block w-full bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
        >
          Validate Fee
        </button>

        <button
          onClick={transfer}
          className="block w-full bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
        >
          Claim Prize
        </button>
      </div>

      {loading && <p className="text-blue-500">Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
    </div>
  )
} 