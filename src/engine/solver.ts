import type { MoveType } from './types'
import type { WordGraph } from './graph'
import { getNeighbors } from './graph'

export interface SolverResult {
  path: string[] | null
  pathLength: number
}

/**
 * BFS shortest path between two words using the active move types.
 * Returns the path (including start and end) or null if unreachable.
 */
export function findShortestPath(
  start: string,
  end: string,
  graph: WordGraph,
  activeMoveTypes: MoveType[]
): SolverResult {
  if (start === end) {
    return { path: [start], pathLength: 0 }
  }

  if (!graph.wordSet.has(start) || !graph.wordSet.has(end)) {
    return { path: null, pathLength: 0 }
  }

  const visited = new Map<string, string | null>()
  visited.set(start, null)
  const queue: string[] = [start]
  let head = 0

  while (head < queue.length) {
    const current = queue[head++]

    for (const neighbor of getNeighbors(current, graph, activeMoveTypes)) {
      if (visited.has(neighbor)) continue
      visited.set(neighbor, current)

      if (neighbor === end) {
        // Reconstruct path
        const path: string[] = []
        let node: string | null = end
        while (node !== null) {
          path.push(node)
          node = visited.get(node) ?? null
        }
        path.reverse()
        return { path, pathLength: path.length - 1 }
      }

      queue.push(neighbor)
    }
  }

  return { path: null, pathLength: 0 }
}
