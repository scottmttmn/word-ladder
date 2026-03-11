# Test Coverage Analysis

## Current State

The test suite (`tests/engine/engine.test.ts`) contains **26 tests across 7 suites**, all focused on happy-path behavior of the core engine. Several modules have zero test coverage and the existing tests have meaningful gaps.

---

## Untested Modules (Zero Coverage)

### 1. `src/utils/prng.ts` and `src/utils/hash.ts`

`mulberry32` and `xmur3` are foundational to the daily puzzle system — the daily puzzle's determinism depends entirely on them — yet neither has any tests.

Key properties worth verifying:
- Same seed always produces the same sequence from `mulberry32`
- `mulberry32` output is always in `[0, 1)`
- Different seeds produce different sequences
- `xmur3` returns consistent values for the same string
- `xmur3` returns different values for different strings
- `xmur3` handles empty string input

### 2. `src/engine/daily.ts` — `formatDailyDate`

`getDailyPuzzle` has basic tests but `formatDailyDate` is never called in any test. It also has an untested code path: the `?? 4` fallback for an unknown day-of-week (line 32) can never trigger given the current `DAILY_DIFFICULTY` map covers all 7 days, but the intent of the difficulty-per-day mapping itself is never verified. No test checks that e.g. Sunday (`getDay() === 0`) produces a puzzle with `optimalLength === 3` or that Friday produces `optimalLength === 6`.

### 3. `src/engine/sharing.ts` — `buildShareText`

`encodeShareUrl` and `decodeShareUrl` are tested, but `buildShareText` — which builds the Wordle-style emoji output users actually share — has no tests at all. This function has meaningful logic: it counts moves from the ladder, selects the right emoji per move type, and repeats it `word.length` times per step. It also skips the first ladder step (the start word). None of this is verified.

`buildShareUrl` is also untested (it references `window.location`, so it would need a mock, but that's not a reason to skip it).

### 4. `src/hooks/useGame.ts`

The entire game state management layer is untested. This hook contains the most complex application logic — the reducer has 12 action types, and the callbacks coordinate dictionary loading, puzzle generation, word validation, move classification, and URL parsing. None of this is covered.

High-value areas:
- `SUBMIT_WORD` action: validates against `wordSet`, classifies the move, appends to ladder, triggers `VICTORY` when `endWord` is reached
- `TOGGLE_MOVE_TYPE` action: cannot toggle off the last active move type
- `UNDO` action: removes the last ladder step (but not the start word)
- `LOAD_SHARED` action: parses a URL hash into `ShareData`, validates words
- Error state transitions: `SET_ERROR` / `CLEAR_ERROR` round-trip
- `startFreeplay` with custom start/end words vs. generated puzzle
- Phase transitions: `loading → menu → playing → victory`

### 5. React Components

All nine components in `src/components/` are untested. While full UI testing is a large undertaking, the highest-value targets are:

- **`WordInput`**: Validates and submits words; user-facing error feedback
- **`MoveTypeToggles`**: Toggling behavior; disabled state when only one type remains
- **`VictoryModal`**: Share button triggers clipboard copy; emoji text rendering
- **`MenuScreen`**: Difficulty selection, mode toggling

---

## Gaps in Existing Tests

### `src/engine/dictionary.ts` — `isValidWord` untested

`isValidWord` normalizes input to lowercase before checking the set, but this is never tested. A test with uppercase input (`"CAT"`, `"Cat"`) would verify the normalization. The `getWordSet` cache (module-level `cachedWordSet`) is also never exercised across two calls — if the cache had a bug, the tests wouldn't catch it.

### `src/engine/moves.ts` — Individual neighbor functions never called directly

The tests exercise `classifyMove` and `getNeighbors` but never call `getClassicNeighbors`, `getRhymeNeighbors`, `getAnagramNeighbors`, or `getAddRemoveNeighbors` directly. This matters because:

- **`getAddRemoveNeighbors`** has a `candidate.length >= 2` minimum-length guard. Removing a letter from a 2-letter word would produce a 1-letter string that should be rejected — this path is never triggered.
- **`getRhymeNeighbors`** returns `[]` when the word has no phoneme entry (`phonemes[word]` is undefined). This path is untested.
- **`getRhymeKey`** has a two-stage fallback: it first looks for a stressed vowel (stress mark 1 or 2), then falls back to any vowel, then returns `null` if no vowel exists. Only the first stage is exercised by the existing `getRhymeKey` tests. The fallback and the `null` return are never triggered.

### `src/engine/moves.ts` — `classifyMove` edge cases

- **Same word**: `classifyMove('cat', 'cat', phonemes)` — classic fails (0 diffs), anagram fails (`from !== to` guard), add-remove fails (length diff = 0), but rhyme would match since both share the same phoneme and therefore the same rhyme key. This means identical words return `'rhyme'`, which may or may not be intentional.
- **Words with zero phoneme data**: If neither word has a phoneme entry, the rhyme branch returns `null` — never tested explicitly.

### `src/engine/graph.ts` — `getNeighbors` edge cases

- **Empty `activeMoveTypes` array**: Passing `[]` should return an empty array. This is never tested and is a realistic mistake a caller could make.
- **Deduplication across move types**: A word that is simultaneously a classic neighbor *and* a rhyme neighbor (e.g. `cat`→`hat`: one-letter change and same rhyme) should appear only once when both types are active. The deduplication logic in `getNeighbors` (via the `seen` set) is never exercised by a test that specifically checks for it.

### `src/engine/solver.ts` — Words not in graph

`findShortestPath` has an early-exit guard on line 24: if either word is not in `graph.wordSet`, it returns `{path: null, pathLength: 0}`. This guard is never explicitly tested. A test with a made-up word like `'xyzzy'` would cover this path.

### `src/engine/generator.ts` — Failure case and custom PRNG

- The `prng` option in `GeneratorOptions` is never used in tests — the custom PRNG path is untested.
- `generatePuzzle` returns `null` after 100 failed attempts. This failure path is never exercised. An impossible configuration (e.g. `targetPathLength: 100` with only `['anagram']`) should reliably return `null`.
- No test verifies that the returned puzzle's `startWord` and `endWord` are actually `GOOD_PUZZLE_WORDS` (the common-word preference logic).

### `src/engine/sharing.ts` — `decodeShareUrl` edge cases

- **Zero or negative `moveCount`**: The guard `moveCount < 1` should return `null` for `n=0`, but this is never tested.
- **All-unknown short codes**: If the `m=` parameter contains only unrecognized codes (all filtered out), `activeMoveTypes` becomes empty and the function returns `null`. This path is untested.
- **`NaN` move count**: `parseInt('abc', 10)` returns `NaN`; the `isNaN` check should return `null`. Untested.

### `src/engine/daily.ts` — Difficulty by day of week

The three existing daily puzzle tests only check today's puzzle, determinism, and variance. They never verify that the day-of-week difficulty schedule is respected. A test using `new Date('2025-06-15')` (a Sunday) should check `puzzle.optimalLength === 3`, and one using a Friday date should check `optimalLength === 6`.

---

## Priority Recommendations

Ordered by risk/value:

1. **Utils (`prng`, `hash`)** — These are pure functions with no dependencies, trivial to test, and are the foundation of daily puzzle determinism. High value, low effort.

2. **`isValidWord` and `getWordSet` caching** — Small gaps in an already-tested module. Quick wins.

3. **`buildShareText`** — Pure function with meaningful formatting logic. No mocks needed. Medium effort, catches real bugs.

4. **`classifyMove` edge cases and `getRhymeKey` fallback paths** — Targeted additions to existing test suites.

5. **`findShortestPath` with words not in graph** — One-liner test covering an explicit guard.

6. **`getNeighbors` with empty move types and deduplication** — Validates correctness guarantees callers rely on.

7. **`generatePuzzle` failure case and custom PRNG** — Verifies the null return and the determinism of seeded generation.

8. **`getDailyPuzzle` difficulty-per-day** — Pins the day-of-week schedule to prevent accidental regressions.

9. **`decodeShareUrl` invalid input variants** — Fills gaps in the URL parsing contract.

10. **`useGame` reducer** — Highest complexity, highest value, but requires a test harness for React hooks (e.g. `@testing-library/react`). Worth the setup cost given how much logic lives here.
