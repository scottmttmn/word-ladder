import type { MoveType } from './types'
import { MOVE_TYPE_INFO, MOVE_TYPES } from './types'

export interface ShareData {
  startWord: string
  endWord: string
  activeMoveTypes: MoveType[]
  path: string[]
}

const SHORT_TO_MOVE: Record<string, MoveType> = {}
for (const mt of MOVE_TYPES) {
  SHORT_TO_MOVE[MOVE_TYPE_INFO[mt].shortCode] = mt
}

/**
 * Encode a completed puzzle solution into a URL hash string.
 */
export function encodeShareUrl(data: ShareData): string {
  const moveShorts = data.activeMoveTypes
    .map(mt => MOVE_TYPE_INFO[mt].shortCode)
    .join(',')
  const params = new URLSearchParams({
    s: data.startWord,
    e: data.endWord,
    m: moveShorts,
    p: data.path.join(','),
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
    const pathStr = params.get('p')

    if (!startWord || !endWord || !movesStr || !pathStr) return null

    const activeMoveTypes = movesStr
      .split(',')
      .map(s => SHORT_TO_MOVE[s])
      .filter((mt): mt is MoveType => mt !== undefined)

    if (activeMoveTypes.length === 0) return null

    const path = pathStr.split(',').filter(w => w.length > 0)
    if (path.length < 2) return null
    if (path[0] !== startWord || path[path.length - 1] !== endWord) return null

    return { startWord, endWord, activeMoveTypes, path }
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
