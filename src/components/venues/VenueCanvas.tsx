import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Venue } from '../../types'
import { getSeatPositions, SeatPosition } from '../../utils/seatLayout'

const SEAT_R = 14
const MIN_SCALE = 0.4
const MAX_SCALE = 5.0

interface Props {
  venue: Venue
  width?: number
  height?: number
  onSwap?: (seatA: string, seatB: string) => void
  readonly?: boolean
  onScaleChange?: (pct: number) => void
  onFullscreenChange?: (fs: boolean) => void
}

export interface CanvasHandle {
  zoomIn: () => void
  zoomOut: () => void
  reset: () => void
  toggleFullscreen: () => void
}

function getSeatColor(seatId: string, venue: Venue): string {
  const personId = venue.assignments[seatId]
  if (!personId) return ''
  const person = venue.people.find(p => p.id === personId)
  if (!person) return '#6366f1'
  const group = venue.groups.find(g => g.id === person.groupId)
  return group?.color ?? '#6366f1'
}

function VenueBackground({ venue, width, height }: { venue: Venue; width: number; height: number }) {
  const type = venue.type
  const cx = width / 2
  const cy = height / 2

  if (type === 'circle') {
    const maxR = Math.min(width, height) / 2 - SEAT_R - 8
    const tableR = maxR * 0.50
    return (
      <g>
        <circle cx={cx} cy={cy} r={tableR + SEAT_R * 2 + 10}
          fill="none" stroke="#e2e8f0" strokeWidth={1} strokeDasharray="5 4" />
        <circle cx={cx} cy={cy} r={tableR}
          fill="#dbeafe" stroke="#93c5fd" strokeWidth={1.5} />
        <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
          fontSize={12} fill="#3b82f6" fontFamily="'Noto Sans SC', sans-serif" fontWeight="500">圆桌</text>
      </g>
    )
  }
  if (type === 'ellipse') {
    const tableRx = width * 0.28, tableRy = height * 0.22
    return (
      <g>
        <ellipse cx={cx} cy={cy} rx={tableRx + SEAT_R * 2 + 10} ry={tableRy + SEAT_R * 2 + 10}
          fill="none" stroke="#e2e8f0" strokeWidth={1} strokeDasharray="5 4" />
        <ellipse cx={cx} cy={cy} rx={tableRx} ry={tableRy}
          fill="#dbeafe" stroke="#93c5fd" strokeWidth={1.5} />
        <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
          fontSize={12} fill="#3b82f6" fontFamily="'Noto Sans SC', sans-serif" fontWeight="500">椭圆桌</text>
      </g>
    )
  }
  if (type === 'rectangle') {
    return (
      <g>
        <rect x={14} y={14} width={width - 28} height={height - 28}
          rx={6} fill="#f8fafc" stroke="#e2e8f0" strokeWidth={1} strokeDasharray="5 4" />
        <rect x={14} y={12} width={width - 28} height={52}
          rx={6} fill="#dbeafe" stroke="#93c5fd" strokeWidth={1.5} />
        <text x={30} y={20} textAnchor="start" dominantBaseline="middle"
          fontSize={10} fill="#3b82f6" fontFamily="'Noto Sans SC', sans-serif" fontWeight="600">台上（舞台）</text>
      </g>
    )
  }
  if (type === 'u-shape') {
    return (
      <g>
        <rect x={14} y={8} width={width - 28} height={48}
          rx={6} fill="#dbeafe" stroke="#93c5fd" strokeWidth={1.5} />
        <text x={30} y={17} textAnchor="start" dominantBaseline="middle"
          fontSize={10} fill="#3b82f6" fontFamily="'Noto Sans SC', sans-serif" fontWeight="600">台上（舞台）</text>
      </g>
    )
  }
  return null
}

function SeatNode({ pos, venue, selected, onClick }: {
  pos: SeatPosition; venue: Venue; selected: boolean; onClick: () => void
}) {
  const personId = venue.assignments[pos.id]
  const person   = venue.people.find(p => p.id === personId)
  const color    = getSeatColor(pos.id, venue)
  const isEmpty  = !personId
  const shortName = person?.name
    ? person.name.length > 3 ? person.name.slice(0, 3) : person.name
    : ''
  const fillColor   = isEmpty ? '#f1f5f9' : color
  const strokeColor = selected ? '#f59e0b' : isEmpty ? '#cbd5e1' : color

  return (
    <g data-seat="true" onClick={onClick} style={{ cursor: isEmpty ? 'default' : 'pointer' }}>
      <circle cx={pos.x} cy={pos.y} r={SEAT_R} fill={fillColor} stroke={strokeColor}
        strokeWidth={selected ? 2.5 : isEmpty ? 1 : 1.5}
        style={{ filter: selected ? 'drop-shadow(0 0 6px #f59e0b)' : !isEmpty ? `drop-shadow(0 0 4px ${color}60)` : 'none' }} />
      {!isEmpty && (
        <text x={pos.x} y={pos.y + 1} textAnchor="middle" dominantBaseline="middle"
          fontSize={shortName.length > 2 ? 7 : 8} fill="white"
          fontFamily="'Noto Sans SC', sans-serif" fontWeight="600"
          style={{ pointerEvents: 'none', userSelect: 'none' }}>{shortName}</text>
      )}
      {isEmpty && (
        <text x={pos.x} y={pos.y + 1} textAnchor="middle" dominantBaseline="middle"
          fontSize={7} fill="#94a3b8" style={{ pointerEvents: 'none', userSelect: 'none' }}>空</text>
      )}
      {person && (
        <g>
          <circle cx={pos.x + 10} cy={pos.y - 10} r={6.5} fill="white" stroke={color} strokeWidth={1.5} />
          <text x={pos.x + 10} y={pos.y - 9} textAnchor="middle" dominantBaseline="middle"
            fontSize={6.5} fill={color} fontWeight="700"
            style={{ pointerEvents: 'none', userSelect: 'none' }}>{person.rank}</text>
        </g>
      )}
    </g>
  )
}

const VenueCanvas = forwardRef<CanvasHandle, Props>(function VenueCanvas(
  { venue, width = 560, height = 420, onSwap, readonly, onScaleChange, onFullscreenChange },
  ref
) {
  const [selected, setSelected] = useState<string | null>(null)
  const [view, setView]         = useState({ scale: 1, ox: 0, oy: 0 })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [ready, setReady] = useState(false)

  const dragRef        = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null)
  const movedRef       = useRef(false)
  const wrapperRef     = useRef<HTMLDivElement>(null)
  const containerRef   = useRef<HTMLDivElement>(null)
  const fittedRef      = useRef(false)

  // Seat positions are always calculated for the FIXED prop dimensions (not screen size)
  const positions = getSeatPositions(venue, width, height)
  const { scale, ox, oy } = view

  // Reset fit when venue changes
  useEffect(() => {
    fittedRef.current = false
    setReady(false)
    setSelected(null)
  }, [venue.id])

  // Auto fit-to-container using ResizeObserver (fires once with real size)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      if (fittedRef.current || document.fullscreenElement) return
      const W = entry.contentRect.width
      const H = entry.contentRect.height
      if (W > 0 && H > 0) {
        const fitScale = Math.min(W / width, H / height) * 0.88
        setView({
          scale: fitScale,
          ox: (W - width  * fitScale) / 2,
          oy: (H - height * fitScale) / 2,
        })
        fittedRef.current = true
        setReady(true)
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [venue.id, width, height])

  // Fullscreen lifecycle
  useEffect(() => {
    function onFsChange() {
      const fs = !!document.fullscreenElement
      setIsFullscreen(fs)
      onFullscreenChange?.(fs)

      if (fs) {
        // Zoom to fit: scale the 520×400 canvas so it fills ~90% of the screen
        const W = window.innerWidth
        const H = window.innerHeight
        const fitScale = Math.min(W / width, H / height) * 0.90
        setView({
          scale: fitScale,
          ox: (W - width  * fitScale) / 2,
          oy: (H - height * fitScale) / 2,
        })
      } else {
        setView({ scale: 1, ox: 0, oy: 0 })
      }
    }
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [onFullscreenChange, width, height])

  // Notify parent of scale changes
  useEffect(() => {
    onScaleChange?.(Math.round(scale * 100))
  }, [scale, onScaleChange])

  // ── zoom helpers ───────────────────────────────────────────────
  function zoomAt(delta: number, cx: number, cy: number) {
    setView(v => {
      const next  = Math.max(MIN_SCALE, Math.min(MAX_SCALE, v.scale * delta))
      const ratio = next / v.scale
      return { scale: next, ox: cx - (cx - v.ox) * ratio, oy: cy - (cy - v.oy) * ratio }
    })
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault()
    const rect = containerRef.current!.getBoundingClientRect()
    zoomAt(e.deltaY < 0 ? 1.1 : 1 / 1.1, e.clientX - rect.left, e.clientY - rect.top)
  }

  function handleZoomBtn(delta: number) {
    const rect = containerRef.current?.getBoundingClientRect()
    const cx = rect ? rect.width  / 2 : width  / 2
    const cy = rect ? rect.height / 2 : height / 2
    zoomAt(delta, cx, cy)
  }

  function resetView() { setView({ scale: 1, ox: 0, oy: 0 }) }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      wrapperRef.current?.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  useImperativeHandle(ref, () => ({
    zoomIn:  () => handleZoomBtn(1.2),
    zoomOut: () => handleZoomBtn(1 / 1.2),
    reset:   resetView,
    toggleFullscreen,
  }))

  // ── pan handlers ───────────────────────────────────────────────
  function handlePointerDown(e: React.PointerEvent) {
    if ((e.target as Element).closest('[data-seat]')) return
    dragRef.current = { startX: e.clientX, startY: e.clientY, ox, oy }
    movedRef.current = false
    ;(e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) movedRef.current = true
    setView(v => ({ ...v, ox: dragRef.current!.ox + dx, oy: dragRef.current!.oy + dy }))
  }

  function handlePointerUp() { dragRef.current = null }

  // ── seat click ─────────────────────────────────────────────────
  function handleSeatClick(seatId: string) {
    if (readonly || movedRef.current) return
    if (!selected) { setSelected(seatId); return }
    if (selected === seatId) { setSelected(null); return }
    onSwap?.(selected, seatId)
    setSelected(null)
  }

  return (
    <div
      ref={wrapperRef}
      className="venue-canvas-wrapper"
      style={{ position: 'relative', width: '100%', height: '100%', opacity: ready ? 1 : 0 }}
    >
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          cursor: dragRef.current ? 'grabbing' : 'grab',
        }}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{
            background: 'transparent',
            transform: `translate(${ox}px, ${oy}px) scale(${scale})`,
            transformOrigin: '0 0',
            transition: dragRef.current ? 'none' : 'transform 0.08s ease-out',
          }}
        >
          <VenueBackground venue={venue} width={width} height={height} />
          {positions.map(pos => (
            <SeatNode key={pos.id} pos={pos} venue={venue}
              selected={selected === pos.id}
              onClick={() => handleSeatClick(pos.id)} />
          ))}
          {selected && (
            <text x={width / 2} y={height - 6} textAnchor="middle"
              fontSize={11} fill="#f59e0b" fontFamily="'Noto Sans SC', sans-serif">
              已选中，点击另一个座位完成互换
            </text>
          )}
        </svg>
      </div>

      {isFullscreen && (
        <div style={{
          position: 'absolute', bottom: 16, right: 16,
          fontSize: 11, color: '#94a3b8',
          background: 'rgba(15,23,42,0.6)',
          borderRadius: 6, padding: '4px 10px',
          pointerEvents: 'none',
        }}>
          按 Esc 退出全屏
        </div>
      )}
    </div>
  )
})

export default VenueCanvas
