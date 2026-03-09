export type MoveType = 'classic' | 'rhyme' | 'anagram' | 'add-remove'

export const MOVE_TYPES: MoveType[] = ['classic', 'rhyme', 'anagram', 'add-remove']

export interface MoveTypeInfo {
  id: MoveType
  label: string
  color: string
  shortCode: string
}

export const MOVE_TYPE_INFO: Record<MoveType, MoveTypeInfo> = {
  classic: { id: 'classic', label: 'Letter Swap', color: 'var(--color-classic)', shortCode: 'c' },
  rhyme: { id: 'rhyme', label: 'Rhyme', color: 'var(--color-rhyme)', shortCode: 'r' },
  anagram: { id: 'anagram', label: 'Anagram', color: 'var(--color-anagram)', shortCode: 'a' },
  'add-remove': { id: 'add-remove', label: 'Add/Remove', color: 'var(--color-add-remove)', shortCode: 'd' },
}

export interface LadderStep {
  word: string
  moveType: MoveType | null // null for the starting word
}

export interface Puzzle {
  startWord: string
  endWord: string
  activeMoveTypes: MoveType[]
  optimalLength: number // number of steps (edges) in shortest path
}

export interface DictionaryData {
  words: string[]
  phonemes: Record<string, string>
}
