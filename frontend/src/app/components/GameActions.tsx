import React, { useState } from 'react'
import Modal from './Modal'

const API_URL = 'https://testnet.waxsweden.org'
const BACKEND_URL = 'http://localhost:3001'

export default function GameActions({ session, entryCost }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMessage, setModalMessage] = useState('')

  const waxCostAmount = 10;

  const handleAction = async (endpoint: string, data: any) => {
    if (!session) {
      setError('Not authenticated')
      return null
    }

    setLoading(true)
    setError('')
    try {
      const actions = [{
        account: 'sentnlagents',
        name: 'validateqfee',
        authorization: [{
          actor: session.actor,
          permission: session.permission
        }],
        data: {
          user: session.actor,
          fee: `${waxCostAmount}.00000000 WAX`
        }
      }]

      const result = await session.transact({ actions })
      
      // Get transaction ID from response and signature from signatures array
      const transactionId = result.response?.transaction_id
      const signature = result.signatures?.[0]

      if (!transactionId || !signature) {
        console.error('Missing transaction data:', { transactionId, signature })
        throw new Error('Invalid transaction result')
      }
      
      const token = `${transactionId}:${signature}`
      return token

    } catch (err: any) {
      console.error('Failed to get auth token:', err)
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  const updateChallenge = async (challengeId: number, correctAnswer: boolean) => {
    try {
      const authToken = await handleAction('verify', {})
      if (!authToken) {
        console.error('Failed to get auth token')
        return
      }
      
      // Deduct entry fee for playing the game
      await fetch(`${BACKEND_URL}/useEntry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          user: session.actor,
          entryAmount: entryCost
        })
      });
      
      // If answer is correct, update the challenge for chall
      if (correctAnswer) {
        const response = await fetch(`${BACKEND_URL}/updateChallenge`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
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
      } else {
        setModalMessage('Answer incorrect')
        setIsModalOpen(true)
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
          quantity: `${waxCostAmount}.00000000 WAX`,
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
        <h3 className="text-lg font-bold">Ask </h3>
        <button
          onClick={() => updateChallenge(3, false)}
          className="block w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Ask Question
        </button>
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
          {`Buy Ticket (${waxCostAmount} WAX)`}
        </button>
      </div>

      {loading && <p className="text-blue-500">Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} message={modalMessage} />
    </div>
  )
} 