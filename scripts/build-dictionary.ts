/**
 * Build script: processes the CMU Pronouncing Dictionary into a compact JSON
 * for the word ladder app. Filters to common English words by intersecting
 * with a general English word list (removes proper nouns, obscure terms).
 *
 * Usage: npx tsx scripts/build-dictionary.ts
 */

import { createRequire } from 'module'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'

const require = createRequire(import.meta.url)
const cmuDict = require('cmu-pronouncing-dictionary') as Record<string, string>
const englishWords: string[] = require('an-array-of-english-words')

// Build a set of common English words for fast lookup
const commonWordSet = new Set(englishWords.map((w: string) => w.toLowerCase()))

function isValidWord(word: string): boolean {
  // Only pure alphabetic, no punctuation, digits, or alternate pronunciations
  if (!/^[a-z]+$/.test(word)) return false
  // Length between 2 and 8 (keeps the game focused on recognizable words)
  if (word.length < 2 || word.length > 8) return false
  // Must appear in the common English word list (filters out proper nouns, jargon)
  if (!commonWordSet.has(word)) return false
  return true
}

function buildDictionary() {
  const words: string[] = []
  const phonemes: Record<string, string> = {}

  for (const [word, phoneme] of Object.entries(cmuDict)) {
    // Skip alternate pronunciations like "word(2)"
    if (word.includes('(')) continue
    if (!isValidWord(word)) continue
    words.push(word)
    phonemes[word] = phoneme
  }

  words.sort()

  console.log(`Total words: ${words.length}`)
  console.log(`Sample words: ${words.slice(0, 30).join(', ')}`)

  // Show length distribution
  const lengthDist: Record<number, number> = {}
  for (const w of words) {
    lengthDist[w.length] = (lengthDist[w.length] || 0) + 1
  }
  console.log('Length distribution:', lengthDist)

  // Spot check: verify common words are present
  const checkWords = ['cat', 'dog', 'run', 'play', 'warm', 'cold', 'love', 'hate', 'fire', 'water']
  const missing = checkWords.filter(w => !words.includes(w))
  if (missing.length > 0) {
    console.warn('WARNING: Missing common words:', missing)
  } else {
    console.log('All check words present')
  }

  const data = { words, phonemes }
  const json = JSON.stringify(data)
  console.log(`JSON size: ${(json.length / 1024).toFixed(1)} KB`)

  const outPath = join(dirname(import.meta.dirname!), 'data', 'dictionary.json')
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, json)
  console.log(`Written to: ${outPath}`)
}

buildDictionary()
