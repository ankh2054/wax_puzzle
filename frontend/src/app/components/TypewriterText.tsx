import { useState, useEffect, useRef } from 'react'

interface TypewriterTextProps {
  texts: string[]
  onComplete?: () => void
}

export default function TypewriterText({ texts, onComplete }: TypewriterTextProps) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  const [displayedTexts, setDisplayedTexts] = useState<string[]>([])
  const [currentTypingText, setCurrentTypingText] = useState('')
  const [showCursor, setShowCursor] = useState(true)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isTypingComplete, setIsTypingComplete] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleContinue = () => {
    if (isTypingComplete) {
      setDisplayedTexts(prev => [...prev, currentTypingText])
      
      if (currentTextIndex < texts.length - 1) {
        setCurrentTextIndex(prev => prev + 1)
        setCurrentTypingText('')
        setIsTypingComplete(false)
        setShowPrompt(false)
      } else {
        onComplete?.()
      }
    }
  }

  useEffect(() => {
    const text = texts[currentTextIndex]
    if (currentTypingText.length < text.length) {
      const timer = setTimeout(() => {
        setCurrentTypingText(text.slice(0, currentTypingText.length + 1))
      }, 50) // Typing speed
      return () => clearTimeout(timer)
    } else {
      setIsTypingComplete(true)
      setShowPrompt(true)
    }
  }, [currentTypingText, currentTextIndex, texts])

  useEffect(() => {
    const cursorTimer = setInterval(() => {
      setShowCursor(prev => !prev)
    }, 500) // Cursor blink speed
    return () => clearInterval(cursorTimer)
  }, [])

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [displayedTexts, currentTypingText])

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        event.stopPropagation()
        handleContinue()
      }
    }

    window.addEventListener('keypress', handleKeyPress, true)
    return () => window.removeEventListener('keypress', handleKeyPress, true)
  }, [isTypingComplete, currentTextIndex, texts, onComplete, currentTypingText])

  return (
    <div 
      ref={containerRef}
      className="font-mono max-h-[400px] overflow-y-auto custom-scrollbar"
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#ff6b00 transparent'
      }}
    >
      {displayedTexts.map((text, index) => (
        <p 
          key={index}
          className="text-[#ff6b00] text-sm mb-4"
          style={{ fontFamily: '"Press Start 2P", cursive' }}
        >
          {text}
        </p>
      ))}
      <p className="text-[#ff6b00] text-sm mb-2" style={{ fontFamily: '"Press Start 2P", cursive' }}>
        {currentTypingText}
        {showCursor && <span className="opacity-100">_</span>}
      </p>
      {showPrompt && (
        <button 
          onClick={handleContinue}
          className="text-[#ff6b00] text-xs mt-4 animate-pulse hover:text-white focus:text-white transition-colors cursor-pointer"
          style={{ fontFamily: '"Press Start 2P", cursive' }}
        >
          Press ENTER or tap here to continue...
        </button>
      )}
    </div>
  )
} 