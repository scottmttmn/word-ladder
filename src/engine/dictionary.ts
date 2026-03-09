import type { DictionaryData } from './types'
import rawData from '../../data/dictionary.json'

let cachedWordSet: Set<string> | null = null

export function loadDictionary(): DictionaryData {
  return rawData as DictionaryData
}

export function getWordSet(data: DictionaryData): Set<string> {
  if (!cachedWordSet) {
    cachedWordSet = new Set(data.words)
  }
  return cachedWordSet
}

export function isValidWord(word: string, wordSet: Set<string>): boolean {
  return wordSet.has(word.toLowerCase())
}
