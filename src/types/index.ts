export type VenueType = 'circle' | 'ellipse' | 'rectangle' | 'u-shape'
export type SortMode = 'center-alternating' | 'clockwise' | 'counter-clockwise'
export type Zone = 'stage' | 'floor' | 'all'

export interface GlobalPerson {
  id: string
  name: string
  label?: string  // e.g. company name
}

export interface CircleConfig {
  totalSeats: number
  centerSeatIndex: number
}

export interface EllipseConfig {
  totalSeats: number
  centerSeatIndex: number
}

export interface RectangleConfig {
  stage: { seats: number }
  floor: { rows: number; cols: number }
}

export interface UShapeConfig {
  stage: { seats: number }
  leftArm: { rows: number; cols: number }
  rightArm: { rows: number; cols: number }
  bottom: { rows: number; cols: number }
}

export type VenueConfig = CircleConfig | EllipseConfig | RectangleConfig | UShapeConfig

export interface Person {
  id: string
  name: string
  rank: number
  groupId: string        // zone group (台上嘉宾组 / 参会人员组)
  label?: string         // custom tag set at import time (e.g. company name)
  globalPersonId?: string // reference to GlobalPerson.id if added from pool
}

export interface Group {
  id: string
  name: string
  zone: Zone
  sortMode: SortMode
  color: string
}

export interface Seat {
  id: string
  zone: Zone
  row?: number
  col?: number
  angle?: number   // for circle/ellipse
  segment?: string // for u-shape: 'left' | 'right' | 'bottom'
}

export interface Venue {
  id: string
  name: string
  type: VenueType
  config: VenueConfig
  groups: Group[]
  people: Person[]
  assignments: Record<string, string> // seatId -> personId
  createdAt: string
  updatedAt: string
}

export type Page = 'venues' | 'people' | 'seating' | 'preview'
