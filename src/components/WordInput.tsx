import { useState, useRef, useEffect } from 'react'

interface WordInputProps {
  onSubmit: (word: string) => void
  error: string | null
  disabled?: boolean
}

export default function WordInput({ onSubmit, error, disabled }: WordInputProps) {
  const [value, setValue] = useState('')
  const [shake, setShake] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const prevError = useRef(error)

  useEffect(() => {
    if (error && error !== prevError.current) {
      setShake(true)
      const timer = setTimeout(() => setShake(false), 500)
      return () => clearTimeout(timer)
    }
    prevError.current = error
  }, [error])

  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus()
    }
  }, [disabled])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value.trim() && !disabled) {
      onSubmit(value.trim())
      setValue('')
    }
  }

  return (
    <form className="word-input-form" onSubmit={handleSubmit}>
      <div className={`word-input-wrapper ${shake ? 'shake' : ''}`}>
        <input
          ref={inputRef}
          type="text"
          className="word-input"
          value={value}
          onChange={e => setValue(e.target.value.toLowerCase())}
          placeholder="Enter a word..."
          disabled={disabled}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        <button type="submit" className="submit-btn" disabled={disabled || !value.trim()}>
          Go
        </button>
      </div>
      {error && <div className="input-error">{error}</div>}
    </form>
  )
}
