import React, { useState, useRef } from 'react'
import { Plus, Wand2, RotateCcw, CheckCircle2, Trash2, Download, GripVertical, ZoomIn, ZoomOut, Minimize2, Expand } from 'lucide-react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useVenueStore } from '../../store/venueStore'
import VenueCanvas, { CanvasHandle } from '../venues/VenueCanvas'
import Modal from '../ui/Modal'
import AddFromPoolModal from '../ui/AddFromPoolModal'
import { VenueType, VenueConfig, CircleConfig, EllipseConfig, RectangleConfig, UShapeConfig, SortMode, Person } from '../../types'
import { CircleIcon, EllipseIcon, RectangleIcon, UShapeIcon } from '../venues/VenueTypeIcon'
import clsx from 'clsx'

// ── Sortable person row ─────────────────────────────────────────
function SortablePersonRow({
  person, venue, onDelete, groupColor,
}: {
  person: Person
  venue: { id: string; assignments: Record<string, string> }
  onDelete: () => void
  groupColor: string
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: person.id })
  const seated = Object.values(venue.assignments).includes(person.id)
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="person-row"
    >
      <span className="person-drag" {...attributes} {...listeners}><GripVertical size={12} /></span>
      <span className="person-rank">#{person.rank}</span>
      <span className="person-name">{person.name}</span>
      <span className="person-status">
        {seated
          ? <span className="seated-badge" style={{ background: groupColor + '22', color: groupColor }}>已落座</span>
          : <span className="unseated-badge">未落座</span>
        }
      </span>
      <button className="icon-btn danger" style={{ width: 20, height: 20 }} onClick={onDelete}>
        <Trash2 size={10} />
      </button>
    </div>
  )
}

// ── Sortable people list ────────────────────────────────────────
function SortablePeopleList({
  venueId, groupId, members, venue, onDelete, onReorder, groupColor,
}: {
  venueId: string
  groupId: string
  members: Person[]
  venue: { id: string; assignments: Record<string, string> }
  onDelete: (personId: string) => void
  onReorder: (venueId: string, groupId: string, orderedIds: string[]) => void
  groupColor: string
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = members.findIndex(p => p.id === active.id)
    const newIndex = members.findIndex(p => p.id === over.id)
    const reordered = arrayMove(members, oldIndex, newIndex)
    onReorder(venueId, groupId, reordered.map(p => p.id))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={members.map(p => p.id)} strategy={verticalListSortingStrategy}>
        {members.map(p => (
          <SortablePersonRow key={p.id} person={p} venue={venue}
            groupColor={groupColor}
            onDelete={() => onDelete(p.id)} />
        ))}
      </SortableContext>
    </DndContext>
  )
}

function VenueIcon({ type, size }: { type: VenueType; size: number }) {
  if (type === 'circle')    return <CircleIcon size={size} />
  if (type === 'ellipse')   return <EllipseIcon size={size} />
  if (type === 'rectangle') return <RectangleIcon size={size} />
  return <UShapeIcon size={size} />
}

// ─── helpers ───────────────────────────────────────────────────
const SORT_LABELS: Record<SortMode, string> = {
  'center-alternating': '从中间左右交替',
  'clockwise': '顺时针',
  'counter-clockwise': '逆时针',
}

const VENUE_TYPES: { type: VenueType; label: string; desc: string; Icon: React.FC }[] = [
  { type: 'circle',    label: '圆形',   desc: '圆桌·无台上下',   Icon: () => <CircleIcon size={40} /> },
  { type: 'ellipse',   label: '椭圆形', desc: '椭圆桌·无台上下', Icon: () => <EllipseIcon size={40} /> },
  { type: 'rectangle', label: '方形',   desc: '有台上台下',       Icon: () => <RectangleIcon size={40} /> },
  { type: 'u-shape',   label: 'U型',    desc: '有台上台下',       Icon: () => <UShapeIcon size={40} /> },
]

function defaultConfig(type: VenueType): VenueConfig {
  if (type === 'circle')    return { totalSeats: 12, centerSeatIndex: 0 } as CircleConfig
  if (type === 'ellipse')   return { totalSeats: 16, centerSeatIndex: 0 } as EllipseConfig
  if (type === 'rectangle') return { stage: { seats: 5 }, floor: { rows: 5, cols: 8 } } as RectangleConfig
  return { stage: { seats: 5 }, leftArm: { rows: 5, cols: 2 }, rightArm: { rows: 5, cols: 2 }, bottom: { rows: 2, cols: 8 } } as UShapeConfig
}

// ─── venue config form (reused from VenueManagement) ───────────
function ConfigForm({ type, config, onChange }: { type: VenueType; config: VenueConfig; onChange: (c: VenueConfig) => void }) {
  if (type === 'circle' || type === 'ellipse') {
    const c = config as CircleConfig
    return (
      <div className="form-grid">
        <label className="form-label">总座位数
          <input type="number" className="form-input" min={3} max={200} value={c.totalSeats}
            onChange={e => onChange({ ...c, totalSeats: +e.target.value })} />
        </label>
        <label className="form-label">1号参考位索引
          <input type="number" className="form-input" min={0} max={c.totalSeats - 1} value={c.centerSeatIndex}
            onChange={e => onChange({ ...c, centerSeatIndex: +e.target.value })} />
        </label>
      </div>
    )
  }
  if (type === 'rectangle') {
    const c = config as RectangleConfig
    return (
      <div className="form-grid">
        <div className="form-section-title">台上（舞台区）</div>
        <label className="form-label">台上座位数
          <input type="number" className="form-input" min={1} max={30} value={c.stage.seats}
            onChange={e => onChange({ ...c, stage: { seats: +e.target.value } })} />
        </label>
        <div className="form-section-title">台下（观众区）</div>
        <label className="form-label">排数
          <input type="number" className="form-input" min={1} max={30} value={c.floor.rows}
            onChange={e => onChange({ ...c, floor: { ...c.floor, rows: +e.target.value } })} />
        </label>
        <label className="form-label">每排座位数
          <input type="number" className="form-input" min={1} max={30} value={c.floor.cols}
            onChange={e => onChange({ ...c, floor: { ...c.floor, cols: +e.target.value } })} />
        </label>
      </div>
    )
  }
  const c = config as UShapeConfig
  return (
    <div className="form-grid">
      <div className="form-section-title">台上</div>
      <label className="form-label">台上座位数<input type="number" className="form-input" min={1} max={30} value={c.stage.seats} onChange={e => onChange({ ...c, stage: { seats: +e.target.value } })} /></label>
      <div className="form-section-title">左臂</div>
      <label className="form-label">行<input type="number" className="form-input" min={1} max={20} value={c.leftArm.rows} onChange={e => onChange({ ...c, leftArm: { ...c.leftArm, rows: +e.target.value } })} /></label>
      <label className="form-label">列<input type="number" className="form-input" min={1} max={10} value={c.leftArm.cols} onChange={e => onChange({ ...c, leftArm: { ...c.leftArm, cols: +e.target.value } })} /></label>
      <div className="form-section-title">右臂</div>
      <label className="form-label">行<input type="number" className="form-input" min={1} max={20} value={c.rightArm.rows} onChange={e => onChange({ ...c, rightArm: { ...c.rightArm, rows: +e.target.value } })} /></label>
      <label className="form-label">列<input type="number" className="form-input" min={1} max={10} value={c.rightArm.cols} onChange={e => onChange({ ...c, rightArm: { ...c.rightArm, cols: +e.target.value } })} /></label>
      <div className="form-section-title">底部</div>
      <label className="form-label">行<input type="number" className="form-input" min={1} max={10} value={c.bottom.rows} onChange={e => onChange({ ...c, bottom: { ...c.bottom, rows: +e.target.value } })} /></label>
      <label className="form-label">列<input type="number" className="form-input" min={1} max={30} value={c.bottom.cols} onChange={e => onChange({ ...c, bottom: { ...c.bottom, cols: +e.target.value } })} /></label>
    </div>
  )
}

// ─── main component ─────────────────────────────────────────────
export default function SeatingPlan() {
  const { venues, activeVenueId, setActiveVenue, createVenue, deleteVenue,
    runAutoAssign, swapSeats, clearAssignments, updateGroup, addPerson, deletePerson,
    reorderPeople, setActivePage } = useVenueStore()

  const [showNewVenue, setShowNewVenue] = useState(false)
  const [showAddFromPool, setShowAddFromPool] = useState(false)
  const canvasRef = useRef<CanvasHandle>(null)
  const [zoomPct, setZoomPct] = useState(100)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<VenueType>('circle')
  const [newConfig, setNewConfig] = useState<VenueConfig>(defaultConfig('circle'))

  const venue = venues.find(v => v.id === activeVenueId)
  const isRound = venue?.type === 'circle' || venue?.type === 'ellipse'

  // quick-add person state
  const [addName, setAddName] = useState('')
  const [addRank, setAddRank] = useState('')
  const [addGroupId, setAddGroupId] = useState('')

  function handleCreateVenue() {
    if (!newName.trim()) return
    const id = createVenue(newName.trim(), newType, newConfig)
    setActiveVenue(id)
    setShowNewVenue(false)
    setNewName('')
  }

  function handleQuickAdd() {
    if (!venue || !addName.trim() || !addRank) return
    const gid = addGroupId || venue.groups[0]?.id
    if (!gid) return
    addPerson(venue.id, addName.trim(), +addRank, gid)
    setAddName('')
    setAddRank('')
  }

  const stageGroup  = venue?.groups.find(g => g.zone === 'stage')
  const floorGroup  = venue?.groups.find(g => g.zone === 'floor')
  const allGroup    = venue?.groups.find(g => g.zone === 'all')
  const mainGroup   = isRound ? allGroup : undefined

  const stageMembers = stageGroup ? venue!.people.filter(p => p.groupId === stageGroup.id).sort((a,b) => a.rank-b.rank) : []
  const floorMembers = floorGroup ? venue!.people.filter(p => p.groupId === floorGroup.id).sort((a,b) => a.rank-b.rank) : []
  const allMembers   = mainGroup  ? venue!.people.filter(p => p.groupId === mainGroup.id ).sort((a,b) => a.rank-b.rank) : []

  const assignedCount = Object.keys(venue?.assignments ?? {}).length

  const venueInfo = venue
    ? [
        { label: '会场名称', value: venue.name },
        { label: '会场类型', value: VENUE_TYPES.find(t => t.type === venue.type)?.label ?? venue.type },
        ...(isRound
          ? [{ label: '总座位数', value: `${venue.people.length} 人 / ${(venue.config as CircleConfig).totalSeats} 席` }]
          : [
              { label: '台上人数', value: `${stageMembers.length} 人` },
              { label: '台下人数', value: `${floorMembers.length} 人` },
            ]),
        { label: '已落座', value: `${assignedCount} 位` },
        { label: '创建时间', value: new Date(venue.createdAt).toLocaleDateString('zh-CN') },
      ]
    : []

  return (
    <div className="workspace">
      {/* 3-column body */}
      <div className="workspace-body">

        {/* ── LEFT: venue selection ── */}
        <div className="ws-panel">
          <div className="ws-panel-header">
            选择会场
            <button className="btn-primary btn-xs" onClick={() => setShowNewVenue(true)}>
              <Plus size={11} /> 新建
            </button>
          </div>
          <div className="ws-panel-body">
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>会场类型</div>
              <div className="type-grid">
                {VENUE_TYPES.map(t => (
                  <div
                    key={t.type}
                    className={clsx('type-grid-item', venue?.type === t.type && 'active')}
                    onClick={() => {
                      const match = venues.find(v => v.type === t.type)
                      if (match) setActiveVenue(match.id)
                    }}
                  >
                    <div className="vtc-icon"><t.Icon /></div>
                    <span className="type-label">{t.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>已创建会场</div>
            {venues.length === 0 && (
              <div style={{ color: 'var(--text3)', fontSize: 12, padding: '12px 0' }}>暂无会场</div>
            )}
            {venues.map(v => (
              <div
                key={v.id}
                className={clsx('venue-mini-card', activeVenueId === v.id && 'active')}
                onClick={() => setActiveVenue(v.id)}
              >
                <span className="venue-mini-icon"><VenueIcon type={v.type} size={36} /></span>
                <div className="venue-mini-info">
                  <div className="venue-mini-name">{v.name}</div>
                  <div className="venue-mini-meta">{VENUE_TYPES.find(t => t.type === v.type)?.label} · {v.people.length}人</div>
                </div>
                {activeVenueId === v.id && <CheckCircle2 size={14} color="var(--accent)" />}
                <button className="icon-btn danger" style={{ width: 22, height: 22 }}
                  onClick={e => { e.stopPropagation(); deleteVenue(v.id) }}>
                  <Trash2 size={11} />
                </button>
              </div>
            ))}

            {/* Quick-add person */}
            {venue && (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', marginBottom: 8 }}>快速添加人员</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <input className="form-input" placeholder="姓名" value={addName} onChange={e => setAddName(e.target.value)} />
                  <input className="form-input" type="number" placeholder="排名" value={addRank} onChange={e => setAddRank(e.target.value)} />
                  <select className="form-input" value={addGroupId || venue.groups[0]?.id || ''} onChange={e => setAddGroupId(e.target.value)}>
                    {venue.groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                  <button className="btn-primary btn-sm" style={{ width: '100%' }} onClick={handleQuickAdd}>
                    <Plus size={13} /> 添加
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── CENTER: canvas ── */}
        <div className="canvas-panel">
          <div className="canvas-title">
            <span>当前会场：{venue ? venue.name : '未选择'}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {venue && (
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                  点击两个座位互换位置
                </span>
              )}
              {venue && (
                <div className="canvas-zoom-bar" style={{ position: 'static', boxShadow: 'none' }}>
                  <button className="zoom-btn" title="放大" onClick={() => canvasRef.current?.zoomIn()}>
                    <ZoomIn size={14} />
                  </button>
                  <span className="zoom-pct">{zoomPct}%</span>
                  <button className="zoom-btn" title="缩小" onClick={() => canvasRef.current?.zoomOut()}>
                    <ZoomOut size={14} />
                  </button>
                  <button className="zoom-btn" title="重置缩放" onClick={() => canvasRef.current?.reset()}>
                    <RotateCcw size={12} />
                  </button>
                  <button className="zoom-btn" title={isFullscreen ? '退出全屏' : '全屏'} onClick={() => canvasRef.current?.toggleFullscreen()}>
                    {isFullscreen ? <Minimize2 size={13} /> : <Expand size={13} />}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="canvas-area">
            {venue
              ? <VenueCanvas
                  ref={canvasRef}
                  venue={venue}
                  width={520} height={400}
                  onSwap={(a, b) => swapSeats(venue.id, a, b)}
                  onScaleChange={setZoomPct}
                  onFullscreenChange={setIsFullscreen}
                />
              : <div className="empty-state"><div className="empty-icon">🏛</div><p>请先选择或新建会场</p></div>
            }
          </div>

          <div className="canvas-legend">
            {venue?.groups.map(g => (
              <div key={g.id} className="legend-item">
                <span className="legend-dot" style={{ background: g.color }} />
                <span>{g.name}</span>
              </div>
            ))}
            <div className="legend-item">
              <span className="legend-dot" style={{ background: '#1e293b', border: '1px solid #334155' }} />
              <span>未分配</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT: sorting rules + venue info ── */}
        <div className="ws-panel">
          <div className="ws-panel-header">排序规则</div>
          <div className="ws-panel-body">
            {venue?.groups.map(g => (
              <div key={g.id} className="rule-row">
                <div className="rule-label">{g.name}</div>
                <select className="form-input" style={{ fontSize: 12 }} value={g.sortMode}
                  onChange={e => {
                    updateGroup(venue.id, g.id, { sortMode: e.target.value as SortMode })
                    runAutoAssign(venue.id)
                  }}>
                  {(Object.keys(SORT_LABELS) as SortMode[]).map(m => (
                    <option key={m} value={m}>{SORT_LABELS[m]}</option>
                  ))}
                </select>
                {g.sortMode === 'center-alternating' && (
                  <div className="rule-desc">第1名居中，第2名左侧，第3名右侧，依次交替排列。</div>
                )}
                {g.sortMode === 'clockwise' && (
                  <div className="rule-desc">从参考位开始，顺时针方向依次排列。</div>
                )}
                {g.sortMode === 'counter-clockwise' && (
                  <div className="rule-desc">从参考位开始，逆时针方向依次排列。</div>
                )}
              </div>
            ))}

            {venue && (
              <>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', margin: '14px 0 8px', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  会场信息
                </div>
                <table className="info-table">
                  <tbody>
                    {venueInfo.map(row => (
                      <tr key={row.label}>
                        <td>{row.label}</td>
                        <td style={{ color: 'var(--text)', fontWeight: 500 }}>{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>

        {/* ── FAR RIGHT: people lists ── */}
        <div className="ws-panel">
          <div className="ws-panel-header">
            人员列表
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>{venue?.people.length ?? 0}人</span>
              {venue && (
                <button className="btn-primary btn-xs" onClick={() => setShowAddFromPool(true)}>
                  <Download size={11} /> 从人员库选人
                </button>
              )}
            </div>
          </div>
          <div className="ws-panel-body">
            {!venue && <div style={{ color: 'var(--text3)', fontSize: 12 }}>请先选择会场</div>}

            {venue && (isRound ? (
              <div className="people-section">
                <div className="people-section-header">
                  <span className="section-select-all">{allGroup?.name ?? '参会人员'}</span>
                  <span className="people-count-badge">{allMembers.length}</span>
                </div>
                <SortablePeopleList
                  venueId={venue.id} groupId={allGroup?.id ?? ''}
                  members={allMembers} venue={venue}
                  onDelete={pid => deletePerson(venue.id, pid)}
                  onReorder={reorderPeople}
                  groupColor={allGroup?.color ?? '#64748b'}
                />
                {allMembers.length === 0 && <div style={{ color: 'var(--text3)', fontSize: 11, padding: '6px 0' }}>暂无人员，点击「从人员库选人」添加</div>}
              </div>
            ) : (
              <>
                <div className="people-section">
                  <div className="people-section-header">
                    <span className="section-select-all">台上人员</span>
                    <span className="people-count-badge">{stageMembers.length}</span>
                  </div>
                  <SortablePeopleList
                    venueId={venue.id} groupId={stageGroup?.id ?? ''}
                    members={stageMembers} venue={venue}
                    onDelete={pid => deletePerson(venue.id, pid)}
                    onReorder={reorderPeople}
                    groupColor={stageGroup?.color ?? '#64748b'}
                  />
                  {stageMembers.length === 0 && <div style={{ color: 'var(--text3)', fontSize: 11, padding: '6px 0' }}>暂无台上人员</div>}
                </div>
                <div className="people-section">
                  <div className="people-section-header">
                    <span className="section-select-all">台下人员</span>
                    <span className="people-count-badge">{floorMembers.length}</span>
                  </div>
                  <SortablePeopleList
                    venueId={venue.id} groupId={floorGroup?.id ?? ''}
                    members={floorMembers} venue={venue}
                    onDelete={pid => deletePerson(venue.id, pid)}
                    onReorder={reorderPeople}
                    groupColor={floorGroup?.color ?? '#64748b'}
                  />
                  {floorMembers.length === 0 && <div style={{ color: 'var(--text3)', fontSize: 11, padding: '6px 0' }}>暂无台下人员</div>}
                </div>
              </>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom action bar ── */}
      <div className="bottom-bar">
        <button className="btn-ghost" onClick={() => venue && clearAssignments(venue.id)}>
          <RotateCcw size={14} /> 清空排座
        </button>
        <button className="btn-primary" onClick={() => venue && runAutoAssign(venue.id)}>
          <Wand2 size={14} /> 自动生成座位方案
        </button>
        <button className="btn-ghost" onClick={() => setActivePage('preview')}>
          预览与导出方案
        </button>
      </div>

      {/* Add from pool modal */}
      {showAddFromPool && venue && (
        <AddFromPoolModal
          venueId={venue.id}
          groups={venue.groups}
          onClose={() => setShowAddFromPool(false)}
        />
      )}

      {/* New venue modal */}
      {showNewVenue && (
        <Modal title="新建会场" onClose={() => setShowNewVenue(false)} width="500px">
          <div className="form-group">
            <label className="form-label">会场名称
              <input className="form-input" placeholder="如：圆形会场（主会场）"
                value={newName} onChange={e => setNewName(e.target.value)} />
            </label>
          </div>
          <div className="form-group">
            <div className="form-label" style={{ marginBottom: 6 }}>会场类型</div>
            <div className="type-selector">
              {VENUE_TYPES.map(t => (
                <button key={t.type} className={clsx('type-option', newType === t.type && 'active')}
                  onClick={() => { setNewType(t.type); setNewConfig(defaultConfig(t.type)) }}>
                  <div className="vtc-icon"><t.Icon /></div>
                  <span className="type-label">{t.label}</span>
                  <span className="type-desc">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <div className="form-label" style={{ marginBottom: 6 }}>座位配置</div>
            <ConfigForm type={newType} config={newConfig} onChange={setNewConfig} />
          </div>
          <div className="modal-footer">
            <button className="btn-ghost" onClick={() => setShowNewVenue(false)}>取消</button>
            <button className="btn-primary" onClick={handleCreateVenue}>创建会场</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
