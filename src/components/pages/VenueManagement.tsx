import React, { useState } from 'react'
import { Plus, Trash2, CheckCircle2 } from 'lucide-react'
import { useVenueStore } from '../../store/venueStore'
import Modal from '../ui/Modal'
import { VenueType, VenueConfig, CircleConfig, EllipseConfig, RectangleConfig, UShapeConfig } from '../../types'
import { CircleIcon, EllipseIcon, RectangleIcon, UShapeIcon } from '../venues/VenueTypeIcon'
import clsx from 'clsx'

function VenueIcon({ type, size }: { type: VenueType; size: number }) {
  if (type === 'circle')    return <CircleIcon size={size} />
  if (type === 'ellipse')   return <EllipseIcon size={size} />
  if (type === 'rectangle') return <RectangleIcon size={size} />
  return <UShapeIcon size={size} />
}

const VENUE_TYPES: { type: VenueType; label: string; desc: string; Icon: React.FC }[] = [
  { type: 'circle',    label: '圆形会场',   desc: '圆桌，无台上台下之分',     Icon: () => <CircleIcon size={72} /> },
  { type: 'ellipse',   label: '椭圆形会场', desc: '椭圆桌，无台上台下之分',   Icon: () => <EllipseIcon size={72} /> },
  { type: 'rectangle', label: '方形会场',   desc: '有台上台下，支持行列配置', Icon: () => <RectangleIcon size={72} /> },
  { type: 'u-shape',   label: 'U型会场',    desc: '有台上台下，支持三段配置', Icon: () => <UShapeIcon size={72} /> },
]

function ConfigForm({ type, config, onChange }: {
  type: VenueType
  config: VenueConfig
  onChange: (c: VenueConfig) => void
}) {
  if (type === 'circle' || type === 'ellipse') {
    const c = config as CircleConfig
    return (
      <div className="form-grid">
        <label className="form-label">总座位数
          <input type="number" className="form-input" min={3} max={200}
            value={c.totalSeats}
            onChange={e => onChange({ ...c, totalSeats: +e.target.value })} />
        </label>
        <label className="form-label">1号参考位（索引 0 开始）
          <input type="number" className="form-input" min={0} max={c.totalSeats - 1}
            value={c.centerSeatIndex}
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
          <input type="number" className="form-input" min={1} max={30}
            value={c.stage.seats}
            onChange={e => onChange({ ...c, stage: { seats: +e.target.value } })} />
        </label>
        <div className="form-section-title">台下（观众区）</div>
        <label className="form-label">排数（行）
          <input type="number" className="form-input" min={1} max={30}
            value={c.floor.rows}
            onChange={e => onChange({ ...c, floor: { ...c.floor, rows: +e.target.value } })} />
        </label>
        <label className="form-label">列数（每排座位数）
          <input type="number" className="form-input" min={1} max={30}
            value={c.floor.cols}
            onChange={e => onChange({ ...c, floor: { ...c.floor, cols: +e.target.value } })} />
        </label>
      </div>
    )
  }

  if (type === 'u-shape') {
    const c = config as UShapeConfig
    return (
      <div className="form-grid">
        <div className="form-section-title">台上（舞台区）</div>
        <label className="form-label">台上座位数
          <input type="number" className="form-input" min={1} max={30}
            value={c.stage.seats}
            onChange={e => onChange({ ...c, stage: { seats: +e.target.value } })} />
        </label>
        <div className="form-section-title">左臂</div>
        <label className="form-label">行数
          <input type="number" className="form-input" min={1} max={20}
            value={c.leftArm.rows}
            onChange={e => onChange({ ...c, leftArm: { ...c.leftArm, rows: +e.target.value } })} />
        </label>
        <label className="form-label">列数
          <input type="number" className="form-input" min={1} max={10}
            value={c.leftArm.cols}
            onChange={e => onChange({ ...c, leftArm: { ...c.leftArm, cols: +e.target.value } })} />
        </label>
        <div className="form-section-title">右臂</div>
        <label className="form-label">行数
          <input type="number" className="form-input" min={1} max={20}
            value={c.rightArm.rows}
            onChange={e => onChange({ ...c, rightArm: { ...c.rightArm, rows: +e.target.value } })} />
        </label>
        <label className="form-label">列数
          <input type="number" className="form-input" min={1} max={10}
            value={c.rightArm.cols}
            onChange={e => onChange({ ...c, rightArm: { ...c.rightArm, cols: +e.target.value } })} />
        </label>
        <div className="form-section-title">底部</div>
        <label className="form-label">行数
          <input type="number" className="form-input" min={1} max={10}
            value={c.bottom.rows}
            onChange={e => onChange({ ...c, bottom: { ...c.bottom, rows: +e.target.value } })} />
        </label>
        <label className="form-label">列数
          <input type="number" className="form-input" min={1} max={30}
            value={c.bottom.cols}
            onChange={e => onChange({ ...c, bottom: { ...c.bottom, cols: +e.target.value } })} />
        </label>
      </div>
    )
  }

  return null
}

function defaultConfig(type: VenueType): VenueConfig {
  if (type === 'circle') return { totalSeats: 12, centerSeatIndex: 0 } as CircleConfig
  if (type === 'ellipse') return { totalSeats: 16, centerSeatIndex: 0 } as EllipseConfig
  if (type === 'rectangle') return { stage: { seats: 5 }, floor: { rows: 5, cols: 8 } } as RectangleConfig
  return {
    stage: { seats: 5 },
    leftArm: { rows: 5, cols: 2 },
    rightArm: { rows: 5, cols: 2 },
    bottom: { rows: 2, cols: 8 },
  } as UShapeConfig
}

export default function VenueManagement() {
  const { venues, activeVenueId, createVenue, deleteVenue, setActiveVenue, setActivePage } = useVenueStore()
  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState('')
  const [selectedType, setSelectedType] = useState<VenueType>('circle')
  const [config, setConfig] = useState<VenueConfig>(defaultConfig('circle'))

  function handleTypeChange(t: VenueType) {
    setSelectedType(t)
    setConfig(defaultConfig(t))
  }

  function handleCreate() {
    if (!name.trim()) return
    const id = createVenue(name.trim(), selectedType, config)
    setActiveVenue(id)
    setShowModal(false)
    setName('')
    setSelectedType('circle')
    setConfig(defaultConfig('circle'))
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">会场管理</h1>
          <p className="page-desc">创建并选择当前工作会场</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> 新建会场
        </button>
      </div>

      <div className="venue-grid">
        {venues.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🏛</div>
            <p>还没有会场，点击右上角新建一个吧</p>
          </div>
        )}
        {venues.map(v => (
          <div
            key={v.id}
            className={clsx('venue-card', activeVenueId === v.id && 'active')}
            onClick={() => setActiveVenue(v.id)}
          >
            <div className="venue-card-top">
              <div className="venue-type-badge"><VenueIcon type={v.type} size={40} /></div>
              {activeVenueId === v.id && <CheckCircle2 size={18} className="check-icon" />}
            </div>
            <div className="venue-card-name">{v.name}</div>
            <div className="venue-card-meta">
              {VENUE_TYPES.find(t => t.type === v.type)?.label} · {v.people.length} 人
            </div>
            <div className="venue-card-actions">
              <button
                className="btn-primary btn-sm"
                onClick={e => { e.stopPropagation(); setActiveVenue(v.id); setActivePage('seating') }}
              >
                排座
              </button>
              <button
                className="icon-btn danger"
                onClick={e => { e.stopPropagation(); deleteVenue(v.id) }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <Modal title="新建会场" onClose={() => setShowModal(false)} width="520px">
          <div className="form-group">
            <label className="form-label">会场名称
              <input className="form-input" placeholder="如：圆形会场（主会场）"
                value={name} onChange={e => setName(e.target.value)} />
            </label>
          </div>
          <div className="form-group">
            <div className="form-label">会场类型</div>
            <div className="type-selector">
              {VENUE_TYPES.map(t => (
                <button
                  key={t.type}
                  className={clsx('type-option', selectedType === t.type && 'active')}
                  onClick={() => handleTypeChange(t.type)}
                >
                  <div className="vtc-icon"><t.Icon /></div>
                  <span className="type-label">{t.label}</span>
                  <span className="type-desc">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <div className="form-label">座位配置</div>
            <ConfigForm type={selectedType} config={config} onChange={setConfig} />
          </div>
          <div className="modal-footer">
            <button className="btn-ghost" onClick={() => setShowModal(false)}>取消</button>
            <button className="btn-primary" onClick={handleCreate}>创建会场</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
