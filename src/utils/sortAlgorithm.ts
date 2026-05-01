import { SortMode } from '../types'

// Returns seat indices in assignment order for a straight row of `total` seats
// with `count` people to assign
export function getStraightRowOrder(total: number, _count: number, mode: SortMode): number[] {
  const indices: number[] = []

  if (mode === 'center-alternating') {
    const center = Math.floor((total - 1) / 2)
    indices.push(center)
    let left = center - 1
    let right = center + 1
    while (indices.length < total) {
      if (left >= 0) indices.push(left--)
      if (right < total) indices.push(right++)
    }
  } else if (mode === 'clockwise') {
    for (let i = 0; i < total; i++) indices.push(i)
  } else {
    for (let i = total - 1; i >= 0; i--) indices.push(i)
  }

  // Truncate to count, but keep the "empty" positions for incomplete rows
  return indices
}

// For a grid (rows x cols), returns seat [row, col] pairs in assignment order
// Handles incomplete last rows based on sort mode
export function getGridOrder(
  rows: number,
  cols: number,
  count: number,
  mode: SortMode
): Array<[number, number]> {
  const result: Array<[number, number]> = []
  let assigned = 0

  for (let r = 0; r < rows && assigned < count; r++) {
    const remaining = count - assigned
    const seatsThisRow = Math.min(cols, remaining)
    const rowOrder = getRowAssignmentPositions(cols, seatsThisRow, mode)

    for (const col of rowOrder) {
      result.push([r, col])
      assigned++
    }
  }

  return result
}

// Returns the column positions (within a row of `total` cols) for `count` people
// Incomplete rows always fill left-to-right (sequential), regardless of sort mode
function getRowAssignmentPositions(total: number, count: number, mode: SortMode): number[] {
  if (count === total) {
    // Full row: respect the chosen sort mode
    return getStraightRowOrder(total, count, mode)
  }

  // Incomplete row: always sequential left-to-right
  return Array.from({ length: count }, (_, i) => i)
}

// For circle/ellipse: returns seat indices in order starting from centerIdx
export function getCircleOrder(
  total: number,
  centerIdx: number,
  mode: SortMode
): number[] {
  const indices: number[] = []

  if (mode === 'center-alternating') {
    indices.push(centerIdx)
    let left = 1
    let right = 1
    while (indices.length < total) {
      const lIdx = ((centerIdx - left) + total) % total
      const rIdx = (centerIdx + right) % total
      indices.push(lIdx)
      left++
      if (indices.length < total) {
        indices.push(rIdx)
        right++
      }
    }
  } else if (mode === 'clockwise') {
    for (let i = 0; i < total; i++) {
      indices.push((centerIdx + i) % total)
    }
  } else {
    for (let i = 0; i < total; i++) {
      indices.push(((centerIdx - i) + total) % total)
    }
  }

  return indices
}
