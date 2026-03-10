import type { MoveType, LadderStep } from './types'
import { MOVE_TYPE_INFO, MOVE_TYPES } from './types'

export interface ShareData {
  startWord: string
  endWord: string
  activeMoveTypes: MoveType[]
  moveCount: number
  moveTypeSequence: MoveType[]
}

const SHORT_TO_MOVE: Record<string, MoveType> = {}
for (const mt of MOVE_TYPES) {
  SHORT_TO_MOVE[MOVE_TYPE_INFO[mt].shortCode] = mt
}

/**
 * Encode a puzzle challenge into a URL hash string.
 * Does NOT include the solution — only the puzzle and the sharer's move count.
 */
export function encodeShareUrl(data: ShareData): string {
  const moveShorts = data.activeMoveTypes
    .map(mt => MOVE_TYPE_INFO[mt].shortCode)
    .join(',')
  const typeSeq = data.moveTypeSequence
    .map(mt => MOVE_TYPE_INFO[mt].shortCode)
    .join(',')
  const params = new URLSearchParams({
    s: data.startWord,
    e: data.endWord,
    m: moveShorts,
    n: String(data.moveCount),
    t: typeSeq,
  })
  return `#${params.toString()}`
}

/**
 * Decode a URL hash string into share data.
 * Returns null if the hash is invalid.
 */
export function decodeShareUrl(hash: string): ShareData | null {
  if (!hash || !hash.startsWith('#')) return null
  try {
    const params = new URLSearchParams(hash.slice(1))
    const startWord = params.get('s')
    const endWord = params.get('e')
    const movesStr = params.get('m')
    const moveCountStr = params.get('n')

    if (!startWord || !endWord || !movesStr || !moveCountStr) return null

    const activeMoveTypes = movesStr
      .split(',')
      .map(s => SHORT_TO_MOVE[s])
      .filter((mt): mt is MoveType => mt !== undefined)

    if (activeMoveTypes.length === 0) return null

    const moveCount = parseInt(moveCountStr, 10)
    if (isNaN(moveCount) || moveCount < 1) return null

    const typeSeqStr = params.get('t')
    const moveTypeSequence = typeSeqStr
      ? typeSeqStr
          .split(',')
          .map(s => SHORT_TO_MOVE[s])
          .filter((mt): mt is MoveType => mt !== undefined)
      : []

    return { startWord, endWord, activeMoveTypes, moveCount, moveTypeSequence }
  } catch {
    return null
  }
}

/**
 * Build the full shareable URL for the current page.
 */
export function buildShareUrl(data: ShareData): string {
  const base = window.location.origin + window.location.pathname
  return base + encodeShareUrl(data)
}

const MOVE_EMOJI: Record<MoveType, string> = {
  classic: '🟦',
  rhyme: '🟩',
  anagram: '🟧',
  'add-remove': '🟪',
}

/**
 * Build a Wordle-style share text with emoji graphic + URL.
 * Each row = one move, colored by move type, width = destination word length.
 */
export function buildShareText(
  data: ShareData,
  ladder: LadderStep[],
  optimalLength: number
): string {
  const moveCount = ladder.length - 1
  const startWord = data.startWord.toUpperCase()
  const endWord = data.endWord.toUpperCase()

  const lines: string[] = [
    '🪜 Word Ladder',
    `${startWord} → ${endWord} in ${moveCount} move${moveCount !== 1 ? 's' : ''} (optimal: ${optimalLength})`,
    '',
  ]

  // Build emoji rows: skip first step (start word, moveType is null)
  for (let i = 1; i < ladder.length; i++) {
    const step = ladder[i]
    if (step.moveType) {
      const emoji = MOVE_EMOJI[step.moveType]
      lines.push(emoji.repeat(step.word.length))
    }
  }

  lines.push('')
  lines.push(buildShareUrl(data))

  return lines.join('\n')
}
