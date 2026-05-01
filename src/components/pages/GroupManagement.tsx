import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useVenueStore } from '../../store/venueStore'
import { Zone, SortMode } from '../../types'
import clsx from 'clsx'

const SORT_LABELS: Record<SortMode, string> = {
  'center-alternating': '从中间左右交替',
  'clockwise': '顺时针',
  'counter-clockwise': '逆时针',
}

const ZONE_LABELS: Record<Zone, string> = {
  stage: '台上',
  floor: '台下',
  all: '全场（圆桌）',
}

const GROUP_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16']

export default function GroupManagement() {
  const { venues, activeVenueId, addGroup, updateGroup, deleteGroup } = useVenueStore()
  const venue = venues.find(v => v.id === activeVenueId)

  const [newName, setNewName] = useState('')
  const [newZone, setNewZone] = useState<Zone>('floor')
  const [newSort, setNewSort] = useState<SortMode>('center-alternating')

  if (!venue) {
    return (
      <div className="page-content">
        <div className="empty-state">
          <div className="empty-icon">📂</div>
          <p>请先在「会场管理」中选择一个会场</p>
        </div>
      </div>
    )
  }

  const isRound = venue.type === 'circle' || venue.type === 'ellipse'

  function handleAdd() {
    if (!newName.trim()) return
    addGroup(venue!.id, newName.trim(), newZone, newSort)
    setNewName('')
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">分组管理</h1>
          <p className="page-desc">
            当前会场：<strong>{venue.name}</strong> · {venue.groups.length} 个分组
          </p>
        </div>
      </div>

      {/* Add group */}
      <div className="add-person-row">
        <input className="form-input" placeholder="分组名称" style={{ width: 160 }}
          value={newName} onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()} />
        {!isRound && (
          <select className="form-input" style={{ width: 130 }}
            value={newZone} onChange={e => setNewZone(e.target.value as Zone)}>
            <option value="stage">台上</option>
            <option value="floor">台下</option>
          </select>
        )}
        <select className="form-input" style={{ width: 180 }}
          value={newSort} onChange={e => setNewSort(e.target.value as SortMode)}>
          {(Object.keys(SORT_LABELS) as SortMode[]).map(m => (
            <option key={m} value={m}>{SORT_LABELS[m]}</option>
          ))}
        </select>
        <button className="btn-primary" onClick={handleAdd}>
          <Plus size={15} /> 添加分组
        </button>
      </div>

      <div className="group-list">
        {venue.groups.map((g) => {
          const memberCount = venue.people.filter(p => p.groupId === g.id).length
          return (
            <div key={g.id} className="group-card">
              <div className="group-card-color" style={{ background: g.color }} />
              <div className="group-card-body">
                <div className="group-card-name">{g.name}</div>
                <div className="group-card-meta">
                  <span className="zone-chip">{ZONE_LABELS[g.zone]}</span>
                  <span className="sort-chip">{SORT_LABELS[g.sortMode]}</span>
                  <span className="member-count">{memberCount} 人</span>
                </div>
              </div>
              <div className="group-card-controls">
                {/* Sort mode selector */}
                <select
                  className="form-input inline-select"
                  value={g.sortMode}
                  onChange={e => updateGroup(venue!.id, g.id, { sortMode: e.target.value as SortMode })}
                >
                  {(Object.keys(SORT_LABELS) as SortMode[]).map(m => (
                    <option key={m} value={m}>{SORT_LABELS[m]}</option>
                  ))}
                </select>
                {/* Color picker */}
                <div className="color-row">
                  {GROUP_COLORS.map(c => (
                    <button
                      key={c}
                      className={clsx('color-dot', g.color === c && 'active')}
                      style={{ background: c, outline: g.color === c ? `2px solid ${c}` : 'none', outlineOffset: 2 }}
                      onClick={() => updateGroup(venue!.id, g.id, { color: c })}
                    />
                  ))}
                </div>
                <button
                  className="icon-btn danger"
                  onClick={() => deleteGroup(venue!.id, g.id)}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
