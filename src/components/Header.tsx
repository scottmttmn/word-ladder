import type { GameMode } from '../hooks/useGame'

interface HeaderProps {
  mode: GameMode
  onModeChange: (mode: GameMode) => void
  onHelp: () => void
  showModeToggle: boolean
}

export default function Header({ mode, onModeChange, onHelp, showModeToggle }: HeaderProps) {
  return (
    <header className="header">
      <h1 className="header-title">Word Ladder</h1>
      <div className="header-actions">
        {showModeToggle && (
          <div className="mode-toggle">
            <button
              className={`mode-btn ${mode === 'daily' ? 'active' : ''}`}
              onClick={() => onModeChange('daily')}
            >
              Daily
            </button>
            <button
              className={`mode-btn ${mode === 'freeplay' ? 'active' : ''}`}
              onClick={() => onModeChange('freeplay')}
            >
              Free Play
            </button>
          </div>
        )}
        <button className="icon-btn" onClick={onHelp} aria-label="How to play">
          ?
        </button>
      </div>
    </header>
  )
}
