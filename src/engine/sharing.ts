import type { MoveType } from './types'
import { MOVE_TYPE_INFO, MOVE_TYPES } from './types'

export interface ShareData {
  startWord: string
  endWord: string
  activeMoveTypes: MoveType[]
  moveCount: number
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
  const params = new URLSearchParams({
    s: data.startWord,
    e: data.endWord,
    m: moveShorts,
    n: String(data.moveCount),
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

    return { startWord, endWord, activeMoveTypes, moveCount }
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
