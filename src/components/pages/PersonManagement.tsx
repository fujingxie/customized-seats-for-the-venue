import { useState } from 'react'
import * as XLSX from 'xlsx'
import { Plus, Trash2, Download, Upload } from 'lucide-react'
import { useVenueStore } from '../../store/venueStore'
import ImportModal from '../ui/ImportModal'

export default function PersonManagement() {
  const { venues, activeVenueId, addPerson, updatePerson, deletePerson,
          bulkDeletePeople, bulkImportPeople } = useVenueStore()
  const venue = venues.find(v => v.id === activeVenueId)

  const [newName,    setNewName]    = useState('')
  const [newRank,    setNewRank]    = useState('')
  const [newGroupId, setNewGroupId] = useState('')
  const [editingId,  setEditingId]  = useState<string | null>(null)
  const [editName,   setEditName]   = useState('')
  const [editRank,   setEditRank]   = useState('')
  const [selected,   setSelected]   = useState<Set<string>>(new Set())
  const [showImport, setShowImport] = useState(false)

  if (!venue) {
    return (
      <div className="page-content">
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <p>请先在「会场管理」中选择一个会场</p>
        </div>
      </div>
    )
  }

  const sortedPeople = [...venue.people].sort((a, b) => {
    const ga = venue.groups.findIndex(g => g.id === a.groupId)
    const gb = venue.groups.findIndex(g => g.id === b.groupId)
    if (ga !== gb) return ga - gb
    return a.rank - b.rank
  })

  const allChecked = sortedPeople.length > 0 && sortedPeople.every(p => selected.has(p.id))
  const someChecked = selected.size > 0

  function toggleAll() {
    if (allChecked) {
      setSelected(new Set())
    } else {
      setSelected(new Set(sortedPeople.map(p => p.id)))
    }
  }

  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleBulkDelete() {
    bulkDeletePeople(venue!.id, [...selected])
    setSelected(new Set())
  }

  function handleAdd() {
    if (!newName.trim() || !newRank || !newGroupId) return
    addPerson(venue!.id, newName.trim(), +newRank, newGroupId)
    setNewName('')
    setNewRank('')
  }

  function handleExport() {
    const rows = [['排名', '姓名', '分组']]
    sortedPeople.forEach(p => {
      const group = venue!.groups.find(g => g.id === p.groupId)
      rows.push([String(p.rank), p.name, group?.name ?? ''])
    })
    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{ wch: 8 }, { wch: 14 }, { wch: 14 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '人员名单')
    XLSX.writeFile(wb, `${venue!.name}-人员名单.xlsx`)
  }

  function startEdit(p: { id: string; name: string; rank: number }) {
    setEditingId(p.id)
    setEditName(p.name)
    setEditRank(String(p.rank))
  }

  function saveEdit(id: string) {
    if (!editName.trim() || !editRank) return
    updatePerson(venue!.id, id, { name: editName.trim(), rank: +editRank })
    setEditingId(null)
  }

  const defaultGroup = venue.groups[0]

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">人员管理</h1>
          <p className="page-desc">
            当前会场：<strong>{venue.name}</strong> · 共 {venue.people.length} 人
          </p>
        </div>
        <div className="header-actions">
          {someChecked && (
            <button className="btn-danger" onClick={handleBulkDelete}>
              <Trash2 size={14} /> 删除选中 ({selected.size})
            </button>
          )}
          <button className="btn-ghost" onClick={() => setShowImport(true)}>
            <Upload size={15} /> 导入
          </button>
          <button className="btn-ghost" onClick={handleExport}>
            <Download size={15} /> 导出 Excel
          </button>
        </div>
      </div>

      {/* Add person form */}
      <div className="add-person-row">
        <input className="form-input" placeholder="姓名" style={{ width: 140 }}
          value={newName} onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()} />
        <input className="form-input" placeholder="排名" type="number" min={1} style={{ width: 80 }}
          value={newRank} onChange={e => setNewRank(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()} />
        <select className="form-input" style={{ width: 160 }}
          value={newGroupId || defaultGroup?.id || ''}
          onChange={e => setNewGroupId(e.target.value)}>
          {venue.groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <button className="btn-primary" onClick={handleAdd}>
          <Plus size={15} /> 添加
        </button>
      </div>

      {/* People table */}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 36 }}>
                <input type="checkbox"
                  className="person-check"
                  checked={allChecked}
                  onChange={toggleAll} />
              </th>
              <th>排名</th>
              <th>姓名</th>
              <th>分组</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {sortedPeople.length === 0 && (
              <tr><td colSpan={5} className="empty-row">暂无人员，点击「导入」或上方表单添加</td></tr>
            )}
            {sortedPeople.map(p => {
              const group = venue.groups.find(g => g.id === p.groupId)
              const isChecked = selected.has(p.id)
              return (
                <tr key={p.id} className={isChecked ? 'tr--checked' : ''}>
                  <td>
                    <input type="checkbox"
                      className="person-check"
                      checked={isChecked}
                      onChange={() => toggleOne(p.id)} />
                  </td>
                  <td>
                    {editingId === p.id
                      ? <input className="form-input inline-input" type="number" value={editRank}
                          onChange={e => setEditRank(e.target.value)} style={{ width: 60 }} />
                      : <span className="rank-badge">{p.rank}</span>
                    }
                  </td>
                  <td>
                    {editingId === p.id
                      ? <input className="form-input inline-input" value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && saveEdit(p.id)} />
                      : p.name
                    }
                  </td>
                  <td>
                    {group && (
                      <span className="group-chip"
                        style={{ background: group.color + '22', color: group.color, borderColor: group.color + '44' }}>
                        {group.name}
                      </span>
                    )}
                  </td>
                  <td className="action-cell">
                    {editingId === p.id ? (
                      <>
                        <button className="btn-primary btn-xs" onClick={() => saveEdit(p.id)}>保存</button>
                        <button className="btn-ghost btn-xs" onClick={() => setEditingId(null)}>取消</button>
                      </>
                    ) : (
                      <>
                        <button className="btn-ghost btn-xs" onClick={() => startEdit(p)}>编辑</button>
                        <button className="icon-btn danger" onClick={() => deletePerson(venue.id, p.id)}>
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showImport && (
        <ImportModal
          venueId={venue.id}
          groups={venue.groups}
          venuePeople={venue.people}
          showLabelInput
          onImport={(entries, groupId, label) => bulkImportPeople(venue!.id, entries, groupId, label)}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  )
}
