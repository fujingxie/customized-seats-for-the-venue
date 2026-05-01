import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { useVenueStore } from '../../store/venueStore'
import { Group } from '../../types'
import Modal from './Modal'
import clsx from 'clsx'

interface Props {
  venueId: string
  groups: Group[]
  onClose: () => void
}

export default function AddFromPoolModal({ venueId, groups, onClose }: Props) {
  const { globalPeople, venues, addFromPool } = useVenueStore()
  const venue = venues.find(v => v.id === venueId)

  const [selectedLabel, setSelectedLabel] = useState<string>('全部')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [targetGroupId, setTargetGroupId] = useState(groups[0]?.id ?? '')

  // Collect unique labels from global pool
  const labels = ['全部', ...Array.from(new Set(globalPeople.map(p => p.label).filter((l): l is string => !!l)))]

  const filtered = selectedLabel === '全部'
    ? globalPeople
    : globalPeople.filter(p => p.label === selectedLabel)

  // IDs already added to this venue (by globalPersonId)
  const alreadyAdded = new Set(
    (venue?.people ?? []).map(p => p.globalPersonId).filter(Boolean) as string[]
  )

  function toggleOne(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    const selectable = filtered.filter(p => !alreadyAdded.has(p.id))
    const allSelected = selectable.length > 0 && selectable.every(p => selectedIds.has(p.id))
    if (allSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev)
        selectable.forEach(p => next.delete(p.id))
        return next
      })
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev)
        selectable.forEach(p => next.add(p.id))
        return next
      })
    }
  }

  function handleConfirm() {
    if (!selectedIds.size || !targetGroupId) return

    const group = groups.find(g => g.id === targetGroupId)
    if (!group) return

    // Compute base rank: max existing rank in that group + 1
    const existingInGroup = (venue?.people ?? []).filter(p => p.groupId === targetGroupId)
    const baseRank = existingInGroup.length > 0
      ? Math.max(...existingInGroup.map(p => p.rank)) + 1
      : 1

    const items = globalPeople
      .filter(p => selectedIds.has(p.id))
      .map((p, i) => ({
        globalPersonId: p.id,
        name: p.name,
        label: p.label,
        rank: baseRank + i,
      }))

    addFromPool(venueId, items, targetGroupId)
    onClose()
  }

  const selectableInView = filtered.filter(p => !alreadyAdded.has(p.id))
  const allViewSelected = selectableInView.length > 0 && selectableInView.every(p => selectedIds.has(p.id))

  return (
    <Modal title="从人员库选人" onClose={onClose} width="480px">
      {/* Label filter pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {labels.map(l => (
          <button
            key={l}
            className={clsx('label-pill', selectedLabel === l && 'active')}
            onClick={() => setSelectedLabel(l)}
          >
            {l}
            {l !== '全部' && (
              <span className="pill-count">{globalPeople.filter(p => p.label === l).length}</span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {globalPeople.length === 0 ? (
        <div style={{ color: 'var(--text3)', fontSize: 13, padding: '24px 0', textAlign: 'center' }}>
          人员库为空，请先在「人员管理」中添加人员
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ color: 'var(--text3)', fontSize: 13, padding: '16px 0', textAlign: 'center' }}>
          该标签下暂无人员
        </div>
      ) : (
        <div className="cross-list">
          <div className="cross-list-header">
            <label className="cross-check-label">
              <input
                type="checkbox"
                checked={allViewSelected}
                onChange={toggleAll}
              />
              全选可用（{selectableInView.length} 人）
            </label>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>已选 {selectedIds.size} 人</span>
          </div>
          <div className="cross-list-body">
            {filtered.map(p => {
              const added = alreadyAdded.has(p.id)
              return (
                <label
                  key={p.id}
                  className={clsx('cross-check-label', added && 'cross-check-label--disabled')}
                  style={added ? { opacity: 0.45, cursor: 'not-allowed' } : {}}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(p.id)}
                    disabled={added}
                    onChange={() => !added && toggleOne(p.id)}
                  />
                  <span style={{ flex: 1 }}>{p.name}</span>
                  {p.label && (
                    <span style={{
                      fontSize: 10,
                      color: 'var(--accent)',
                      background: 'var(--accent)18',
                      borderRadius: 3,
                      padding: '1px 5px',
                    }}>
                      {p.label}
                    </span>
                  )}
                  {added && (
                    <span style={{ fontSize: 10, color: 'var(--text3)', marginLeft: 4 }}>已添加</span>
                  )}
                </label>
              )
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="import-footer">
        <div className="import-group-select">
          <span className="import-group-label">添加到区域：</span>
          <select
            className="form-input"
            style={{ flex: 1, fontSize: 12 }}
            value={targetGroupId}
            onChange={e => setTargetGroupId(e.target.value)}
          >
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>取消</button>
          <button
            className="btn-primary"
            disabled={selectedIds.size === 0}
            onClick={handleConfirm}
          >
            {selectedIds.size > 0
              ? <><CheckCircle2 size={14} /> 添加 {selectedIds.size} 人</>
              : '请先选择人员'
            }
          </button>
        </div>
      </div>
    </Modal>
  )
}
