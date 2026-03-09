import type { Puzzle, LadderStep } from '../engine/types'
import { buildShareUrl } from '../engine/sharing'
import { useState } from 'react'

interface VictoryModalProps {
  puzzle: Puzzle
  ladder: LadderStep[]
  sharerMoveCount: number | null
  onPlayAgain: () => void
  onMenu: () => void
}

export default function VictoryModal({ puzzle, ladder, sharerMoveCount, onPlayAgain, onMenu }: VictoryModalProps) {
  const [copied, setCopied] = useState(false)
  const moveCount = ladder.length - 1
  const isOptimal = moveCount === puzzle.optimalLength
  const beatSharer = sharerMoveCount !== null && moveCount < sharerMoveCount
  const tiedSharer = sharerMoveCount !== null && moveCount === sharerMoveCount

  const handleShare = async () => {
    const url = buildShareUrl({
      startWord: puzzle.startWord,
      endWord: puzzle.endWord,
      activeMoveTypes: puzzle.activeMoveTypes,
      moveCount,
    })
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input')
      input.value = url
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="modal-overlay" onClick={onMenu}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 className="victory-title">
          {isOptimal ? 'Perfect!' : beatSharer ? 'You Beat Them!' : tiedSharer ? 'You Matched Them!' : 'Well Done!'}
        </h2>
        <div className="victory-stats">
          <div className="victory-stat">
            <span className="stat-value">{moveCount}</span>
            <span className="stat-label">Moves</span>
          </div>
          <div className="victory-stat">
            <span className="stat-value">{puzzle.optimalLength}</span>
            <span className="stat-label">Optimal</span>
          </div>
          {sharerMoveCount !== null && (
            <div className="victory-stat">
              <span className="stat-value">{sharerMoveCount}</span>
              <span className="stat-label">Friend</span>
            </div>
          )}
        </div>
        {isOptimal && (
          <p className="victory-message">You found the shortest path!</p>
        )}
        {!isOptimal && beatSharer && (
          <p className="victory-message">You beat your friend's score!</p>
        )}
        {!isOptimal && tiedSharer && (
          <p className="victory-message">You matched your friend's score!</p>
        )}
        <div className="victory-path">
          {ladder.map((step, i) => (
            <span key={i} className="victory-word">
              {step.word.toUpperCase()}
              {i < ladder.length - 1 && <span className="victory-arrow"> &rarr; </span>}
            </span>
          ))}
        </div>
        <div className="victory-actions">
          <button className="btn btn-primary" onClick={handleShare}>
            {copied ? 'Copied!' : 'Share'}
          </button>
          <button className="btn btn-secondary" onClick={onPlayAgain}>
            New Puzzle
          </button>
          <button className="btn btn-ghost" onClick={onMenu}>
            Menu
          </button>
        </div>
      </div>
    </div>
  )
}
