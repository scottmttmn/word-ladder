import type { MoveType } from './types'

/**
 * Get all valid neighbors by changing exactly one letter (same length).
 */
export function getClassicNeighbors(word: string, wordSet: Set<string>): string[] {
  const neighbors: string[] = []
  const chars = word.split('')
  for (let i = 0; i < chars.length; i++) {
    const original = chars[i]
    for (let c = 97; c <= 122; c++) { // a-z
      const letter = String.fromCharCode(c)
      if (letter === original) continue
      chars[i] = letter
      const candidate = chars.join('')
      if (wordSet.has(candidate)) {
        neighbors.push(candidate)
      }
    }
    chars[i] = original
  }
  return neighbors
}

/**
 * Extract a rhyme key from an ARPABET phoneme string.
 * The rhyme key is everything from the last stressed vowel onward (stress stripped).
 * e.g., "K AE1 T" -> "AE T" (for "cat")
 */
export function getRhymeKey(phonemes: string): string | null {
  const tokens = phonemes.split(' ')
  // Scan backwards for the last vowel with stress 1 or 2
  let lastStressedIdx = -1
  for (let i = tokens.length - 1; i >= 0; i--) {
    if (/^[A-Z]+[12]$/.test(tokens[i])) {
      lastStressedIdx = i
      break
    }
  }
  if (lastStressedIdx === -1) {
    // No stressed vowel found; try any vowel
    for (let i = tokens.length - 1; i >= 0; i--) {
      if (/^[A-Z]+[0-9]$/.test(tokens[i])) {
        lastStressedIdx = i
        break
      }
    }
  }
  if (lastStressedIdx === -1) return null
  // Strip stress numbers and join from the vowel onward
  const rhymePart = tokens.slice(lastStressedIdx).map(t => t.replace(/[0-9]/g, '')).join(' ')
  return rhymePart
}

/**
 * Get all words sharing the same rhyme key (excluding the word itself).
 */
export function getRhymeNeighbors(
  word: string,
  rhymeGroups: Map<string, string[]>,
  phonemes: Record<string, string>
): string[] {
  const ph = phonemes[word]
  if (!ph) return []
  const key = getRhymeKey(ph)
  if (!key) return []
  const group = rhymeGroups.get(key)
  if (!group) return []
  return group.filter(w => w !== word)
}

/**
 * Get the anagram key for a word (sorted letters).
 */
export function getAnagramKey(word: string): string {
  return word.split('').sort().join('')
}

/**
 * Get all anagrams of a word (excluding itself).
 */
export function getAnagramNeighbors(
  word: string,
  anagramGroups: Map<string, string[]>
): string[] {
  const key = getAnagramKey(word)
  const group = anagramGroups.get(key)
  if (!group) return []
  return group.filter(w => w !== word)
}

/**
 * Get all words formed by adding or removing exactly one letter.
 */
export function getAddRemoveNeighbors(word: string, wordSet: Set<string>): string[] {
  const neighbors = new Set<string>()

  // Remove one letter
  for (let i = 0; i < word.length; i++) {
    const candidate = word.slice(0, i) + word.slice(i + 1)
    if (candidate.length >= 2 && wordSet.has(candidate)) {
      neighbors.add(candidate)
    }
  }

  // Add one letter
  for (let i = 0; i <= word.length; i++) {
    for (let c = 97; c <= 122; c++) {
      const letter = String.fromCharCode(c)
      const candidate = word.slice(0, i) + letter + word.slice(i)
      if (wordSet.has(candidate)) {
        neighbors.add(candidate)
      }
    }
  }

  neighbors.delete(word)
  return Array.from(neighbors)
}

/**
 * Classify what type of move connects two words.
 * Returns null if no valid move connects them.
 * Priority: classic > anagram > add-remove > rhyme
 */
export function classifyMove(
  from: string,
  to: string,
  phonemes: Record<string, string>
): MoveType | null {
  // Classic: same length, exactly one letter different
  if (from.length === to.length) {
    let diffs = 0
    for (let i = 0; i < from.length; i++) {
      if (from[i] !== to[i]) diffs++
    }
    if (diffs === 1) return 'classic'
  }

  // Anagram: same sorted letters (and not identical)
  if (from !== to && getAnagramKey(from) === getAnagramKey(to)) {
    return 'anagram'
  }

  // Add-remove: length differs by exactly 1, and shorter is formed by removing one char from longer
  if (Math.abs(from.length - to.length) === 1) {
    const longer = from.length > to.length ? from : to
    const shorter = from.length > to.length ? to : from
    for (let i = 0; i < longer.length; i++) {
      const removed = longer.slice(0, i) + longer.slice(i + 1)
      if (removed === shorter) return 'add-remove'
    }
  }

  // Rhyme: share a rhyme key
  const phFrom = phonemes[from]
  const phTo = phonemes[to]
  if (phFrom && phTo) {
    const keyFrom = getRhymeKey(phFrom)
    const keyTo = getRhymeKey(phTo)
    if (keyFrom && keyTo && keyFrom === keyTo) return 'rhyme'
  }

  return null
}
