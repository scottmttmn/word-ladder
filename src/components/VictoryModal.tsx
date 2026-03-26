import type { Puzzle, LadderStep, MoveType } from '../engine/types'
import { buildShareText } from '../engine/sharing'
import { useState } from 'react'
import type { ExploreEndedReason } from '../hooks/useGame'

interface VictoryModalProps {
  puzzle?: Puzzle
  ladder: LadderStep[]
  sharerMoveCount: number | null
  exploreEndedReason?: ExploreEndedReason
  onPlayAgain: () => void
  onMenu: () => void
  onReview: () => void
}

export default function VictoryModal({
  puzzle,
  ladder,
  sharerMoveCount,
  exploreEndedReason = null,
  onPlayAgain,
  onMenu,
  onReview,
}: VictoryModalProps) {
  const [copied, setCopied] = useState(false)
  const moveCount = ladder.length - 1
  const isExploration = !puzzle
  const isOptimal = puzzle ? moveCount === puzzle.optimalLength : false
  const beatSharer = sharerMoveCount !== null && moveCount < sharerMoveCount
  const tiedSharer = sharerMoveCount !== null && moveCount === sharerMoveCount

  const handleShare = async () => {
    if (!puzzle) return

    const moveTypeSequence = ladder
      .slice(1)
      .map(s => s.moveType)
      .filter((mt): mt is MoveType => mt !== null)

    const shareData = {
      startWord: puzzle.startWord,
      endWord: puzzle.endWord,
      activeMoveTypes: puzzle.activeMoveTypes,
      moveCount,
      moveTypeSequence,
    }

    const text = buildShareText(shareData, ladder, puzzle.optimalLength)

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="modal-overlay" onClick={onMenu}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 className="victory-title">
          {isExploration
            ? exploreEndedReason === 'stuck' ? "You're Stuck" : 'Run Complete'
            : isOptimal ? 'Perfect!' : beatSharer ? 'You Beat Them!' : tiedSharer ? 'You Matched Them!' : 'Well Done!'}
        </h2>
        <div className="victory-stats">
          <div className="victory-stat">
            <span className="stat-value">{moveCount}</span>
            <span className="stat-label">{isExploration ? 'Chain' : 'Moves'}</span>
          </div>
          {puzzle && (
            <div className="victory-stat">
              <span className="stat-value">{puzzle.optimalLength}</span>
              <span className="stat-label">Optimal</span>
            </div>
          )}
          {sharerMoveCount !== null && (
            <div className="victory-stat">
              <span className="stat-value">{sharerMoveCount}</span>
              <span className="stat-label">Friend</span>
            </div>
          )}
        </div>
        {isExploration && (
          <p className="victory-message">
            {exploreEndedReason === 'stuck'
              ? 'No unused valid moves remain from your current word.'
              : 'Your exploratory run has ended.'}
          </p>
        )}
        {!isExploration && isOptimal && (
          <p className="victory-message">You found the shortest path!</p>
        )}
        {!isExploration && !isOptimal && beatSharer && (
          <p className="victory-message">You beat your friend's score!</p>
        )}
        {!isExploration && !isOptimal && tiedSharer && (
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
          {puzzle && (
            <button className="btn btn-primary" onClick={handleShare}>
              {copied ? 'Copied!' : 'Share'}
            </button>
          )}
          <button className={puzzle ? 'btn btn-secondary' : 'btn btn-primary'} onClick={onPlayAgain}>
            {puzzle ? 'New Puzzle' : 'New Run'}
          </button>
          <button className="btn btn-ghost" onClick={onReview}>
            {puzzle ? 'View Puzzle' : 'Review Run'}
          </button>
          <button className="btn btn-ghost" onClick={onMenu}>
            Menu
          </button>
        </div>
      </div>
    </div>
  )
}
