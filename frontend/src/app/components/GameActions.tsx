import { useState } from 'react'

const API_URL = 'https://testnet.waxsweden.org'
const BACKEND_URL = 'http://localhost:3001'

export default function GameActions({ session }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAction = async (endpoint: string, data: any) => {
    if (!session) {
      setError('Not authenticated')
      return
    }

    setLoading(true)
    setError('')
    try {
      // Create a dummy action to sign
      const action = {
        account: 'sentnlagents',
        name: 'verify',
        authorization: [{
          actor: session.actor,
          permission: session.permission
        }],
        data: {
          user: session.actor,
          timestamp: Date.now()
        }
      }

      // Sign the action
      const result = await session.transact({ action })
      
      const response = await fetch(`${API_URL}/${endpoint}`, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${result.request.encode()}:${result.signatures[0]}`
        },
        body: JSON.stringify(data),
      })
      
      return response;
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const updateChallenge = async (challengeId: number) => {
    try {
      const response = await fetch(`${BACKEND_URL}/updateChallenge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': await handleAction('verify', {})
        },
        body: JSON.stringify({
          user: session.actor,
          challengeId
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (err: any) {
      setError(err.message);
    }
  }

  const validateFee = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/validateFee`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': await handleAction('verify', {})
        },
        body: JSON.stringify({
          user: session.actor,
          fee: '1.0000 WAX'
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (err: any) {
      setError(err.message);
    }
  }

  const transfer = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': await handleAction('verify', {})
        },
        body: JSON.stringify({
          user: session.actor
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (err: any) {
      setError(err.message);
    }
  }

  const buyTickets = async () => {
    if (!session) return;
    
    try {
      setLoading(true);
      const action = {
        account: 'eosio.token',
        name: 'transfer',
        authorization: [{
          actor: session.actor,
          permission: session.permission
        }],
        data: {
          from: session.actor,
          to: 'sentnlagents',
          quantity: '1.00000000 WAX',
          memo: 'Ticket purchase'
        }
      };

      const result = await session.transact({
        actions: [action]
      });

      console.log('Transaction complete:', result);
    } catch (err: any) {
      console.error('Transaction error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
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

        <button
          onClick={buyTickets}
          className="block w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Buy Ticket (1 WAX)
        </button>
      </div>

      {loading && <p className="text-blue-500">Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
    </div>
  )
} 