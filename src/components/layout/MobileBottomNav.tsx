// ============================================================
// Mobile Bottom Navigation Bar (PWA / Mobile Native Feel)
// ============================================================

import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Globe, Clock, Calendar, Bookmark } from 'lucide-react';

interface MobileBottomNavProps {
  unreadCount?: number;
}

export function MobileBottomNav({ unreadCount }: MobileBottomNavProps) {
  const location = useLocation();

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/events', icon: Globe, label: 'Explore' },
    { to: '/closing-soon', icon: Clock, label: 'Deadlines' },
    { to: '/calendar', icon: Calendar, label: 'Calendar' },
    { to: '/saved', icon: Bookmark, label: 'Saved' },
  ];

  return (
    <nav className="mobile-bottom-nav">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.to);

        return (
          <Link
            key={item.to}
            to={item.to}
            className={`mobile-bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <div style={{ position: 'relative' }}>
              <Icon size={20} />
              {item.to === '/closing-soon' && unreadCount && unreadCount > 0 ? (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-6px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'var(--color-error)',
                  }}
                />
              ) : null}
            </div>
            <span style={{ fontSize: '0.68rem', fontWeight: isActive ? 600 : 500 }}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
