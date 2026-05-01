import { useRef } from 'react'
import { Image, FileText, Printer } from 'lucide-react'
import { useVenueStore } from '../../store/venueStore'
import VenueCanvas from '../venues/VenueCanvas'

export default function PreviewExport() {
  const { venues, activeVenueId } = useVenueStore()
  const venue = venues.find(v => v.id === activeVenueId)
  const containerRef = useRef<HTMLDivElement>(null)

  if (!venue) {
    return (
      <div className="page-content">
        <div className="empty-state">
          <div className="empty-icon">👁</div>
          <p>请先在「会场管理」中选择一个会场</p>
        </div>
      </div>
    )
  }

  async function exportImage() {
    const { default: html2canvas } = await import('html2canvas')
    const el = containerRef.current
    if (!el) return
    const canvas = await html2canvas(el, {
      backgroundColor: '#0a0f1e',
      scale: 2,
    })
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `${venue!.name}-座位图.png`
    a.click()
  }

  async function exportPDF() {
    const { default: html2canvas } = await import('html2canvas')
    const { jsPDF } = await import('jspdf')
    const el = containerRef.current
    if (!el) return
    const canvas = await html2canvas(el, { backgroundColor: '#0a0f1e', scale: 2 })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const W = pdf.internal.pageSize.getWidth()
    const H = pdf.internal.pageSize.getHeight()
    const ratio = canvas.width / canvas.height
    const pdfW = Math.min(W - 20, H * ratio)
    const pdfH = pdfW / ratio
    pdf.addImage(imgData, 'PNG', (W - pdfW) / 2, (H - pdfH) / 2, pdfW, pdfH)
    pdf.save(`${venue!.name}-座位图.pdf`)
  }

  function handlePrint() {
    window.print()
  }

  const assignedCount = Object.keys(venue.assignments).length

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">预览与导出</h1>
          <p className="page-desc">
            <strong>{venue.name}</strong> · {venue.people.length} 人 · 已落座 {assignedCount} 位
          </p>
        </div>
        <div className="header-actions">
          <button className="btn-ghost" onClick={exportImage}>
            <Image size={15} /> 导出图片
          </button>
          <button className="btn-ghost" onClick={exportPDF}>
            <FileText size={15} /> 导出 PDF
          </button>
          <button className="btn-primary" onClick={handlePrint}>
            <Printer size={15} /> 打印
          </button>
        </div>
      </div>

      <div className="preview-wrap" ref={containerRef}>
        <div className="preview-title">{venue.name}</div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <VenueCanvas venue={venue} width={700} height={520} readonly />
        </div>

        {/* Seat legend */}
        <div className="preview-legend">
          {venue.groups.map(g => (
            <div key={g.id} className="preview-legend-item">
              <span className="legend-dot" style={{ background: g.color }} />
              <span>{g.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
