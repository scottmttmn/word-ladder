interface ExploreInfoProps {
  startWord: string
  currentWord: string
  moveCount: number
  remainingMoveCount: number
}

export default function ExploreInfo({
  startWord,
  currentWord,
  moveCount,
  remainingMoveCount,
}: ExploreInfoProps) {
  return (
    <div className="puzzle-info">
      <div className="explore-heading">Exploratory Run</div>
      <div className="explore-current">{currentWord.toUpperCase()}</div>
      <div className="puzzle-stats">
        <span className="stat">
          Start: <strong>{startWord.toUpperCase()}</strong>
        </span>
        <span className="stat">
          Moves: <strong>{moveCount}</strong>
        </span>
        <span className="stat">
          Remaining: <strong>{remainingMoveCount}</strong>
        </span>
      </div>
    </div>
  )
}
