import { useState } from 'react'
import * as XLSX from 'xlsx'
import { Plus, Trash2, Download, Upload } from 'lucide-react'
import { useVenueStore } from '../../store/venueStore'
import ImportModal from '../ui/ImportModal'

export default function PersonManagement() {
  const {
    globalPeople,
    addGlobalPerson,
    updateGlobalPerson,
    deleteGlobalPerson,
    deleteGlobalPeople,
    bulkImportGlobalPeople,
  } = useVenueStore()

  const [newName,    setNewName]    = useState('')
  const [newLabel,   setNewLabel]   = useState('')
  const [editingId,  setEditingId]  = useState<string | null>(null)
  const [editName,   setEditName]   = useState('')
  const [editLabel,  setEditLabel]  = useState('')
  const [selected,   setSelected]   = useState<Set<string>>(new Set())
  const [showImport, setShowImport] = useState(false)
  const [filterLabel, setFilterLabel] = useState<string>('全部')

  // Unique labels from the pool
  const allLabels = ['全部', ...Array.from(new Set(globalPeople.map(p => p.label).filter((l): l is string => !!l)))]

  const filtered = filterLabel === '全部'
    ? globalPeople
    : globalPeople.filter(p => p.label === filterLabel)

  const allChecked = filtered.length > 0 && filtered.every(p => selected.has(p.id))
  const someChecked = selected.size > 0

  function toggleAll() {
    if (allChecked) {
      setSelected(prev => {
        const next = new Set(prev)
        filtered.forEach(p => next.delete(p.id))
        return next
      })
    } else {
      setSelected(prev => {
        const next = new Set(prev)
        filtered.forEach(p => next.add(p.id))
        return next
      })
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
    deleteGlobalPeople([...selected])
    setSelected(new Set())
  }

  function handleAdd() {
    if (!newName.trim()) return
    addGlobalPerson(newName.trim(), newLabel.trim() || undefined)
    setNewName('')
    setNewLabel('')
  }

  function handleExport() {
    const rows = [['姓名', '标签']]
    globalPeople.forEach(p => rows.push([p.name, p.label ?? '']))
    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{ wch: 14 }, { wch: 20 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '人员库')
    XLSX.writeFile(wb, '全局人员库.xlsx')
  }

  function startEdit(p: { id: string; name: string; label?: string }) {
    setEditingId(p.id)
    setEditName(p.name)
    setEditLabel(p.label ?? '')
  }

  function saveEdit(id: string) {
    if (!editName.trim()) return
    updateGlobalPerson(id, { name: editName.trim(), label: editLabel.trim() || undefined })
    setEditingId(null)
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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

      {/* Label filter pills */}
      {allLabels.length > 1 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
          {allLabels.map(l => (
            <button
              key={l}
              className={`label-pill${filterLabel === l ? ' active' : ''}`}
              onClick={() => setFilterLabel(l)}
            >
              {l}
              {l !== '全部' && (
                <span className="pill-count">{globalPeople.filter(p => p.label === l).length}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Add person form */}
      <div className="add-person-row">
        <input
          className="form-input"
          placeholder="姓名"
          style={{ width: 140 }}
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <input
          className="form-input"
          placeholder="标签（如公司名，可留空）"
          style={{ flex: 1 }}
          value={newLabel}
          onChange={e => setNewLabel(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
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
                <input
                  type="checkbox"
                  className="person-check"
                  checked={allChecked}
                  onChange={toggleAll}
                />
              </th>
              <th>姓名</th>
              <th>标签</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="empty-row">
                  {globalPeople.length === 0
                    ? '暂无人员，点击「导入」或上方表单添加'
                    : '该标签下暂无人员'}
                </td>
              </tr>
            )}
            {filtered.map(p => {
              const isChecked = selected.has(p.id)
              return (
                <tr key={p.id} className={isChecked ? 'tr--checked' : ''}>
                  <td>
                    <input
                      type="checkbox"
                      className="person-check"
                      checked={isChecked}
                      onChange={() => toggleOne(p.id)}
                    />
                  </td>
                  <td>
                    {editingId === p.id ? (
                      <input
                        className="form-input inline-input"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && saveEdit(p.id)}
                      />
                    ) : (
                      p.name
                    )}
                  </td>
                  <td>
                    {editingId === p.id ? (
                      <input
                        className="form-input inline-input"
                        placeholder="标签（可留空）"
                        value={editLabel}
                        onChange={e => setEditLabel(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && saveEdit(p.id)}
                      />
                    ) : (
                      p.label && (
                        <span
                          className="group-chip"
                          style={{ background: 'var(--accent)18', color: 'var(--accent)', borderColor: 'var(--accent)44' }}
                        >
                          {p.label}
                        </span>
                      )
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
                        <button className="icon-btn danger" onClick={() => deleteGlobalPerson(p.id)}>
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
          venueId=""
          groups={[]}
          showLabelInput
          onImport={(entries, _groupId, label) => bulkImportGlobalPeople(entries, label)}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  )
}
