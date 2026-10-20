// ============================================================
// Sidebar Component
// ============================================================

import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, Bookmark, FileText, Globe, Settings,
  ChevronLeft, ChevronRight, Trophy, Gavel, Clock,
  Database, GraduationCap, Radio, X, LogOut, BookOpen, Award,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const navItems = [
  { section: 'Overview' },
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/events', icon: Globe, label: 'All Opportunities' },
  { section: 'Discover' },
  { to: '/events?category=mun', icon: GraduationCap, label: 'MUN Conferences' },
  { to: '/events?category=parliamentary_debate,bp_debate,ap_debate,world_schools_debate,public_forum_debate,ld_debate,policy_debate,legal_debate', icon: Gavel, label: 'Debate Competitions' },
  { to: '/events?category=workshop,bootcamp', icon: BookOpen, label: 'Workshops & Training' },
  { to: '/events?category=case_competition,moot_court,quiz_competition,hackathon_policy,youth_parliament,public_speaking,extempore', icon: Award, label: 'Competitions & Challenges' },
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
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    onMobileClose();
    logout();
    navigate('/login');
  };

  const userInitials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  return (
    <>
      {mobileOpen && (
        <div className="side-panel-overlay" onClick={onMobileClose} style={{ zIndex: 35 }} />
      )}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, cursor: 'pointer' }}
            onClick={() => { onMobileClose(); navigate('/'); }}
          >
            <div className="sidebar-logo-icon">
              <Radio size={18} />
            </div>
            <span className="sidebar-logo-text">MUN & Debate Central</span>
          </div>
          {mobileOpen && (
            <button
              className="btn btn-ghost btn-icon"
              onClick={onMobileClose}
              style={{ width: '28px', height: '28px', minWidth: '28px', padding: 0 }}
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          )}
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

            let isActive = false;
            const currentParams = new URLSearchParams(location.search);
            const currentCategory = currentParams.get('category');

            if (to === '/') {
              isActive = location.pathname === '/';
            } else if (to === '/events') {
              // "All Opportunities" is only active if on /events and no specific category filter is active
              isActive = location.pathname === '/events' && !currentCategory;
            } else if (to.startsWith('/events?category=')) {
              if (location.pathname === '/events' && currentCategory) {
                const targetParams = new URLSearchParams(to.split('?')[1]);
                const targetCats = (targetParams.get('category') || '').split(',').filter(Boolean);
                const currentCats = currentCategory.split(',').filter(Boolean);
                // Active if the current category exactly matches or is a subset of this category group
                isActive =
                  currentCategory === targetParams.get('category') ||
                  (currentCats.length > 0 && currentCats.every(c => targetCats.includes(c)));
              }
            } else {
              const targetPath = to.split('?')[0];
              isActive = location.pathname === targetPath || location.pathname.startsWith(targetPath + '/');
            }

            return (
              <Link
                key={to}
                to={to}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={onMobileClose}
              >
                <Icon className="nav-icon" size={20} />
                <span className="sidebar-label">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Card & Controls at Bottom */}
        <div style={{ padding: '8px', borderTop: '1px solid var(--color-border-primary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {user && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                gap: '10px',
                padding: collapsed ? '8px 0' : '8px 10px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-bg-secondary)',
                marginBottom: '4px',
                overflow: 'hidden',
              }}
              title={`${user.name} (${user.email})`}
            >
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--color-primary), #8b5cf6)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  flexShrink: 0,
                }}
              >
                {userInitials}
              </div>
              {!collapsed && (
                <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {user.email}
                  </div>
                </div>
              )}
              {!collapsed && (
                <button
                  onClick={handleLogout}
                  className="btn btn-ghost btn-icon"
                  style={{ width: '26px', height: '26px', padding: 0, color: 'var(--color-text-tertiary)' }}
                  title="Sign Out"
                >
                  <LogOut size={14} />
                </button>
              )}
            </div>
          )}

          <button
            className="nav-item"
            onClick={onToggle}
            style={{ width: '100%', border: 'none', background: 'none' }}
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            <span className="sidebar-label">{collapsed ? 'Expand' : 'Collapse'}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
