import type { MoveType } from '../engine/types'
import { MOVE_TYPES, MOVE_TYPE_INFO } from '../engine/types'

interface MoveTypeTogglesProps {
  activeMoveTypes: Set<MoveType>
  onToggle: (moveType: MoveType) => void
}

export default function MoveTypeToggles({ activeMoveTypes, onToggle }: MoveTypeTogglesProps) {
  return (
    <div className="move-toggles">
      {MOVE_TYPES.map(mt => {
        const info = MOVE_TYPE_INFO[mt]
        const active = activeMoveTypes.has(mt)
        return (
          <button
            key={mt}
            className={`move-toggle ${active ? 'active' : ''}`}
            style={{
              borderColor: info.color,
              backgroundColor: active ? info.color : 'transparent',
              color: active ? '#fff' : info.color,
            }}
            onClick={() => onToggle(mt)}
          >
            {info.label}
          </button>
        )
      })}
    </div>
  )
}
