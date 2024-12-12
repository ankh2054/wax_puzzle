'use client'

import { useState } from 'react'
import { sendMessage, createUserMessage } from '@/lib/gptApi'
import { validateChallenge } from '@/lib/challengeValidation'

interface ChallengeInputProps {
  onSuccess: () => void;
  onError: (message: string) => void;
  challengeNumber: number;
}

export default function ChallengeInput({ onSuccess, onError, challengeNumber }: ChallengeInputProps) {
  const [input, setInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [response, setResponse] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isSubmitting) return

    // Clear previous errors
    setValidationError(null)
    
    // Validate input based on challenge rules
    const validation = validateChallenge(challengeNumber, input)
    if (!validation.isValid) {
      setValidationError(validation.error || 'Invalid input')
      return
    }

    setIsSubmitting(true)
    setResponse('')

    try {
      const result = await sendMessage({
        messages: [createUserMessage(input)],
      })

      setResponse(result.explanation)

      if (result.decision) {
        onSuccess()
      }
    } catch (error) {
      onError('Failed to submit answer. Please try again.')
      console.error('Challenge submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            setValidationError(null) // Clear validation error when input changes
          }}
          placeholder={`Enter your answer for Challenge ${challengeNumber}...`}
          className="w-full h-32 p-4 bg-black/20 backdrop-blur-sm rounded-lg text-[#ff6b00] placeholder-[#ff6b00]/50"
          style={{ fontFamily: '"Press Start 2P", cursive' }}
          disabled={isSubmitting}
        />
        
        {validationError && (
          <div 
            className="text-red-500 text-sm"
            style={{ fontFamily: '"Press Start 2P", cursive' }}
          >
            {validationError}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2 bg-[#ff6b00] text-black rounded-lg hover:bg-[#ff8533] transition-colors disabled:opacity-50"
          style={{ fontFamily: '"Press Start 2P", cursive' }}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Answer'}
        </button>
      </form>

      {response && (
        <div 
          className="p-4 bg-black/20 backdrop-blur-sm rounded-lg text-[#ff6b00]"
          style={{ fontFamily: '"Press Start 2P", cursive' }}
        >
          <h3 className="font-bold mb-2">AI Response:</h3>
          <p>{response}</p>
        </div>
      )}
    </div>
  )
} 