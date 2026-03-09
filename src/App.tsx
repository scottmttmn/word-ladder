import { useEffect, useState } from 'react'
import { useGame } from './hooks/useGame'
import Header from './components/Header'
import MenuScreen from './components/MenuScreen'
import Ladder from './components/Ladder'
import WordInput from './components/WordInput'
import PuzzleInfo from './components/PuzzleInfo'
import MoveTypeToggles from './components/MoveTypeToggles'
import VictoryModal from './components/VictoryModal'
import HowToPlayModal from './components/HowToPlayModal'
import { formatDailyDate } from './engine/daily'

function App() {
  const {
    state,
    dispatch,
    init,
    submitWord,
    startFreeplay,
    startDaily,
    playSharedPuzzle,
  } = useGame()

  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    init()
  }, [init])

  const handleNewPuzzle = () => {
    if (state.mode === 'daily') {
      startDaily()
    } else {
      startFreeplay()
    }
  }

  if (state.phase === 'loading') {
    return (
      <div className="app">
        <div className="loading">
          <div className="loading-spinner" />
          <p>Loading dictionary...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <Header
        mode={state.mode}
        onModeChange={mode => dispatch({ type: 'SET_MODE', mode })}
        onHelp={() => setShowHelp(true)}
        showModeToggle={state.phase === 'menu'}
      />

      {state.phase === 'menu' && (
        <MenuScreen
          mode={state.mode}
          difficulty={state.difficulty}
          activeMoveTypes={state.activeMoveTypes}
          error={state.error}
          onStartDaily={startDaily}
          onStartFreeplay={startFreeplay}
          onToggleMoveType={mt => dispatch({ type: 'TOGGLE_MOVE_TYPE', moveType: mt })}
          onSetDifficulty={d => dispatch({ type: 'SET_DIFFICULTY', difficulty: d })}
        />
      )}

      {state.phase === 'shared-view' && state.puzzle && (
        <div className="game-screen">
          <PuzzleInfo
            puzzle={state.puzzle}
            moveCount={state.ladder.length - 1}
          />
          <div className="shared-banner">
            Shared solution
          </div>
          <Ladder ladder={state.ladder} puzzle={state.puzzle} interactive={false} />
          <div className="action-bar">
            <button className="btn btn-primary" onClick={playSharedPuzzle}>
              Try This Puzzle
            </button>
            <button className="btn btn-ghost" onClick={() => dispatch({ type: 'GO_TO_MENU' })}>
              Menu
            </button>
          </div>
        </div>
      )}

      {(state.phase === 'playing' || state.phase === 'victory') && state.puzzle && (
        <div className="game-screen">
          <PuzzleInfo
            puzzle={state.puzzle}
            moveCount={state.ladder.length - 1}
            dailyDate={state.mode === 'daily' ? formatDailyDate(new Date()) : undefined}
          />
          <MoveTypeToggles
            activeMoveTypes={state.activeMoveTypes}
            onToggle={mt => dispatch({ type: 'TOGGLE_MOVE_TYPE', moveType: mt })}
          />
          <Ladder ladder={state.ladder} puzzle={state.puzzle} />

          {state.phase === 'playing' && (
            <>
              <WordInput
                onSubmit={submitWord}
                error={state.error}
              />
              <div className="action-bar">
                <button
                  className="btn btn-ghost"
                  onClick={() => dispatch({ type: 'UNDO' })}
                  disabled={state.ladder.length <= 1}
                >
                  Undo
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => dispatch({ type: 'RESET' })}
                  disabled={state.ladder.length <= 1}
                >
                  Reset
                </button>
                <button className="btn btn-ghost" onClick={() => dispatch({ type: 'GO_TO_MENU' })}>
                  Menu
                </button>
              </div>
            </>
          )}

          {state.phase === 'victory' && (
            <VictoryModal
              puzzle={state.puzzle}
              ladder={state.ladder}
              onPlayAgain={handleNewPuzzle}
              onMenu={() => dispatch({ type: 'GO_TO_MENU' })}
            />
          )}
        </div>
      )}

      {showHelp && <HowToPlayModal onClose={() => setShowHelp(false)} />}
    </div>
  )
}

export default App
