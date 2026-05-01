// SVG floor-plan illustrations for each venue type — scales cleanly at any size

const TABLE   = '#dbeafe'
const TBORDER = '#93c5fd'
const SEAT    = '#bfdbfe'
const SBORDER = '#60a5fa'

interface IconProps { size?: number }

// Derive pixel constants from size so icons stay proportional at any size
function cfg(size: number) {
  const s  = Math.max(3, Math.round(size * 0.09))   // seat square side
  const g  = Math.max(2, Math.round(size * 0.045))  // gap between seats
  const sh = Math.max(5, Math.round(size * 0.13))   // stage bar height
  return { s, g, step: s + g, sh }
}

// ── Circle ──────────────────────────────────────────────────────
export function CircleIcon({ size = 80 }: IconProps) {
  const cx = size / 2, cy = size / 2
  const { s } = cfg(size)
  const tableR = size * 0.22
  const seatR  = tableR + s + 2
  const n = size < 56 ? 8 : 12
  const seats = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * 2 * Math.PI - Math.PI / 2
    return { x: cx + seatR * Math.cos(a), y: cy + seatR * Math.sin(a) }
  })
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={tableR} fill={TABLE} stroke={TBORDER} strokeWidth={1.2} />
      {seats.map((seat, i) => (
        <rect key={i} x={seat.x - s/2} y={seat.y - s/2} width={s} height={s}
          rx={1} fill={SEAT} stroke={SBORDER} strokeWidth={0.8} />
      ))}
    </svg>
  )
}

// ── Ellipse ──────────────────────────────────────────────────────
export function EllipseIcon({ size = 80 }: IconProps) {
  const cx = size / 2
  const { s } = cfg(size)
  const h = size * 0.75
  const cy = h / 2
  const trx = size * 0.28, try_ = h * 0.28
  const srx = trx + s + 2, sry = try_ + s + 2
  const n = size < 56 ? 8 : 14
  const seats = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * 2 * Math.PI - Math.PI / 2
    return { x: cx + srx * Math.cos(a), y: cy + sry * Math.sin(a) }
  })
  return (
    <svg width={size} height={h} viewBox={`0 0 ${size} ${h}`}>
      <ellipse cx={cx} cy={cy} rx={trx} ry={try_} fill={TABLE} stroke={TBORDER} strokeWidth={1.2} />
      {seats.map((seat, i) => (
        <rect key={i} x={seat.x - s/2} y={seat.y - s/2} width={s} height={s}
          rx={1} fill={SEAT} stroke={SBORDER} strokeWidth={0.8} />
      ))}
    </svg>
  )
}

// ── Rectangle ────────────────────────────────────────────────────
export function RectangleIcon({ size = 80 }: IconProps) {
  const W = size, H = size
  const { s, g, step, sh } = cfg(size)
  const small = size < 56
  const stageW = W * 0.55
  const stageX = (W - stageW) / 2
  const stageY = Math.round(size * 0.07)

  const cols = small ? 3 : 4
  const rows = small ? 3 : 4
  const gridW = cols * step - g
  const gridX = (W - gridW) / 2
  const gridY = stageY + sh + Math.round(size * 0.10)

  const seats: { x: number; y: number }[] = []
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      seats.push({ x: gridX + c * step, y: gridY + r * step })

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <rect x={3} y={3} width={W-6} height={H-6} rx={3}
        fill="none" stroke="#e2e8f0" strokeWidth={1} strokeDasharray="3 3" />
      <rect x={stageX} y={stageY} width={stageW} height={sh}
        rx={2} fill={TABLE} stroke={TBORDER} strokeWidth={1.2} />
      {seats.map((seat, i) => (
        <rect key={i} x={seat.x} y={seat.y} width={s} height={s}
          rx={1} fill={SEAT} stroke={SBORDER} strokeWidth={0.8} />
      ))}
    </svg>
  )
}

// ── U-Shape ──────────────────────────────────────────────────────
export function UShapeIcon({ size = 80 }: IconProps) {
  const W = size, H = size
  const { s, g, step, sh } = cfg(size)
  const small = size < 56
  const stageW = W * 0.5
  const stageX = (W - stageW) / 2
  const stageY = Math.round(size * 0.07)

  const armRows = small ? 3 : 4
  const armCols = small ? 1 : 2
  const botCols = small ? 3 : 5
  const armY = stageY + sh + Math.round(size * 0.09)
  const armH = armRows * step

  const leftSeats: { x: number; y: number }[] = []
  for (let r = 0; r < armRows; r++)
    for (let c = 0; c < armCols; c++)
      leftSeats.push({ x: Math.round(size * 0.07) + c * step, y: armY + r * step })

  const rightX = W - Math.round(size * 0.07) - armCols * step + g
  const rightSeats: { x: number; y: number }[] = []
  for (let r = 0; r < armRows; r++)
    for (let c = 0; c < armCols; c++)
      rightSeats.push({ x: rightX + c * step, y: armY + r * step })

  const botY = armY + armH + Math.round(size * 0.04)
  const botW = botCols * step - g
  const botX = (W - botW) / 2
  const botSeats = Array.from({ length: botCols }, (_, c) => ({ x: botX + c * step, y: botY }))

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <rect x={stageX} y={stageY} width={stageW} height={sh}
        rx={2} fill={TABLE} stroke={TBORDER} strokeWidth={1.2} />
      {leftSeats.map((seat, i)  => <rect key={`l${i}`} x={seat.x} y={seat.y} width={s} height={s} rx={1} fill={SEAT} stroke={SBORDER} strokeWidth={0.8} />)}
      {rightSeats.map((seat, i) => <rect key={`r${i}`} x={seat.x} y={seat.y} width={s} height={s} rx={1} fill={SEAT} stroke={SBORDER} strokeWidth={0.8} />)}
      {botSeats.map((seat, i)   => <rect key={`b${i}`} x={seat.x} y={seat.y} width={s} height={s} rx={1} fill={SEAT} stroke={SBORDER} strokeWidth={0.8} />)}
    </svg>
  )
}

// ── Theater ──────────────────────────────────────────────────────
export function TheaterIcon({ size = 80 }: IconProps) {
  const W = size, H = size
  const { s, g, step, sh } = cfg(size)
  const small = size < 56
  const stageW = W * 0.5
  const stageX = (W - stageW) / 2
  const stageY = Math.round(size * 0.07)
  const baseY = stageY + sh + Math.round(size * 0.09)

  const rows = small
    ? [{ cols: 3 }, { cols: 4 }, { cols: 5 }]
    : [{ cols: 5 }, { cols: 6 }, { cols: 7 }, { cols: 7 }, { cols: 8 }]

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <rect x={stageX} y={stageY} width={stageW} height={sh}
        rx={2} fill={TABLE} stroke={TBORDER} strokeWidth={1.2} />
      {rows.map((row, ri) => {
        const rowW = row.cols * step - g
        const x0 = (W - rowW) / 2
        return Array.from({ length: row.cols }, (_, c) => (
          <rect key={`${ri}-${c}`}
            x={x0 + c * step} y={baseY + ri * step} width={s} height={s}
            rx={1} fill={SEAT} stroke={SBORDER} strokeWidth={0.8} />
        ))
      })}
    </svg>
  )
}
