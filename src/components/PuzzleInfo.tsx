import type { Puzzle } from '../engine/types'

interface PuzzleInfoProps {
  puzzle: Puzzle
  moveCount: number
  dailyDate?: string
}

export default function PuzzleInfo({ puzzle, moveCount, dailyDate }: PuzzleInfoProps) {
  return (
    <div className="puzzle-info">
      {dailyDate && <div className="daily-date">{dailyDate}</div>}
      <div className="puzzle-words">
        <span className="puzzle-word start">{puzzle.startWord.toUpperCase()}</span>
        <span className="puzzle-arrow">&rarr;</span>
        <span className="puzzle-word end">{puzzle.endWord.toUpperCase()}</span>
      </div>
      <div className="puzzle-stats">
        <span className="stat">
          Moves: <strong>{moveCount}</strong>
        </span>
        <span className="stat">
          Optimal: <strong>{puzzle.optimalLength > 0 ? puzzle.optimalLength : '?'}</strong>
        </span>
      </div>
    </div>
  )
}
