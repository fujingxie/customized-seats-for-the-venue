import { useState, useEffect } from 'react'
import Sidebar from './components/layout/Sidebar'
import VenueManagement from './components/pages/VenueManagement'
import PersonManagement from './components/pages/PersonManagement'
import SeatingPlan from './components/pages/SeatingPlan'
import PreviewExport from './components/pages/PreviewExport'
import TrialExpired from './components/ui/TrialExpired'
import { useVenueStore } from './store/venueStore'
import { getTrialInfo } from './utils/trial'

const PAGE_TITLES: Record<string, { title: string; desc: string }> = {
  venues:  { title: '会场管理',   desc: '创建并选择当前工作会场' },
  people:  { title: '人员管理',   desc: '维护人员名单及排名' },
  seating: { title: '会场座位智能定制系统', desc: '选择会场并设置台上台下人员及排序规则，系统将自动完成座位分配。' },
  preview: { title: '预览与导出', desc: '查看完整座位方案并导出' },
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function App() {
  const { activePage } = useVenueStore()
  const meta = PAGE_TITLES[activePage] ?? PAGE_TITLES['venues']

  const [trialInfo, setTrialInfo] = useState(getTrialInfo)

  // Refresh every second for accurate countdown
  useEffect(() => {
    const timer = setInterval(() => setTrialInfo(getTrialInfo()), 1000)
    return () => clearInterval(timer)
  }, [])

  const { expired, secondsLeft } = trialInfo
  const showWarning = secondsLeft <= 120 // ≤ 2 minutes
  const isUrgent   = secondsLeft <= 60   // ≤ 1 minute → red

  if (expired) return <TrialExpired />

  const pages: Record<string, React.ReactNode> = {
    venues:  <div className="page-scroll"><VenueManagement /></div>,
    people:  <div className="page-scroll"><PersonManagement /></div>,
    seating: <SeatingPlan />,
    preview: <div className="page-scroll"><PreviewExport /></div>,
  }

  return (
    <div className="app-shell">
      <Sidebar />
      {showWarning && (
        <div style={{
          position: 'fixed', bottom: 16, right: 16, zIndex: 1000,
          padding: '6px 14px', borderRadius: 8,
          background: isUrgent ? 'rgba(239,68,68,0.15)' : 'rgba(251,191,36,0.12)',
          border: `1px solid ${isUrgent ? 'rgba(239,68,68,0.4)' : 'rgba(251,191,36,0.3)'}`,
          color: isUrgent ? '#f87171' : '#fbbf24',
          fontSize: 12,
        }}>
          ⏳ 试用期剩余 {formatTime(secondsLeft)}
        </div>
      )}
      <main className="main-area">
        {activePage !== 'preview' && (
          <div className="main-header">
            <div>
              <div className="main-header-title">{meta.title}</div>
              <div className="main-header-sub">{meta.desc}</div>
            </div>
          </div>
        )}
        {pages[activePage]}
      </main>
    </div>
  )
}
