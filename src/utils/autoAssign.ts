import { Venue, Seat, SortMode, CircleConfig, RectangleConfig, UShapeConfig } from '../types'
import { getCircleOrder, getGridOrder, getStraightRowOrder } from './sortAlgorithm'
import { generateSeats } from './seatLayout'

export function autoAssign(venue: Venue): Record<string, string> {
  const assignments: Record<string, string> = {}
  const seats = generateSeats(venue)

  if (venue.type === 'circle' || venue.type === 'ellipse') {
    assignCircle(venue, seats, assignments)
  } else if (venue.type === 'rectangle') {
    assignZone(venue, seats, 'stage', assignments)
    assignZone(venue, seats, 'floor', assignments)
  } else if (venue.type === 'u-shape') {
    assignZone(venue, seats, 'stage', assignments)
    assignUShapeFloor(venue, seats, assignments)
  }

  return assignments
}

function assignCircle(venue: Venue, seats: Seat[], assignments: Record<string, string>) {
  const group = venue.groups.find(g => g.zone === 'all')
  if (!group) return

  const config = venue.config as CircleConfig
  const people = venue.people
    .filter(p => p.groupId === group.id)
    .sort((a, b) => a.rank - b.rank)

  const order = getCircleOrder(seats.length, config.centerSeatIndex, group.sortMode)

  people.forEach((person, i) => {
    if (i < order.length) {
      const seatId = `seat-${order[i]}`
      assignments[seatId] = person.id
    }
  })
}

function assignZone(
  venue: Venue,
  seats: Seat[],
  zone: 'stage' | 'floor',
  assignments: Record<string, string>
) {
  const group = venue.groups.find(g => g.zone === zone)
  if (!group) return

  const zonePeople = venue.people
    .filter(p => p.groupId === group.id)
    .sort((a, b) => a.rank - b.rank)

  const zoneSeats = seats.filter(s => s.zone === zone)

  if (zone === 'stage') {
    const total = zoneSeats.length
    const order = getStraightRowOrder(total, zonePeople.length, group.sortMode)
    zonePeople.forEach((person, i) => {
      if (i < order.length) {
        assignments[zoneSeats[order[i]].id] = person.id
      }
    })
  } else if (venue.type === 'rectangle') {
    const config = venue.config as RectangleConfig
    const { rows, cols } = config.floor
    const gridOrder = getGridOrder(rows, cols, zonePeople.length, group.sortMode)
    gridOrder.forEach(([r, c], i) => {
      if (i < zonePeople.length) {
        assignments[`floor-r${r}-c${c}`] = zonePeople[i].id
      }
    })
  }
}

function assignUShapeFloor(venue: Venue, _seats: Seat[], assignments: Record<string, string>) {
  const group = venue.groups.find(g => g.zone === 'floor')
  if (!group) return

  const config = venue.config as UShapeConfig
  const people = venue.people
    .filter(p => p.groupId === group.id)
    .sort((a, b) => a.rank - b.rank)

  const mode: SortMode = group.sortMode

  // Assign left arm first, then right arm, then bottom
  const segments: Array<{ key: string; rows: number; cols: number }> = [
    { key: 'left', rows: config.leftArm.rows, cols: config.leftArm.cols },
    { key: 'right', rows: config.rightArm.rows, cols: config.rightArm.cols },
    { key: 'bottom', rows: config.bottom.rows, cols: config.bottom.cols },
  ]

  let personIdx = 0

  for (const seg of segments) {
    const count = Math.min(seg.rows * seg.cols, people.length - personIdx)
    if (count <= 0) break

    const gridOrder = getGridOrder(seg.rows, seg.cols, count, mode)
    for (const [r, c] of gridOrder) {
      if (personIdx >= people.length) break
      assignments[`${seg.key}-r${r}-c${c}`] = people[personIdx++].id
    }
  }
}
