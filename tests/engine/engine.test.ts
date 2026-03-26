import { describe, it, expect, beforeAll } from 'vitest'
import { loadDictionary, getWordSet } from '../../src/engine/dictionary'
import { buildGraph, getNeighbors } from '../../src/engine/graph'
import { classifyMove, getRhymeKey, getAnagramKey } from '../../src/engine/moves'
import { findShortestPath } from '../../src/engine/solver'
import { generatePuzzle } from '../../src/engine/generator'
import { getDailyPuzzle } from '../../src/engine/daily'
import { encodeShareUrl, decodeShareUrl } from '../../src/engine/sharing'
import type { WordGraph } from '../../src/engine/graph'
import type { DictionaryData } from '../../src/engine/types'

let data: DictionaryData
let graph: WordGraph
let wordSet: Set<string>

beforeAll(() => {
  data = loadDictionary()
  graph = buildGraph(data)
  wordSet = getWordSet(data)
})

describe('dictionary', () => {
  it('loads words', () => {
    expect(data.words.length).toBeGreaterThan(100000)
  })

  it('contains common words', () => {
    for (const w of ['cat', 'dog', 'run', 'play', 'warm', 'cold']) {
      expect(wordSet.has(w)).toBe(true)
    }
  })

  it('has phonemes for CMU words', () => {
    expect(data.phonemes['cat']).toBe('K AE1 T')
  })

  it('includes words without phonemes', () => {
    expect(wordSet.has('clove')).toBe(true)
    expect(wordSet.has('miso')).toBe(true)
    expect(data.phonemes['clove']).toBeUndefined()
    expect(data.phonemes['miso']).toBeUndefined()
  })

  it('classifies moves for words without phonemes', () => {
    // clove -> cove is add-remove (remove 'l')
    expect(classifyMove('clove', 'cove', data.phonemes)).toBe('add-remove')
  })
})

describe('moves', () => {
  it('classifies classic moves', () => {
    expect(classifyMove('cat', 'bat', data.phonemes)).toBe('classic')
    expect(classifyMove('cat', 'cot', data.phonemes)).toBe('classic')
    expect(classifyMove('cat', 'car', data.phonemes)).toBe('classic')
  })

  it('classifies anagram moves', () => {
    expect(classifyMove('cat', 'act', data.phonemes)).toBe('anagram')
  })

  it('classifies add-remove moves', () => {
    expect(classifyMove('cat', 'at', data.phonemes)).toBe('add-remove')
    expect(classifyMove('cat', 'cart', data.phonemes)).toBe('add-remove')
  })

  it('classifies rhyme moves', () => {
    // cat and flat should rhyme (both end in AE T)
    expect(classifyMove('cat', 'flat', data.phonemes)).toBe('rhyme')
  })

  it('returns null for unrelated words', () => {
    expect(classifyMove('cat', 'dog', data.phonemes)).toBeNull()
  })

  it('computes rhyme keys', () => {
    expect(getRhymeKey('K AE1 T')).toBe('AE T')
    expect(getRhymeKey('HH AE1 T')).toBe('AE T')
  })

  it('computes anagram keys', () => {
    expect(getAnagramKey('cat')).toBe('act')
    expect(getAnagramKey('act')).toBe('act')
  })
})

describe('graph', () => {
  it('builds rhyme groups', () => {
    expect(graph.rhymeGroups.size).toBeGreaterThan(100)
  })

  it('builds anagram groups', () => {
    expect(graph.anagramGroups.size).toBeGreaterThan(100)
  })

  it('finds classic neighbors', () => {
    const neighbors = getNeighbors('cat', graph, ['classic'])
    expect(neighbors).toContain('bat')
    expect(neighbors).toContain('cot')
    expect(neighbors).not.toContain('cat')
  })

  it('finds rhyme neighbors', () => {
    const neighbors = getNeighbors('cat', graph, ['rhyme'])
    expect(neighbors).toContain('hat')
    expect(neighbors).toContain('bat')
    expect(neighbors).not.toContain('cat')
  })

  it('finds anagram neighbors', () => {
    const neighbors = getNeighbors('cat', graph, ['anagram'])
    expect(neighbors).toContain('act')
    expect(neighbors).not.toContain('cat')
  })

  it('finds add-remove neighbors', () => {
    const neighbors = getNeighbors('cat', graph, ['add-remove'])
    expect(neighbors).toContain('at')
    expect(neighbors).toContain('cart')
    expect(neighbors).not.toContain('cat')
  })
})

describe('solver', () => {
  it('finds shortest classic path cat -> bat', () => {
    const result = findShortestPath('cat', 'bat', graph, ['classic'])
    expect(result.path).toEqual(['cat', 'bat'])
    expect(result.pathLength).toBe(1)
  })

  it('finds path with all move types', () => {
    const result = findShortestPath('cold', 'warm', graph, ['classic', 'rhyme', 'anagram', 'add-remove'])
    expect(result.path).not.toBeNull()
    expect(result.pathLength).toBeGreaterThan(0)
  })

  it('returns null for unreachable pairs', () => {
    // With only anagram moves, most words are unreachable
    const result = findShortestPath('cat', 'dog', graph, ['anagram'])
    expect(result.path).toBeNull()
  })

  it('handles same start and end', () => {
    const result = findShortestPath('cat', 'cat', graph, ['classic'])
    expect(result.path).toEqual(['cat'])
    expect(result.pathLength).toBe(0)
  })
})

describe('generator', () => {
  it('generates a valid puzzle', () => {
    const puzzle = generatePuzzle(graph, {
      targetPathLength: 3,
      activeMoveTypes: ['classic', 'rhyme', 'anagram', 'add-remove'],
    })
    expect(puzzle).not.toBeNull()
    expect(puzzle!.optimalLength).toBe(3)
    expect(wordSet.has(puzzle!.startWord)).toBe(true)
    expect(wordSet.has(puzzle!.endWord)).toBe(true)
  })

  it('generates puzzles at various difficulties', () => {
    for (const len of [2, 4, 6]) {
      const puzzle = generatePuzzle(graph, {
        targetPathLength: len,
        activeMoveTypes: ['classic', 'rhyme', 'anagram', 'add-remove'],
      })
      expect(puzzle).not.toBeNull()
      expect(puzzle!.optimalLength).toBe(len)
    }
  })
})

describe('daily puzzle', () => {
  it('generates a puzzle for today', () => {
    const puzzle = getDailyPuzzle(new Date(), graph)
    expect(puzzle).not.toBeNull()
  })

  it('is deterministic for same date', () => {
    const date = new Date('2025-06-15')
    const p1 = getDailyPuzzle(date, graph)
    const p2 = getDailyPuzzle(date, graph)
    expect(p1!.startWord).toBe(p2!.startWord)
    expect(p1!.endWord).toBe(p2!.endWord)
  })

  it('differs for different dates', () => {
    const p1 = getDailyPuzzle(new Date('2025-06-15'), graph)
    const p2 = getDailyPuzzle(new Date('2025-06-16'), graph)
    // Very unlikely to be the same
    expect(p1!.startWord !== p2!.startWord || p1!.endWord !== p2!.endWord).toBe(true)
  })
})

describe('sharing', () => {
  it('encodes and decodes share URLs with move type sequence', () => {
    const original = {
      startWord: 'cold',
      endWord: 'warm',
      activeMoveTypes: ['classic' as const, 'rhyme' as const],
      moveCount: 5,
      moveTypeSequence: ['classic' as const, 'classic' as const, 'rhyme' as const, 'classic' as const, 'classic' as const],
    }
    const hash = encodeShareUrl(original)
    const decoded = decodeShareUrl(hash)
    expect(decoded).not.toBeNull()
    expect(decoded!.startWord).toBe('cold')
    expect(decoded!.endWord).toBe('warm')
    expect(decoded!.moveCount).toBe(5)
    expect(decoded!.activeMoveTypes).toEqual(['classic', 'rhyme'])
    expect(decoded!.moveTypeSequence).toEqual(['classic', 'classic', 'rhyme', 'classic', 'classic'])
  })

  it('handles missing move type sequence gracefully', () => {
    // Old-format URLs without t= param should still decode
    const hash = '#s=cold&e=warm&m=c%2Cr&n=5'
    const decoded = decodeShareUrl(hash)
    expect(decoded).not.toBeNull()
    expect(decoded!.moveTypeSequence).toEqual([])
  })

  it('returns null for invalid hash', () => {
    expect(decodeShareUrl('')).toBeNull()
    expect(decodeShareUrl('#')).toBeNull()
    expect(decodeShareUrl('#garbage')).toBeNull()
  })
})
