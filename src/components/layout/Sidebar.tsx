import { LayoutGrid, Users, Armchair, Eye } from 'lucide-react'
import { useVenueStore } from '../../store/venueStore'
import { Page } from '../../types'
import clsx from 'clsx'

const NAV_ITEMS: { page: Page; label: string; icon: React.ReactNode }[] = [
  { page: 'venues',  label: '会场管理', icon: <LayoutGrid size={16} /> },
  { page: 'people',  label: '人员管理', icon: <Users size={16} /> },
  { page: 'seating', label: '座位排序', icon: <Armchair size={16} /> },
  { page: 'preview', label: '预览与导出', icon: <Eye size={16} /> },
]

export default function Sidebar() {
  const { activePage, setActivePage, venues, activeVenueId } = useVenueStore()
  const activeVenue = venues.find(v => v.id === activeVenueId)

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">
          <Armchair size={18} />
        </div>
        <div>
          <div className="logo-title">会场座位</div>
          <div className="logo-sub">智能定制系统</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {activeVenue && (
          <div className="active-venue-badge">
            <span className="venue-dot" />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeVenue.name}</span>
          </div>
        )}

        {NAV_ITEMS.map(item => (
          <button
            key={item.page}
            className={clsx('nav-item', activePage === item.page && 'active')}
            onClick={() => setActivePage(item.page)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="version-tag">v1.0 · 离线版</div>
      </div>
    </aside>
  )
}
