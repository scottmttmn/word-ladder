import { describe, it, expect, beforeAll } from 'vitest'
import { loadDictionary } from '../../src/engine/dictionary'
import { buildGraph, getNeighbors, getUnusedNeighborCount } from '../../src/engine/graph'
import { gameReducer, initialState } from '../../src/hooks/useGame'
import type { DictionaryData } from '../../src/engine/types'
import type { WordGraph } from '../../src/engine/graph'

let data: DictionaryData
let graph: WordGraph

beforeAll(() => {
  data = loadDictionary()
  graph = buildGraph(data)
})

describe('exploration graph helpers', () => {
  it('counts unused neighbors for a mixed-move word', () => {
    const activeMoveTypes = ['classic', 'anagram', 'add-remove'] as const
    const total = getNeighbors('cat', graph, [...activeMoveTypes]).length
    const count = getUnusedNeighborCount('cat', graph, [...activeMoveTypes], new Set(['cat']))

    expect(count).toBe(total)
    expect(count).toBeGreaterThan(0)
  })

  it('excludes visited words from the remaining count', () => {
    const activeMoveTypes = ['classic', 'anagram', 'add-remove'] as const
    const neighbors = getNeighbors('cat', graph, [...activeMoveTypes])
    const visited = new Set(['cat', neighbors[0], neighbors[1]])
    const count = getUnusedNeighborCount('cat', graph, [...activeMoveTypes], visited)

    expect(count).toBe(neighbors.length - 2)
  })

  it('returns zero when every reachable neighbor has already been used', () => {
    const activeMoveTypes = ['classic', 'anagram', 'add-remove'] as const
    const visited = new Set(['cat', ...getNeighbors('cat', graph, [...activeMoveTypes])])

    expect(getUnusedNeighborCount('cat', graph, [...activeMoveTypes], visited)).toBe(0)
  })
})

describe('exploration reducer flow', () => {
  it('starts an exploratory run from a start word', () => {
    const state = gameReducer(
      {
        ...initialState,
        phase: 'menu',
      },
      { type: 'START_EXPLORATION', startWord: 'cat', remainingMoveCount: 12 }
    )

    expect(state.phase).toBe('playing')
    expect(state.puzzle).toBeNull()
    expect(state.exploreStartWord).toBe('cat')
    expect(state.ladder).toEqual([{ word: 'cat', moveType: null }])
    expect(state.remainingMoveCount).toBe(12)
  })

  it('moves exploratory runs to the results state when the final move is played', () => {
    const started = gameReducer(
      {
        ...initialState,
        phase: 'menu',
      },
      { type: 'START_EXPLORATION', startWord: 'cat', remainingMoveCount: 3 }
    )

    const completed = gameReducer(started, {
      type: 'SUBMIT_WORD',
      word: 'cot',
      moveType: 'classic',
      remainingMoveCount: 0,
      complete: true,
    })

    expect(completed.phase).toBe('victory')
    expect(completed.exploreEndedReason).toBe('stuck')
    expect(completed.remainingMoveCount).toBe(0)
  })

  it('undo and reset keep exploratory runs active and clear the stuck state', () => {
    const finished = {
      ...initialState,
      phase: 'victory' as const,
      exploreStartWord: 'cat',
      remainingMoveCount: 0,
      exploreEndedReason: 'stuck' as const,
      ladder: [
        { word: 'cat', moveType: null },
        { word: 'cot', moveType: 'classic' as const },
      ],
    }

    const undone = gameReducer(finished, { type: 'UNDO', remainingMoveCount: 5 })
    expect(undone.phase).toBe('playing')
    expect(undone.ladder).toEqual([{ word: 'cat', moveType: null }])
    expect(undone.remainingMoveCount).toBe(5)
    expect(undone.exploreEndedReason).toBeNull()

    const reset = gameReducer(
      {
        ...undone,
        ladder: [
          { word: 'cat', moveType: null },
          { word: 'cot', moveType: 'classic' as const },
        ],
      },
      { type: 'RESET', remainingMoveCount: 7 }
    )

    expect(reset.phase).toBe('playing')
    expect(reset.ladder).toEqual([{ word: 'cat', moveType: null }])
    expect(reset.remainingMoveCount).toBe(7)
    expect(reset.exploreEndedReason).toBeNull()
  })
})
