import { useReducer, useCallback } from 'react'
import type { MoveType, Puzzle, LadderStep, DictionaryData } from '../engine/types'
import { MOVE_TYPES } from '../engine/types'
import type { WordGraph } from '../engine/graph'
import { buildGraph } from '../engine/graph'
import { findShortestPath } from '../engine/solver'
import { generatePuzzle } from '../engine/generator'
import { getDailyPuzzle } from '../engine/daily'
import { classifyMove } from '../engine/moves'
import { loadDictionary, getWordSet } from '../engine/dictionary'
import { decodeShareUrl } from '../engine/sharing'

// Capture the initial URL hash at module load time, before React StrictMode
// can double-fire useEffect and clear it on the first pass.
const initialHash = window.location.hash

export type GamePhase = 'loading' | 'menu' | 'playing' | 'victory' | 'shared-view'
export type GameMode = 'daily' | 'freeplay'

export interface GameState {
  phase: GamePhase
  mode: GameMode
  dictionary: DictionaryData | null
  graph: WordGraph | null
  puzzle: Puzzle | null
  ladder: LadderStep[]
  activeMoveTypes: Set<MoveType>
  difficulty: number
  error: string | null
  sharerMoveCount: number | null
  sharerMoveTypes: MoveType[] | null
}

type GameAction =
  | { type: 'INIT'; dictionary: DictionaryData; graph: WordGraph }
  | { type: 'START_PUZZLE'; puzzle: Puzzle }
  | { type: 'SUBMIT_WORD'; word: string; moveType: MoveType }
  | { type: 'UNDO' }
  | { type: 'RESET' }
  | { type: 'TOGGLE_MOVE_TYPE'; moveType: MoveType }
  | { type: 'SET_DIFFICULTY'; difficulty: number }
  | { type: 'SET_MODE'; mode: GameMode }
  | { type: 'VICTORY' }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'GO_TO_MENU' }
  | { type: 'LOAD_SHARED'; puzzle: Puzzle; sharerMoveCount: number; sharerMoveTypes: MoveType[] }

const initialState: GameState = {
  phase: 'loading',
  mode: 'freeplay',
  dictionary: null,
  graph: null,
  puzzle: null,
  ladder: [],
  activeMoveTypes: new Set(MOVE_TYPES),
  difficulty: 4,
  error: null,
  sharerMoveCount: null,
  sharerMoveTypes: null,
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'INIT':
      return {
        ...state,
        phase: 'menu',
        dictionary: action.dictionary,
        graph: action.graph,
      }
    case 'START_PUZZLE':
      return {
        ...state,
        phase: 'playing',
        puzzle: action.puzzle,
        ladder: [{ word: action.puzzle.startWord, moveType: null }],
        error: null,
      }
    case 'SUBMIT_WORD': {
      const newLadder = [
        ...state.ladder,
        { word: action.word, moveType: action.moveType },
      ]
      const isVictory = action.word === state.puzzle?.endWord
      return {
        ...state,
        ladder: newLadder,
        phase: isVictory ? 'victory' : state.phase,
        error: null,
      }
    }
    case 'UNDO':
      if (state.ladder.length <= 1) return state
      return {
        ...state,
        ladder: state.ladder.slice(0, -1),
        phase: 'playing',
        error: null,
      }
    case 'RESET':
      if (!state.puzzle) return state
      return {
        ...state,
        ladder: [{ word: state.puzzle.startWord, moveType: null }],
        phase: 'playing',
        error: null,
      }
    case 'TOGGLE_MOVE_TYPE': {
      const next = new Set(state.activeMoveTypes)
      if (next.has(action.moveType)) {
        if (next.size > 1) next.delete(action.moveType)
      } else {
        next.add(action.moveType)
      }
      // Recalculate optimal length if we have a puzzle and graph
      let puzzle = state.puzzle
      if (puzzle && state.graph) {
        const result = findShortestPath(
          puzzle.startWord,
          puzzle.endWord,
          state.graph,
          Array.from(next)
        )
        puzzle = {
          ...puzzle,
          activeMoveTypes: Array.from(next),
          optimalLength: result.pathLength,
        }
      }
      return { ...state, activeMoveTypes: next, puzzle }
    }
    case 'SET_DIFFICULTY':
      return { ...state, difficulty: action.difficulty }
    case 'SET_MODE':
      return { ...state, mode: action.mode }
    case 'VICTORY':
      return { ...state, phase: 'victory' }
    case 'SET_ERROR':
      return { ...state, error: action.error }
    case 'CLEAR_ERROR':
      return { ...state, error: null }
    case 'GO_TO_MENU':
      return { ...state, phase: 'menu', puzzle: null, ladder: [], error: null, sharerMoveCount: null, sharerMoveTypes: null }
    case 'LOAD_SHARED':
      return {
        ...state,
        phase: 'shared-view',
        puzzle: action.puzzle,
        ladder: [{ word: action.puzzle.startWord, moveType: null }],
        sharerMoveCount: action.sharerMoveCount,
        sharerMoveTypes: action.sharerMoveTypes,
        activeMoveTypes: new Set(action.puzzle.activeMoveTypes),
        error: null,
      }
    default:
      return state
  }
}

export function useGame() {
  const [state, dispatch] = useReducer(gameReducer, initialState)

  const init = useCallback(() => {
    const dictionary = loadDictionary()
    const graph = buildGraph(dictionary)
    dispatch({ type: 'INIT', dictionary, graph })

    // Check for shared puzzle in URL
    const shareData = decodeShareUrl(initialHash)
    if (shareData && graph) {
      const wordSet = getWordSet(dictionary)
      if (wordSet.has(shareData.startWord) && wordSet.has(shareData.endWord)) {
        const result = findShortestPath(
          shareData.startWord,
          shareData.endWord,
          graph,
          shareData.activeMoveTypes
        )
        const puzzle: Puzzle = {
          startWord: shareData.startWord,
          endWord: shareData.endWord,
          activeMoveTypes: shareData.activeMoveTypes,
          optimalLength: result.pathLength,
        }
        dispatch({ type: 'LOAD_SHARED', puzzle, sharerMoveCount: shareData.moveCount, sharerMoveTypes: shareData.moveTypeSequence })
        // Clear the hash so refreshing starts fresh
        window.history.replaceState(null, '', window.location.pathname)
      }
    }
  }, [])

  const submitWord = useCallback(
    (word: string) => {
      if (!state.graph || !state.dictionary || !state.puzzle) return
      const w = word.toLowerCase().trim()
      const wordSet = getWordSet(state.dictionary)

      if (!wordSet.has(w)) {
        dispatch({ type: 'SET_ERROR', error: 'Not a valid word' })
        return
      }

      const currentWord = state.ladder[state.ladder.length - 1].word
      if (w === currentWord) {
        dispatch({ type: 'SET_ERROR', error: 'Same as current word' })
        return
      }

      const moveType = classifyMove(currentWord, w, state.graph.phonemes)
      if (!moveType) {
        dispatch({ type: 'SET_ERROR', error: 'No valid move connects these words' })
        return
      }

      if (!state.activeMoveTypes.has(moveType)) {
        dispatch({
          type: 'SET_ERROR',
          error: `${moveType} moves are disabled`,
        })
        return
      }

      dispatch({ type: 'SUBMIT_WORD', word: w, moveType })
    },
    [state.graph, state.dictionary, state.puzzle, state.ladder, state.activeMoveTypes]
  )

  const startFreeplay = useCallback(
    (customStart?: string, customEnd?: string) => {
      if (!state.graph || !state.dictionary) return
      const activeMoveTypes = Array.from(state.activeMoveTypes)

      if (customStart && customEnd) {
        const wordSet = getWordSet(state.dictionary)
        const s = customStart.toLowerCase().trim()
        const e = customEnd.toLowerCase().trim()
        if (!wordSet.has(s)) {
          dispatch({ type: 'SET_ERROR', error: `"${s}" is not in the dictionary` })
          return
        }
        if (!wordSet.has(e)) {
          dispatch({ type: 'SET_ERROR', error: `"${e}" is not in the dictionary` })
          return
        }
        const result = findShortestPath(s, e, state.graph, activeMoveTypes)
        if (!result.path) {
          dispatch({ type: 'SET_ERROR', error: 'No path exists between these words' })
          return
        }
        const puzzle: Puzzle = {
          startWord: s,
          endWord: e,
          activeMoveTypes,
          optimalLength: result.pathLength,
        }
        dispatch({ type: 'START_PUZZLE', puzzle })
      } else {
        const puzzle = generatePuzzle(state.graph, {
          targetPathLength: state.difficulty,
          activeMoveTypes,
        })
        if (!puzzle) {
          dispatch({ type: 'SET_ERROR', error: 'Could not generate a puzzle. Try different settings.' })
          return
        }
        dispatch({ type: 'START_PUZZLE', puzzle })
      }
    },
    [state.graph, state.dictionary, state.activeMoveTypes, state.difficulty]
  )

  const startDaily = useCallback(() => {
    if (!state.graph) return
    const puzzle = getDailyPuzzle(new Date(), state.graph)
    if (!puzzle) {
      dispatch({ type: 'SET_ERROR', error: 'Could not generate daily puzzle' })
      return
    }
    dispatch({ type: 'START_PUZZLE', puzzle })
  }, [state.graph])

  const playSharedPuzzle = useCallback(() => {
    if (!state.puzzle) return
    dispatch({ type: 'START_PUZZLE', puzzle: state.puzzle })
  }, [state.puzzle])

  return {
    state,
    dispatch,
    init,
    submitWord,
    startFreeplay,
    startDaily,
    playSharedPuzzle,
  }
}
