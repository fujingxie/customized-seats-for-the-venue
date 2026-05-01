import { Venue, Seat, CircleConfig, EllipseConfig, RectangleConfig, UShapeConfig } from '../types'

// Generate all seat definitions for a venue
export function generateSeats(venue: Venue): Seat[] {
  switch (venue.type) {
    case 'circle':
    case 'ellipse':
      return generateCircleSeats(venue.config as CircleConfig)
    case 'rectangle':
      return generateRectangleSeats(venue.config as RectangleConfig)
    case 'u-shape':
      return generateUShapeSeats(venue.config as UShapeConfig)
    default:
      return []
  }
}

function generateCircleSeats(config: CircleConfig): Seat[] {
  return Array.from({ length: config.totalSeats }, (_, i) => ({
    id: `seat-${i}`,
    zone: 'all' as const,
    angle: (i / config.totalSeats) * 360,
  }))
}

function generateRectangleSeats(config: RectangleConfig): Seat[] {
  const seats: Seat[] = []

  for (let i = 0; i < config.stage.seats; i++) {
    seats.push({ id: `stage-${i}`, zone: 'stage', row: 0, col: i })
  }

  for (let r = 0; r < config.floor.rows; r++) {
    for (let c = 0; c < config.floor.cols; c++) {
      seats.push({ id: `floor-r${r}-c${c}`, zone: 'floor', row: r, col: c })
    }
  }

  return seats
}

function generateUShapeSeats(config: UShapeConfig): Seat[] {
  const seats: Seat[] = []

  for (let i = 0; i < config.stage.seats; i++) {
    seats.push({ id: `stage-${i}`, zone: 'stage', row: 0, col: i })
  }

  for (let r = 0; r < config.leftArm.rows; r++) {
    for (let c = 0; c < config.leftArm.cols; c++) {
      seats.push({ id: `left-r${r}-c${c}`, zone: 'floor', row: r, col: c, segment: 'left' })
    }
  }

  for (let r = 0; r < config.rightArm.rows; r++) {
    for (let c = 0; c < config.rightArm.cols; c++) {
      seats.push({ id: `right-r${r}-c${c}`, zone: 'floor', row: r, col: c, segment: 'right' })
    }
  }

  for (let r = 0; r < config.bottom.rows; r++) {
    for (let c = 0; c < config.bottom.cols; c++) {
      seats.push({ id: `bottom-r${r}-c${c}`, zone: 'floor', row: r, col: c, segment: 'bottom' })
    }
  }

  return seats
}

// SVG position for each seat
export interface SeatPosition {
  id: string
  x: number
  y: number
  zone: string
  segment?: string
}

export function getSeatPositions(venue: Venue, width: number, height: number): SeatPosition[] {
  switch (venue.type) {
    case 'circle':
      return getCirclePositions(venue.config as CircleConfig, width, height)
    case 'ellipse':
      return getEllipsePositions(venue.config as EllipseConfig, width, height)
    case 'rectangle':
      return getRectanglePositions(venue.config as RectangleConfig, width, height)
    case 'u-shape':
      return getUShapePositions(venue.config as UShapeConfig, width, height)
    default:
      return []
  }
}

function getCirclePositions(config: CircleConfig, width: number, height: number): SeatPosition[] {
  const cx = width / 2
  const cy = height / 2
  const SEAT_R = 14
  // Table radius: leave enough room so seats fit within the canvas
  const maxR = Math.min(width, height) / 2 - SEAT_R - 8
  const total = config.totalSeats
  // The table takes up ~45% of the available radius; seats sit right outside it
  const tableR = maxR * 0.50
  const seatR = tableR + SEAT_R + 4   // seats hug the table edge

  return Array.from({ length: total }, (_, i) => {
    const angle = ((i / total) * 2 * Math.PI) - Math.PI / 2
    return {
      id: `seat-${i}`,
      x: cx + seatR * Math.cos(angle),
      y: cy + seatR * Math.sin(angle),
      zone: 'all',
    }
  })
}

function getEllipsePositions(config: EllipseConfig, width: number, height: number): SeatPosition[] {
  const cx = width / 2
  const cy = height / 2
  const SEAT_R = 14
  const total = config.totalSeats
  // Table axes; seats positioned just outside
  const tableRx = width  * 0.28
  const tableRy = height * 0.22
  const rx = tableRx + SEAT_R + 4
  const ry = tableRy + SEAT_R + 4

  return Array.from({ length: total }, (_, i) => {
    const angle = ((i / total) * 2 * Math.PI) - Math.PI / 2
    return {
      id: `seat-${i}`,
      x: cx + rx * Math.cos(angle),
      y: cy + ry * Math.sin(angle),
      zone: 'all',
    }
  })
}

// Shared stage-box constants — must match VenueCanvas VenueBackground
const RECT_STAGE_TOP = 12   // y of stage rect top edge
const RECT_STAGE_H   = 52   // height of stage rect (fits seat r=14 with 12px padding)

function getRectanglePositions(config: RectangleConfig, width: number, _height: number): SeatPosition[] {
  const positions: SeatPosition[] = []
  const SEAT_SIZE = 32
  const GAP = 6
  const STEP = SEAT_SIZE + GAP

  // Stage seats — vertically centered inside the stage rect
  const stageY = RECT_STAGE_TOP + RECT_STAGE_H / 2   // = 38
  const stageSeats = config.stage.seats
  const stageTotalWidth = stageSeats * STEP - GAP
  const stageStartX = (width - stageTotalWidth) / 2

  for (let i = 0; i < stageSeats; i++) {
    positions.push({
      id: `stage-${i}`,
      x: stageStartX + i * STEP + SEAT_SIZE / 2,
      y: stageY,
      zone: 'stage',
    })
  }

  // Floor grid — starts below the stage rect
  const { rows, cols } = config.floor
  const floorTotalWidth = cols * STEP - GAP
  const floorStartX = (width - floorTotalWidth) / 2
  const floorTopY = RECT_STAGE_TOP + RECT_STAGE_H + 22  // gap below stage

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      positions.push({
        id: `floor-r${r}-c${c}`,
        x: floorStartX + c * STEP + SEAT_SIZE / 2,
        y: floorTopY + r * STEP + SEAT_SIZE / 2,
        zone: 'floor',
      })
    }
  }

  return positions
}

// U-shape stage box constants — must match VenueCanvas VenueBackground
const USHAPE_STAGE_TOP = 8
const USHAPE_STAGE_H   = 48

function getUShapePositions(config: UShapeConfig, width: number, _height: number): SeatPosition[] {
  const positions: SeatPosition[] = []
  const SEAT_SIZE = 28
  const GAP = 5
  const STEP = SEAT_SIZE + GAP

  // Stage: seats centered inside the stage rect
  const stageSeats = config.stage.seats
  const stageTotalW = stageSeats * STEP - GAP
  const stageX0 = (width - stageTotalW) / 2
  const stageY = USHAPE_STAGE_TOP + USHAPE_STAGE_H / 2   // = 32

  for (let i = 0; i < stageSeats; i++) {
    positions.push({
      id: `stage-${i}`,
      x: stageX0 + i * STEP + SEAT_SIZE / 2,
      y: stageY,
      zone: 'stage',
    })
  }

  const bodyY = USHAPE_STAGE_TOP + USHAPE_STAGE_H + 20   // gap below stage

  // Left arm: vertical strip on the left
  const leftCols = config.leftArm.cols
  const leftRows = config.leftArm.rows
  const leftX0 = 16 + SEAT_SIZE / 2

  for (let r = 0; r < leftRows; r++) {
    for (let c = 0; c < leftCols; c++) {
      positions.push({
        id: `left-r${r}-c${c}`,
        x: leftX0 + c * STEP,
        y: bodyY + r * STEP + SEAT_SIZE / 2,
        zone: 'floor',
        segment: 'left',
      })
    }
  }

  // Right arm: vertical strip on the right
  const rightCols = config.rightArm.cols
  const rightRows = config.rightArm.rows
  const rightX0 = width - 16 - rightCols * STEP + GAP + SEAT_SIZE / 2

  for (let r = 0; r < rightRows; r++) {
    for (let c = 0; c < rightCols; c++) {
      positions.push({
        id: `right-r${r}-c${c}`,
        x: rightX0 + c * STEP,
        y: bodyY + r * STEP + SEAT_SIZE / 2,
        zone: 'floor',
        segment: 'right',
      })
    }
  }

  // Bottom: horizontal strip at bottom
  const botCols = config.bottom.cols
  const botRows = config.bottom.rows
  const armHeight = Math.max(leftRows, rightRows) * STEP
  const botY0 = bodyY + armHeight + 8 + SEAT_SIZE / 2
  const botTotalW = botCols * STEP - GAP
  const botX0 = (width - botTotalW) / 2

  for (let r = 0; r < botRows; r++) {
    for (let c = 0; c < botCols; c++) {
      positions.push({
        id: `bottom-r${r}-c${c}`,
        x: botX0 + c * STEP + SEAT_SIZE / 2,
        y: botY0 + r * STEP,
        zone: 'floor',
        segment: 'bottom',
      })
    }
  }

  return positions
}
