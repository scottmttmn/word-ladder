import type { MoveType } from '../engine/types'
import { MOVE_TYPE_INFO } from '../engine/types'

interface MoveTypeBadgeProps {
  moveType: MoveType
  animated?: boolean
}

export default function MoveTypeBadge({ moveType, animated }: MoveTypeBadgeProps) {
  const info = MOVE_TYPE_INFO[moveType]
  return (
    <div
      className={`move-badge ${animated ? 'badge-pop' : ''}`}
      style={{ backgroundColor: info.color }}
      title={info.label}
    >
      {info.label}
    </div>
  )
}
