'use client'

import { useState, useEffect } from 'react'

interface TypewriterTextProps {
  texts: string[]
  onComplete?: () => void
}

export default function TypewriterText({ texts, onComplete }: TypewriterTextProps) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  const [displayedTexts, setDisplayedTexts] = useState<string[]>([])
  const [currentTypingText, setCurrentTypingText] = useState('')
  const [isTyping, setIsTyping] = useState(true)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !isTyping && currentTextIndex < texts.length - 1) {
        event.preventDefault()
        event.stopPropagation()
        setDisplayedTexts([...displayedTexts, texts[currentTextIndex]])
        setCurrentTextIndex(prev => prev + 1)
        setCurrentTypingText('')
        setIsTyping(true)
        setShowPrompt(false)
      }
    }

    window.addEventListener('keydown', handleKeyPress, true)
    return () => window.removeEventListener('keydown', handleKeyPress, true)
  }, [currentTextIndex, isTyping, texts, displayedTexts])

  useEffect(() => {
    if (currentTextIndex >= texts.length) {
      onComplete?.()
      return
    }

    const currentFullText = texts[currentTextIndex]
    if (!isTyping) {
      if (currentTextIndex < texts.length - 1) {
        setShowPrompt(true)
      }
      return
    }

    if (currentTypingText.length < currentFullText.length) {
      const timeout = setTimeout(() => {
        setCurrentTypingText(currentFullText.slice(0, currentTypingText.length + 1))
      }, 50)
      return () => clearTimeout(timeout)
    } else {
      setIsTyping(false)
    }
  }, [currentTextIndex, currentTypingText, texts, isTyping, onComplete])

  return (
    <div className="text-[#ff6b00]" style={{ fontFamily: '"Press Start 2P", cursive' }}>
      {displayedTexts.map((text, index) => (
        <p key={index} className="mb-4 text-sm leading-8">{text}</p>
      ))}
      {currentTypingText && (
        <p className="mb-4 text-sm leading-8">{currentTypingText}</p>
      )}
      {showPrompt && (
        <p className="text-sm leading-8 animate-pulse">Press Enter to continue...</p>
      )}
    </div>
  )
} 