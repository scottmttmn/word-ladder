import { useState } from 'react'
import type { MoveType } from '../engine/types'
import MoveTypeToggles from './MoveTypeToggles'
import { formatDailyDate } from '../engine/daily'

interface MenuScreenProps {
  mode: 'daily' | 'freeplay'
  freeplayVariant: 'puzzle' | 'explore'
  difficulty: number
  activeMoveTypes: Set<MoveType>
  error: string | null
  onStartDaily: () => void
  onStartFreeplay: (customStart?: string, customEnd?: string) => void
  onStartExploration: (startWord: string) => void
  onSetFreeplayVariant: (variant: 'puzzle' | 'explore') => void
  onToggleMoveType: (mt: MoveType) => void
  onSetDifficulty: (d: number) => void
}

const DIFFICULTY_LABELS: Record<number, string> = {
  2: 'Very Easy',
  3: 'Easy',
  4: 'Medium',
  5: 'Hard',
  6: 'Very Hard',
  7: 'Expert',
}

export default function MenuScreen({
  mode,
  freeplayVariant,
  difficulty,
  activeMoveTypes,
  error,
  onStartDaily,
  onStartFreeplay,
  onStartExploration,
  onSetFreeplayVariant,
  onToggleMoveType,
  onSetDifficulty,
}: MenuScreenProps) {
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [exploreStart, setExploreStart] = useState('')
  const [useCustom, setUseCustom] = useState(false)

  const handleFreeplay = () => {
    if (useCustom && customStart && customEnd) {
      onStartFreeplay(customStart, customEnd)
    } else {
      onStartFreeplay()
    }
  }

  return (
    <div className="menu">
      {mode === 'daily' ? (
        <div className="menu-section">
          <h2 className="menu-heading">Daily Puzzle</h2>
          <p className="menu-date">{formatDailyDate(new Date())}</p>
          <button className="btn btn-primary btn-large" onClick={onStartDaily}>
            Play Today's Puzzle
          </button>
        </div>
      ) : (
        <div className="menu-section">
          <h2 className="menu-heading">Free Play</h2>

          <div className="mode-toggle freeplay-toggle">
            <button
              className={`mode-btn ${freeplayVariant === 'puzzle' ? 'active' : ''}`}
              onClick={() => onSetFreeplayVariant('puzzle')}
            >
              Puzzle
            </button>
            <button
              className={`mode-btn ${freeplayVariant === 'explore' ? 'active' : ''}`}
              onClick={() => onSetFreeplayVariant('explore')}
            >
              Exploratory
            </button>
          </div>

          {freeplayVariant === 'puzzle' ? (
            <>
              <div className="menu-option">
                <label className="menu-label">Difficulty (optimal path length)</label>
                <div className="difficulty-selector">
                  {[2, 3, 4, 5, 6, 7].map(d => (
                    <button
                      key={d}
                      className={`diff-btn ${difficulty === d ? 'active' : ''}`}
                      onClick={() => onSetDifficulty(d)}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                <span className="difficulty-label">{DIFFICULTY_LABELS[difficulty] ?? ''}</span>
              </div>

              <div className="menu-option">
                <label className="menu-label">
                  <input
                    type="checkbox"
                    checked={useCustom}
                    onChange={e => setUseCustom(e.target.checked)}
                  />
                  {' '}Custom words
                </label>
                {useCustom && (
                  <div className="custom-words">
                    <input
                      type="text"
                      className="custom-input"
                      placeholder="Start word"
                      value={customStart}
                      onChange={e => setCustomStart(e.target.value.toLowerCase())}
                      autoCapitalize="off"
                      spellCheck={false}
                    />
                    <span className="custom-arrow">&rarr;</span>
                    <input
                      type="text"
                      className="custom-input"
                      placeholder="End word"
                      value={customEnd}
                      onChange={e => setCustomEnd(e.target.value.toLowerCase())}
                      autoCapitalize="off"
                      spellCheck={false}
                    />
                  </div>
                )}
              </div>

              <button
                className="btn btn-primary btn-large"
                onClick={handleFreeplay}
                disabled={useCustom && (!customStart.trim() || !customEnd.trim())}
              >
                Start Puzzle
              </button>
            </>
          ) : (
            <>
              <p className="difficulty-label">
                Start from any word and keep building without reusing a word.
              </p>
              <div className="menu-option">
                <label className="menu-label">Start word</label>
                <input
                  type="text"
                  className="custom-input"
                  placeholder="Enter a starting word"
                  value={exploreStart}
                  onChange={e => setExploreStart(e.target.value.toLowerCase())}
                  autoCapitalize="off"
                  spellCheck={false}
                />
              </div>
              <button
                className="btn btn-primary btn-large"
                onClick={() => onStartExploration(exploreStart)}
                disabled={!exploreStart.trim()}
              >
                Start Run
              </button>
            </>
          )}
        </div>
      )}

      <div className="menu-section">
        <label className="menu-label">Move Types</label>
        <MoveTypeToggles activeMoveTypes={activeMoveTypes} onToggle={onToggleMoveType} />
      </div>

      {error && <div className="menu-error">{error}</div>}
    </div>
  )
}
