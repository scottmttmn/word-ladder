/**
 * Build script: processes the common English word list into a compact JSON
 * for the word ladder app. Adds CMU phoneme data where available (for rhyme
 * support). Words without phonemes still work for all other move types.
 *
 * Usage: npx tsx scripts/build-dictionary.ts
 */

import { createRequire } from 'module'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'

const require = createRequire(import.meta.url)
const cmuDict = require('cmu-pronouncing-dictionary') as Record<string, string>
const englishWords: string[] = require('an-array-of-english-words')

function isValidWord(word: string): boolean {
  // Only pure alphabetic, no punctuation or digits
  if (!/^[a-z]+$/.test(word)) return false
  // Length between 2 and 8 (keeps the game focused on recognizable words)
  if (word.length < 2 || word.length > 8) return false
  return true
}

function buildDictionary() {
  const words: string[] = []
  const phonemes: Record<string, string> = {}

  for (const word of englishWords) {
    const w = word.toLowerCase()
    if (!isValidWord(w)) continue
    words.push(w)
    // Add phoneme data from CMU if available (for rhyme support)
    const phoneme = cmuDict[w]
    if (phoneme) {
      phonemes[w] = phoneme
    }
  }

  words.sort()

  const phonemeCount = Object.keys(phonemes).length
  console.log(`Total words: ${words.length}`)
  console.log(`Words with phonemes: ${phonemeCount} / ${words.length} (${((phonemeCount / words.length) * 100).toFixed(1)}%)`)
  console.log(`Sample words: ${words.slice(0, 30).join(', ')}`)

  // Show length distribution
  const lengthDist: Record<number, number> = {}
  for (const w of words) {
    lengthDist[w.length] = (lengthDist[w.length] || 0) + 1
  }
  console.log('Length distribution:', lengthDist)

  // Spot check: verify common words are present
  const checkWords = ['cat', 'dog', 'run', 'play', 'warm', 'cold', 'love', 'hate', 'fire', 'water', 'clove', 'miso']
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
