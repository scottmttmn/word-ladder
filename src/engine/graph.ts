import type { DictionaryData, MoveType } from './types'
import {
  getRhymeKey,
  getAnagramKey,
  getClassicNeighbors,
  getRhymeNeighbors,
  getAnagramNeighbors,
  getAddRemoveNeighbors,
} from './moves'

export interface WordGraph {
  wordSet: Set<string>
  rhymeGroups: Map<string, string[]>
  anagramGroups: Map<string, string[]>
  phonemes: Record<string, string>
}

/**
 * Build the word graph: creates rhyme and anagram group indexes.
 * Classic and add-remove neighbors are computed on-the-fly (no pre-indexing needed).
 */
export function buildGraph(data: DictionaryData): WordGraph {
  const wordSet = new Set(data.words)
  const rhymeGroups = new Map<string, string[]>()
  const anagramGroups = new Map<string, string[]>()

  for (const word of data.words) {
    // Rhyme groups
    const ph = data.phonemes[word]
    if (ph) {
      const rhymeKey = getRhymeKey(ph)
      if (rhymeKey) {
        const group = rhymeGroups.get(rhymeKey)
        if (group) {
          group.push(word)
        } else {
          rhymeGroups.set(rhymeKey, [word])
        }
      }
    }

    // Anagram groups
    const anagramKey = getAnagramKey(word)
    const aGroup = anagramGroups.get(anagramKey)
    if (aGroup) {
      aGroup.push(word)
    } else {
      anagramGroups.set(anagramKey, [word])
    }
  }

  return { wordSet, rhymeGroups, anagramGroups, phonemes: data.phonemes }
}

/**
 * Get all neighbors of a word for the given active move types.
 */
export function getNeighbors(
  word: string,
  graph: WordGraph,
  activeMoveTypes: MoveType[]
): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  function addNeighbors(neighbors: string[]) {
    for (const n of neighbors) {
      if (!seen.has(n)) {
        seen.add(n)
        result.push(n)
      }
    }
  }

  for (const mt of activeMoveTypes) {
    switch (mt) {
      case 'classic':
        addNeighbors(getClassicNeighbors(word, graph.wordSet))
        break
      case 'rhyme':
        addNeighbors(getRhymeNeighbors(word, graph.rhymeGroups, graph.phonemes))
        break
      case 'anagram':
        addNeighbors(getAnagramNeighbors(word, graph.anagramGroups))
        break
      case 'add-remove':
        addNeighbors(getAddRemoveNeighbors(word, graph.wordSet))
        break
    }
  }

  return result
}

export function getUnusedNeighborCount(
  word: string,
  graph: WordGraph,
  activeMoveTypes: MoveType[],
  visitedWords: Set<string>
): number {
  return getNeighbors(word, graph, activeMoveTypes).filter(neighbor => !visitedWords.has(neighbor)).length
}
