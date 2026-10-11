// ============================================================
// Sidebar Component
// ============================================================

import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, Bookmark, FileText, Globe, Settings,
  ChevronLeft, ChevronRight, Trophy, Gavel, Clock, CheckSquare,
  Database, GraduationCap, Radio,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const navItems = [
  { section: 'Overview' },
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/events', icon: Globe, label: 'All Events' },
  { section: 'Discover' },
  { to: '/events?category=mun', icon: GraduationCap, label: 'MUN Conferences' },
  { to: '/events?category=parliamentary_debate,bp_debate,ap_debate,world_schools_debate,public_forum_debate,ld_debate,policy_debate,legal_debate', icon: Gavel, label: 'Debate Competitions' },
  { to: '/closing-soon', icon: Clock, label: 'Closing Soon' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { section: 'Personal' },
  { to: '/saved', icon: Bookmark, label: 'Saved Events' },
  { to: '/applications', icon: FileText, label: 'Applications' },
  { to: '/completed', icon: Trophy, label: 'Completed' },
  { section: 'System' },
  { to: '/sources', icon: Database, label: 'Sources' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation();

  return (
    <>
      {mobileOpen && (
        <div className="side-panel-overlay" onClick={onMobileClose} style={{ zIndex: 35 }} />
      )}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-logo" onClick={onToggle}>
          <div className="sidebar-logo-icon">
            <Radio size={18} />
          </div>
          <span className="sidebar-logo-text">MUN & Debate Central</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, i) => {
            if ('section' in item && item.section) {
              return (
                <div key={i} className="sidebar-section-title">
                  {item.section}
                </div>
              );
            }
            const { to, icon: Icon, label } = item as { to: string; icon: typeof LayoutDashboard; label: string };
            const isActive = to === '/'
              ? location.pathname === '/'
              : location.pathname + location.search === to || location.pathname.startsWith(to.split('?')[0]) && to !== '/';

            return (
              <NavLink
                key={to}
                to={to}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={onMobileClose}
              >
                <Icon className="nav-icon" size={20} />
                <span className="sidebar-label">{label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div style={{ padding: '12px 8px', borderTop: '1px solid var(--color-border-primary)' }}>
          <button
            className="nav-item"
            onClick={onToggle}
            style={{ width: '100%', border: 'none', background: 'none' }}
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            <span className="sidebar-label">Collapse</span>
          </button>
        </div>
      </aside>
    </>
  );
}
