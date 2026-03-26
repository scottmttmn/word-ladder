import { useEffect, useState, useRef } from 'react'
import { useGame } from './hooks/useGame'
import Header from './components/Header'
import MenuScreen from './components/MenuScreen'
import Ladder from './components/Ladder'
import WordInput from './components/WordInput'
import PuzzleInfo from './components/PuzzleInfo'
import ExploreInfo from './components/ExploreInfo'
import MoveTypeToggles from './components/MoveTypeToggles'
import MoveTypeBadge from './components/MoveTypeBadge'
import VictoryModal from './components/VictoryModal'
import HowToPlayModal from './components/HowToPlayModal'
import { formatDailyDate } from './engine/daily'
import type { PlaySession } from './engine/types'

function App() {
  const {
    state,
    dispatch,
    init,
    submitWord,
    startFreeplay,
    startExploration,
    startDaily,
    playSharedPuzzle,
    undo,
    reset,
  } = useGame()

  const [showHelp, setShowHelp] = useState(false)
  const [showVictoryModal, setShowVictoryModal] = useState(true)
  const prevPhaseRef = useRef(state.phase)

  useEffect(() => {
    init()
  }, [init])

  // Reset the victory modal visibility when entering victory phase
  useEffect(() => {
    if (state.phase === 'victory' && prevPhaseRef.current !== 'victory') {
      setShowVictoryModal(true)
    }
    prevPhaseRef.current = state.phase
  }, [state.phase])

  const handleNewPuzzle = () => {
    if (state.mode === 'daily') {
      startDaily()
    } else if (state.freeplayVariant === 'explore' && state.exploreStartWord) {
      startExploration(state.exploreStartWord)
    } else {
      startFreeplay()
    }
  }

  const activeSession: PlaySession | null = state.puzzle
    ? { kind: 'puzzle', puzzle: state.puzzle }
    : state.exploreStartWord
      ? { kind: 'explore', startWord: state.exploreStartWord }
      : null

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
          freeplayVariant={state.freeplayVariant}
          difficulty={state.difficulty}
          activeMoveTypes={state.activeMoveTypes}
          error={state.error}
          onStartDaily={startDaily}
          onStartFreeplay={startFreeplay}
          onStartExploration={startExploration}
          onSetFreeplayVariant={variant => dispatch({ type: 'SET_FREEPLAY_VARIANT', variant })}
          onToggleMoveType={mt => dispatch({ type: 'TOGGLE_MOVE_TYPE', moveType: mt })}
          onSetDifficulty={d => dispatch({ type: 'SET_DIFFICULTY', difficulty: d })}
        />
      )}

      {state.phase === 'shared-view' && state.puzzle && (
        <div className="game-screen">
          <PuzzleInfo
            puzzle={state.puzzle}
            moveCount={0}
          />
          <div className="shared-banner">
            <span className="shared-challenge-icon">🏆</span>
            <p className="shared-challenge-text">
              Your friend solved this in <strong>{state.sharerMoveCount}</strong> move{state.sharerMoveCount !== 1 ? 's' : ''}.
              {state.sharerMoveCount === state.puzzle.optimalLength
                ? ' Can you match them?'
                : ' Can you beat them?'}
            </p>
            {state.sharerMoveTypes && state.sharerMoveTypes.length > 0 && (
              <div className="shared-move-types">
                {state.sharerMoveTypes.map((mt, i) => (
                  <MoveTypeBadge key={i} moveType={mt} />
                ))}
              </div>
            )}
          </div>
          <div className="action-bar">
            <button className="btn btn-primary" onClick={playSharedPuzzle}>
              Play This Puzzle
            </button>
            <button className="btn btn-ghost" onClick={() => dispatch({ type: 'GO_TO_MENU' })}>
              Menu
            </button>
          </div>
        </div>
      )}

      {(state.phase === 'playing' || state.phase === 'victory') && activeSession && (
        <div className="game-screen">
          {state.puzzle ? (
            <PuzzleInfo
              puzzle={state.puzzle}
              moveCount={state.ladder.length - 1}
              dailyDate={state.mode === 'daily' ? formatDailyDate(new Date()) : undefined}
            />
          ) : (
            <ExploreInfo
              startWord={state.exploreStartWord!}
              currentWord={state.ladder[state.ladder.length - 1].word}
              moveCount={state.ladder.length - 1}
              remainingMoveCount={state.remainingMoveCount ?? 0}
            />
          )}
          <MoveTypeToggles
            activeMoveTypes={state.activeMoveTypes}
            onToggle={mt => dispatch({ type: 'TOGGLE_MOVE_TYPE', moveType: mt })}
          />
          <Ladder ladder={state.ladder} session={activeSession} />

          {state.phase === 'playing' && (
            <>
              <WordInput
                onSubmit={submitWord}
                error={state.error}
              />
              <div className="action-bar">
                <button
                  className="btn btn-ghost"
                  onClick={undo}
                  disabled={state.ladder.length <= 1}
                >
                  Undo
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={reset}
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

          {state.phase === 'victory' && showVictoryModal && (
            <VictoryModal
              puzzle={state.puzzle ?? undefined}
              ladder={state.ladder}
              sharerMoveCount={state.sharerMoveCount}
              exploreEndedReason={state.exploreEndedReason}
              onPlayAgain={handleNewPuzzle}
              onMenu={() => dispatch({ type: 'GO_TO_MENU' })}
              onReview={() => setShowVictoryModal(false)}
            />
          )}

          {state.phase === 'victory' && !showVictoryModal && (
            <div className="action-bar">
              <button className="btn btn-primary" onClick={() => setShowVictoryModal(true)}>
                Results
              </button>
              <button className="btn btn-secondary" onClick={handleNewPuzzle}>
                New Puzzle
              </button>
              <button className="btn btn-ghost" onClick={() => dispatch({ type: 'GO_TO_MENU' })}>
                Menu
              </button>
            </div>
          )}
        </div>
      )}

      {showHelp && <HowToPlayModal onClose={() => setShowHelp(false)} />}
    </div>
  )
}

export default App
