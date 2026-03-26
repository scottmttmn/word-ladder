import type { MoveType, Puzzle } from './types'
import type { WordGraph } from './graph'
import { generatePuzzle } from './generator'
import { mulberry32 } from '../utils/prng'
import { xmur3 } from '../utils/hash'

const ALL_MOVES: MoveType[] = ['classic', 'rhyme', 'anagram', 'add-remove']

// Difficulty varies by day of week (0=Sun ... 6=Sat)
const DAILY_DIFFICULTY: Record<number, number> = {
  0: 3, // Sun - easy
  1: 4,
  2: 4,
  3: 5,
  4: 5,
  5: 6, // Fri - hard
  6: 3, // Sat - easy
}

/**
 * Get the daily puzzle for a given date.
 * Same date always produces the same puzzle (deterministic via seeded PRNG).
 */
export function getDailyPuzzle(
  date: Date,
  graph: WordGraph
): Puzzle | null {
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  const seed = xmur3(dateStr)
  const prng = mulberry32(seed)
  const dayOfWeek = date.getDay()
  const targetLength = DAILY_DIFFICULTY[dayOfWeek] ?? 4

  return generatePuzzle(graph, {
    targetPathLength: targetLength,
    activeMoveTypes: ALL_MOVES,
    prng,
  })
}

/**
 * Format today's date for display.
 */
export function formatDailyDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}
