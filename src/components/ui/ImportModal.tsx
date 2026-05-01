import React, { useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { Upload, FileText, AlertCircle, CheckCircle2, Download, Tag } from 'lucide-react'
import { Group, Person, Venue } from '../../types'
import Modal from './Modal'
import clsx from 'clsx'

interface ImportEntry { name: string; rank: number }

interface Props {
  venueId: string
  groups: Group[]                        // zone groups (台上 / 台下)
  venuePeople?: Person[]                 // existing people — for 分组导入 tab
  showLabelInput?: boolean               // PersonManagement: show label text input
  onImport: (entries: ImportEntry[], groupId: string, label?: string) => void
  onBulkUpdateZone?: (personIds: string[], groupId: string) => void
  onClose: () => void
  // kept for compat but unused now (cross-venue removed)
  allVenues?: Venue[]
}

type Tab = 'excel' | 'text' | 'bylabel'

// ── Excel helpers ───────────────────────────────────────────────
function parseExcel(file: File): Promise<ImportEntry[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(ws, { defval: '' })
        if (rows.length === 0) { resolve([]); return }

        const headers = Object.keys(rows[0])
        const nameCol = headers.find(h => /名字|姓名|name/i.test(h))
        const rankCol = headers.find(h => /序号|排名|rank|顺序/i.test(h))

        if (!nameCol) { reject(new Error('未找到姓名列，请确认第一行包含"姓名"标题')); return }

        const entries: ImportEntry[] = rows
          .map((row, i) => ({
            name: String(row[nameCol] ?? '').trim(),
            rank: rankCol ? (parseInt(String(row[rankCol])) || i + 1) : i + 1,
          }))
          .filter(e => e.name)
        resolve(entries)
      } catch {
        reject(new Error('文件解析失败，请检查格式'))
      }
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsArrayBuffer(file)
  })
}

function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['姓名', '序号'],
    ['张三', 1],
    ['李四', 2],
    ['王五', 3],
    ['赵六', 4],
  ])
  ws['!cols'] = [{ wch: 12 }, { wch: 8 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '人员名单')
  XLSX.writeFile(wb, '人员名单模板.xlsx')
}

// ── Format guide ────────────────────────────────────────────────
function FormatGuide({ type }: { type: 'excel' | 'text' }) {
  if (type === 'excel') {
    return (
      <div className="import-guide">
        <div className="import-guide-title">📋 Excel 文件格式要求</div>
        <div className="import-guide-table">
          <div className="igt-header">
            <span>姓名 <span className="igt-required">必填</span></span>
            <span>序号 <span className="igt-optional">可选</span></span>
          </div>
          <div className="igt-row"><span>张三</span><span>1</span></div>
          <div className="igt-row"><span>李四</span><span>2</span></div>
          <div className="igt-row igt-hint"><span>…</span><span>不填则按行顺序</span></div>
        </div>
        <ul className="import-guide-tips">
          <li>第一行必须是标题行，包含 <code>姓名</code>（或"名字"）列</li>
          <li><code>序号</code>（或"排名"）列可选，决定就座优先级</li>
          <li>仅读取第一个工作表</li>
        </ul>
        <button className="import-template-btn" onClick={downloadTemplate}>
          <Download size={12} /> 下载空白模板
        </button>
      </div>
    )
  }
  return (
    <div className="import-guide">
      <div className="import-guide-title">📋 文本格式要求</div>
      <ul className="import-guide-tips">
        <li>每行填写一个姓名，系统自动按行顺序编排序号</li>
        <li>空行会被自动跳过</li>
        <li>如需指定序号，在姓名后加 <code>空格+数字</code>，如：<code>张三 3</code></li>
      </ul>
    </div>
  )
}

// ── Excel tab ───────────────────────────────────────────────────
function ExcelTab({ onParsed }: { onParsed: (e: ImportEntry[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<ImportEntry[]>([])
  const [error, setError]     = useState('')
  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState('')

  async function handleFile(file: File) {
    setError(''); setFileName(file.name)
    try {
      const entries = await parseExcel(file)
      setPreview(entries); onParsed(entries)
    } catch (e) {
      setError((e as Error).message); setPreview([]); onParsed([])
    }
  }

  return (
    <div className="import-tab-body">
      <FormatGuide type="excel" />
      <div
        className={clsx('excel-drop-zone', dragging && 'drag-over')}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
      >
        <Upload size={22} className="drop-icon" />
        {fileName
          ? <span className="drop-filename">{fileName}</span>
          : <span>点击选择 或 拖拽 Excel 文件到此处</span>
        }
        <span className="drop-hint">支持 .xlsx / .xls 格式</span>
        <input ref={inputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      </div>
      {error && <div className="import-error"><AlertCircle size={14} /> {error}</div>}
      {preview.length > 0 && (
        <div className="import-preview">
          <div className="import-preview-title">解析成功，共 {preview.length} 人</div>
          <div className="import-preview-list">
            {preview.slice(0, 10).map((e, i) => (
              <div key={i} className="import-preview-row">
                <span className="ip-rank">#{e.rank}</span>
                <span className="ip-name">{e.name}</span>
              </div>
            ))}
            {preview.length > 10 && <div className="ip-more">…还有 {preview.length - 10} 人未显示</div>}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Text tab ────────────────────────────────────────────────────
function parseTextLine(line: string, defaultRank: number): ImportEntry | null {
  const trimmed = line.trim()
  if (!trimmed) return null
  const match = trimmed.match(/^(.+?)\s+(\d+)$/)
  if (match) return { name: match[1].trim(), rank: parseInt(match[2]) }
  return { name: trimmed, rank: defaultRank }
}

function TextTab({ onParsed }: { onParsed: (e: ImportEntry[]) => void }) {
  const [text, setText] = useState('')

  function getEntries(raw: string): ImportEntry[] {
    let autoRank = 1
    return raw.split('\n')
      .map(line => { const e = parseTextLine(line, autoRank); if (e) autoRank++; return e })
      .filter((e): e is ImportEntry => e !== null)
  }

  function handleChange(v: string) { setText(v); onParsed(getEntries(v)) }
  const entries = getEntries(text)

  return (
    <div className="import-tab-body">
      <FormatGuide type="text" />
      <textarea
        className="import-textarea"
        placeholder={'每行输入一个姓名，自动按顺序编号：\n\n张三\n李四\n王五\n\n也可指定序号（姓名 空格 序号）：\n张三 1\n李四 3'}
        value={text}
        onChange={e => handleChange(e.target.value)}
      />
      {entries.length > 0 && (
        <div className="import-preview">
          <div className="import-preview-title">预览，共 {entries.length} 人</div>
          <div className="import-preview-list">
            {entries.slice(0, 8).map((e, i) => (
              <div key={i} className="import-preview-row">
                <span className="ip-rank">#{e.rank}</span>
                <span className="ip-name">{e.name}</span>
              </div>
            ))}
            {entries.length > 8 && <div className="ip-more">…还有 {entries.length - 8} 人</div>}
          </div>
        </div>
      )}
    </div>
  )
}

// ── 分组导入 tab ─────────────────────────────────────────────────
function LabelTab({
  venuePeople,
  groups,
  onReady,
}: {
  venuePeople: Person[]
  groups: Group[]
  onReady: (personIds: string[], groupId: string) => void
}) {
  const labels = [...new Set(venuePeople.map(p => p.label).filter(Boolean))] as string[]
  const [activeLabel, setActiveLabel] = useState(labels[0] ?? '')
  const [selected, setSelected]       = useState<Set<string>>(new Set())
  const [targetGroupId, setTargetGroupId] = useState(groups[0]?.id ?? '')

  const labelPeople = venuePeople
    .filter(p => p.label === activeLabel)
    .sort((a, b) => a.rank - b.rank)

  function changeLabel(l: string) {
    setActiveLabel(l)
    setSelected(new Set())
    onReady([], targetGroupId)
  }

  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      onReady([...next], targetGroupId)
      return next
    })
  }

  function toggleAll() {
    const isAll = selected.size === labelPeople.length && labelPeople.length > 0
    const next = isAll ? new Set<string>() : new Set(labelPeople.map(p => p.id))
    setSelected(next)
    onReady([...next], targetGroupId)
  }

  function changeGroup(gid: string) {
    setTargetGroupId(gid)
    onReady([...selected], gid)
  }

  if (labels.length === 0) {
    return (
      <div className="import-tab-body" style={{ textAlign: 'center', color: 'var(--text3)', paddingTop: 32 }}>
        <Tag size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
        <p>暂无分组标签</p>
        <p style={{ fontSize: 12, marginTop: 6 }}>请先在「人员管理」导入人员时指定分组名</p>
      </div>
    )
  }

  const currentGroup = groups.find(g => g.id === targetGroupId)

  return (
    <div className="import-tab-body">
      {/* Label pills */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 6, fontWeight: 600 }}>选择分组标签</div>
        <div className="label-pills">
          {labels.map(l => (
            <button
              key={l}
              className={clsx('label-pill', activeLabel === l && 'active')}
              onClick={() => changeLabel(l)}
            >
              <Tag size={11} /> {l}
              <span className="pill-count">{venuePeople.filter(p => p.label === l).length}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Target zone */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: 'var(--text2)', whiteSpace: 'nowrap' }}>分配到区域：</span>
        <select className="form-input" style={{ flex: 1, fontSize: 12 }}
          value={targetGroupId} onChange={e => changeGroup(e.target.value)}>
          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      {/* People list */}
      {labelPeople.length === 0
        ? <div style={{ color: 'var(--text3)', fontSize: 12 }}>该标签下暂无人员</div>
        : (
          <div className="cross-list">
            <div className="cross-list-header">
              <label className="cross-check-label">
                <input type="checkbox"
                  checked={selected.size === labelPeople.length && labelPeople.length > 0}
                  onChange={toggleAll} />
                全选（{labelPeople.length}人）
              </label>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                已选 {selected.size} 人 → {currentGroup?.name}
              </span>
            </div>
            <div className="cross-list-body">
              {labelPeople.map(p => {
                const curGroup = groups.find(g => g.id === p.groupId)
                return (
                  <label key={p.id} className="cross-check-label">
                    <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleOne(p.id)} />
                    <span className="ip-rank">#{p.rank}</span>
                    <span style={{ flex: 1 }}>{p.name}</span>
                    {curGroup && (
                      <span style={{ fontSize: 10, color: curGroup.color, background: curGroup.color + '18',
                        borderRadius: 3, padding: '1px 5px' }}>
                        {curGroup.name}
                      </span>
                    )}
                  </label>
                )
              })}
            </div>
          </div>
        )
      }
    </div>
  )
}

// ── Main modal ──────────────────────────────────────────────────
export default function ImportModal({
  groups, venuePeople = [], showLabelInput = false,
  onImport, onBulkUpdateZone, onClose,
}: Props) {
  const [tab, setTab]         = useState<Tab>('excel')
  const [groupId, setGroupId] = useState(groups[0]?.id ?? '')
  const [labelInput, setLabelInput] = useState('')
  const [pending, setPending] = useState<ImportEntry[]>([])
  const [byLabelSel, setByLabelSel] = useState<{ personIds: string[]; groupId: string }>({
    personIds: [], groupId: groups[0]?.id ?? '',
  })

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'excel',   label: 'Excel 导入', icon: <Upload size={14} /> },
    { key: 'text',    label: '文本导入',   icon: <FileText size={14} /> },
    { key: 'bylabel', label: '分组导入',   icon: <Tag size={14} /> },
  ]

  function handleConfirm() {
    if (tab === 'bylabel') {
      if (!byLabelSel.personIds.length) return
      onBulkUpdateZone?.(byLabelSel.personIds, byLabelSel.groupId)
    } else {
      if (!pending.length || !groupId) return
      onImport(pending, groupId, labelInput.trim() || undefined)
    }
    onClose()
  }

  const confirmDisabled = tab === 'bylabel'
    ? byLabelSel.personIds.length === 0
    : pending.length === 0

  const confirmLabel = tab === 'bylabel'
    ? byLabelSel.personIds.length > 0
      ? <><CheckCircle2 size={14} /> 更新 {byLabelSel.personIds.length} 人区域</>
      : '请先选择人员'
    : pending.length > 0
      ? <><CheckCircle2 size={14} /> 导入 {pending.length} 人</>
      : '请先选择人员'

  return (
    <Modal title="导入人员" onClose={onClose} width="500px">
      {/* Tab bar */}
      <div className="import-tabs">
        {tabs.map(t => (
          <button key={t.key}
            className={clsx('import-tab-btn', tab === t.key && 'active')}
            onClick={() => { setTab(t.key); setPending([]) }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'excel'   && <ExcelTab onParsed={setPending} />}
      {tab === 'text'    && <TextTab  onParsed={setPending} />}
      {tab === 'bylabel' && (
        <LabelTab
          venuePeople={venuePeople}
          groups={groups}
          onReady={(personIds, gid) => setByLabelSel({ personIds, groupId: gid })}
        />
      )}

      {/* Footer */}
      <div className="import-footer">
        {/* Label input — shown in PersonManagement context for excel/text tabs */}
        {showLabelInput && tab !== 'bylabel' && (
          <div className="import-group-select">
            <span className="import-group-label">
              <Tag size={12} /> 分组标签：
            </span>
            <input
              className="form-input"
              style={{ flex: 1, fontSize: 12 }}
              placeholder="如：腾讯、阿里、来宾A组（可留空）"
              value={labelInput}
              onChange={e => setLabelInput(e.target.value)}
            />
          </div>
        )}

        {/* Zone group selector — for excel/text tabs */}
        {tab !== 'bylabel' && (
          <div className="import-group-select">
            <span className="import-group-label">导入到区域：</span>
            <select className="form-input" style={{ flex: 1, fontSize: 12 }}
              value={groupId} onChange={e => setGroupId(e.target.value)}>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
        )}

        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>取消</button>
          <button className="btn-primary" disabled={confirmDisabled} onClick={handleConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
