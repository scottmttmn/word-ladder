import type { LadderStep, PlaySession } from '../engine/types'
import WordRow from './WordRow'
import MoveTypeBadge from './MoveTypeBadge'

interface LadderProps {
  ladder: LadderStep[]
  session: PlaySession
  interactive?: boolean
}

export default function Ladder({ ladder, session, interactive = true }: LadderProps) {
  const puzzle = session.kind === 'puzzle' ? session.puzzle : null
  const isComplete = puzzle ? ladder[ladder.length - 1]?.word === puzzle.endWord : false

  return (
    <div className="ladder">
      {ladder.map((step, i) => (
        <div key={i} className="ladder-step">
          {step.moveType && (
            <div className="ladder-connector">
              <div className="connector-line" />
              <MoveTypeBadge moveType={step.moveType} animated={interactive} />
              <div className="connector-line" />
            </div>
          )}
          <WordRow
            word={step.word}
            variant={i === 0 ? 'start' : puzzle && step.word === puzzle.endWord ? 'end' : 'default'}
            animated={interactive && i === ladder.length - 1 && i > 0}
          />
        </div>
      ))}

      {/* Show target word as ghost if not yet reached */}
      {puzzle && !isComplete && (
        <div className="ladder-step">
          <div className="ladder-connector">
            <div className="connector-line connector-line-dashed" />
            <div className="connector-dots">...</div>
            <div className="connector-line connector-line-dashed" />
          </div>
          <WordRow word={puzzle.endWord} variant="ghost" />
        </div>
      )}
    </div>
  )
}
