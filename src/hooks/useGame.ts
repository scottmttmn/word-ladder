import { useReducer, useCallback } from 'react'
import type { MoveType, Puzzle, LadderStep, DictionaryData } from '../engine/types'
import { MOVE_TYPES } from '../engine/types'
import type { WordGraph } from '../engine/graph'
import { buildGraph, getUnusedNeighborCount } from '../engine/graph'
import { findShortestPath } from '../engine/solver'
import { generatePuzzle } from '../engine/generator'
import { getDailyPuzzle } from '../engine/daily'
import { classifyMove } from '../engine/moves'
import { loadDictionary, getWordSet } from '../engine/dictionary'
import { decodeShareUrl } from '../engine/sharing'

// Capture the initial URL hash at module load time, before React StrictMode
// can double-fire useEffect and clear it on the first pass.
const initialHash = typeof window !== 'undefined' ? window.location.hash : ''

export type GamePhase = 'loading' | 'menu' | 'playing' | 'victory' | 'shared-view'
export type GameMode = 'daily' | 'freeplay'
export type FreeplayVariant = 'puzzle' | 'explore'
export type ExploreEndedReason = 'stuck' | 'manual' | null

export interface GameState {
  phase: GamePhase
  mode: GameMode
  freeplayVariant: FreeplayVariant
  dictionary: DictionaryData | null
  graph: WordGraph | null
  puzzle: Puzzle | null
  exploreStartWord: string | null
  remainingMoveCount: number | null
  exploreEndedReason: ExploreEndedReason
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
  | { type: 'START_EXPLORATION'; startWord: string; remainingMoveCount: number }
  | { type: 'SUBMIT_WORD'; word: string; moveType: MoveType; remainingMoveCount?: number; complete?: boolean }
  | { type: 'UNDO'; remainingMoveCount?: number }
  | { type: 'RESET'; remainingMoveCount?: number }
  | { type: 'TOGGLE_MOVE_TYPE'; moveType: MoveType }
  | { type: 'SET_DIFFICULTY'; difficulty: number }
  | { type: 'SET_MODE'; mode: GameMode }
  | { type: 'SET_FREEPLAY_VARIANT'; variant: FreeplayVariant }
  | { type: 'VICTORY' }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'GO_TO_MENU' }
  | { type: 'LOAD_SHARED'; puzzle: Puzzle; sharerMoveCount: number; sharerMoveTypes: MoveType[] }

export const initialState: GameState = {
  phase: 'loading',
  mode: 'freeplay',
  freeplayVariant: 'puzzle',
  dictionary: null,
  graph: null,
  puzzle: null,
  exploreStartWord: null,
  remainingMoveCount: null,
  exploreEndedReason: null,
  ladder: [],
  activeMoveTypes: new Set(MOVE_TYPES),
  difficulty: 4,
  error: null,
  sharerMoveCount: null,
  sharerMoveTypes: null,
}

export function gameReducer(state: GameState, action: GameAction): GameState {
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
        exploreStartWord: null,
        remainingMoveCount: null,
        exploreEndedReason: null,
        ladder: [{ word: action.puzzle.startWord, moveType: null }],
        error: null,
      }
    case 'START_EXPLORATION':
      return {
        ...state,
        phase: action.remainingMoveCount === 0 ? 'victory' : 'playing',
        puzzle: null,
        exploreStartWord: action.startWord,
        remainingMoveCount: action.remainingMoveCount,
        exploreEndedReason: action.remainingMoveCount === 0 ? 'stuck' : null,
        ladder: [{ word: action.startWord, moveType: null }],
        error: null,
      }
    case 'SUBMIT_WORD': {
      const newLadder = [
        ...state.ladder,
        { word: action.word, moveType: action.moveType },
      ]
      const isExploration = state.exploreStartWord !== null
      const isVictory = isExploration
        ? Boolean(action.complete)
        : action.word === state.puzzle?.endWord
      return {
        ...state,
        ladder: newLadder,
        phase: isVictory ? 'victory' : state.phase,
        remainingMoveCount: isExploration ? action.remainingMoveCount ?? state.remainingMoveCount : null,
        exploreEndedReason: isExploration && isVictory ? 'stuck' : null,
        error: null,
      }
    }
    case 'UNDO':
      if (state.ladder.length <= 1) return state
      return {
        ...state,
        ladder: state.ladder.slice(0, -1),
        phase: 'playing',
        remainingMoveCount: state.exploreStartWord ? action.remainingMoveCount ?? state.remainingMoveCount : null,
        exploreEndedReason: state.exploreStartWord ? null : state.exploreEndedReason,
        error: null,
      }
    case 'RESET':
      if (!state.puzzle && !state.exploreStartWord) return state
      return {
        ...state,
        ladder: [{ word: state.puzzle ? state.puzzle.startWord : state.exploreStartWord!, moveType: null }],
        phase: 'playing',
        remainingMoveCount: state.exploreStartWord ? action.remainingMoveCount ?? state.remainingMoveCount : null,
        exploreEndedReason: state.exploreStartWord ? null : state.exploreEndedReason,
        error: null,
      }
    case 'TOGGLE_MOVE_TYPE': {
      const next = new Set(state.activeMoveTypes)
      if (next.has(action.moveType)) {
        if (next.size > 1) next.delete(action.moveType)
        } else {
          next.add(action.moveType)
        }
      let puzzle = state.puzzle
      let phase = state.phase
      let remainingMoveCount = state.remainingMoveCount
      let exploreEndedReason = state.exploreEndedReason

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
      } else if (state.exploreStartWord && state.graph && state.ladder.length > 0) {
        const currentWord = state.ladder[state.ladder.length - 1].word
        const visitedWords = new Set(state.ladder.map(step => step.word))
        remainingMoveCount = getUnusedNeighborCount(currentWord, state.graph, Array.from(next), visitedWords)
        phase = remainingMoveCount === 0 ? 'victory' : 'playing'
        exploreEndedReason = remainingMoveCount === 0 ? 'stuck' : null
      }
      return { ...state, activeMoveTypes: next, puzzle, phase, remainingMoveCount, exploreEndedReason }
    }
    case 'SET_DIFFICULTY':
      return { ...state, difficulty: action.difficulty }
    case 'SET_MODE':
      return { ...state, mode: action.mode }
    case 'SET_FREEPLAY_VARIANT':
      return { ...state, freeplayVariant: action.variant, error: null }
    case 'VICTORY':
      return { ...state, phase: 'victory' }
    case 'SET_ERROR':
      return { ...state, error: action.error }
    case 'CLEAR_ERROR':
      return { ...state, error: null }
    case 'GO_TO_MENU':
      return {
        ...state,
        phase: 'menu',
        puzzle: null,
        exploreStartWord: null,
        remainingMoveCount: null,
        exploreEndedReason: null,
        ladder: [],
        error: null,
        sharerMoveCount: null,
        sharerMoveTypes: null,
      }
    case 'LOAD_SHARED':
      return {
        ...state,
        phase: 'shared-view',
        puzzle: action.puzzle,
        freeplayVariant: 'puzzle',
        exploreStartWord: null,
        remainingMoveCount: null,
        exploreEndedReason: null,
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
      if (!state.graph || !state.dictionary || (!state.puzzle && !state.exploreStartWord)) return
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

      if (state.exploreStartWord && state.ladder.some(step => step.word === w)) {
        dispatch({ type: 'SET_ERROR', error: 'Word already used in this run' })
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

      if (state.exploreStartWord) {
        const visitedWords = new Set(state.ladder.map(step => step.word))
        visitedWords.add(w)
        const remainingMoveCount = getUnusedNeighborCount(w, state.graph, Array.from(state.activeMoveTypes), visitedWords)
        dispatch({ type: 'SUBMIT_WORD', word: w, moveType, remainingMoveCount, complete: remainingMoveCount === 0 })
        return
      }

      dispatch({ type: 'SUBMIT_WORD', word: w, moveType })
    },
    [state.graph, state.dictionary, state.puzzle, state.exploreStartWord, state.ladder, state.activeMoveTypes]
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

  const startExploration = useCallback(
    (startWord: string) => {
      if (!state.graph || !state.dictionary) return
      const wordSet = getWordSet(state.dictionary)
      const normalizedStart = startWord.toLowerCase().trim()

      if (!wordSet.has(normalizedStart)) {
        dispatch({ type: 'SET_ERROR', error: `"${normalizedStart}" is not in the dictionary` })
        return
      }

      const remainingMoveCount = getUnusedNeighborCount(
        normalizedStart,
        state.graph,
        Array.from(state.activeMoveTypes),
        new Set([normalizedStart])
      )

      dispatch({ type: 'START_EXPLORATION', startWord: normalizedStart, remainingMoveCount })
    },
    [state.graph, state.dictionary, state.activeMoveTypes]
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

  const undo = useCallback(() => {
    if (!state.graph || state.ladder.length <= 1) {
      dispatch({ type: 'UNDO' })
      return
    }

    if (state.exploreStartWord) {
      const nextLadder = state.ladder.slice(0, -1)
      const currentWord = nextLadder[nextLadder.length - 1].word
      const visitedWords = new Set(nextLadder.map(step => step.word))
      const remainingMoveCount = getUnusedNeighborCount(currentWord, state.graph, Array.from(state.activeMoveTypes), visitedWords)
      dispatch({ type: 'UNDO', remainingMoveCount })
      return
    }

    dispatch({ type: 'UNDO' })
  }, [state.graph, state.ladder, state.exploreStartWord, state.activeMoveTypes])

  const reset = useCallback(() => {
    if (!state.graph) {
      dispatch({ type: 'RESET' })
      return
    }

    if (state.exploreStartWord) {
      const remainingMoveCount = getUnusedNeighborCount(
        state.exploreStartWord,
        state.graph,
        Array.from(state.activeMoveTypes),
        new Set([state.exploreStartWord])
      )
      dispatch({ type: 'RESET', remainingMoveCount })
      return
    }

    dispatch({ type: 'RESET' })
  }, [state.graph, state.exploreStartWord, state.activeMoveTypes])

  return {
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
  }
}
