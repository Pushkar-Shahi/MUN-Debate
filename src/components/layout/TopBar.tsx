// ============================================================
// TopBar Component
// ============================================================

import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Bell, Plus, Menu, Sun, Moon, LogOut, User, ChevronDown,
} from 'lucide-react';
import { useNotifications, useMarkNotificationRead } from '../../hooks';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { formatRelative } from '../../utils';

interface TopBarProps {
  onMenuToggle: () => void;
  onAddEvent: () => void;
}

export function TopBar({ onMenuToggle, onAddEvent }: TopBarProps) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [searchValue, setSearchValue] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { data: notifData } = useNotifications();
  const markRead = useMarkNotificationRead();
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleSearch = useCallback((value: string) => {
    setSearchValue(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      if (value.trim()) {
        navigate(`/events?search=${encodeURIComponent(value.trim())}`);
      }
    }, 400);
  }, [navigate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/events?search=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const unreadCount = notifData?.unreadCount ?? 0;
  const notifications = notifData?.data ?? [];

  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
    navigate('/login');
  };

  const userInitials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  return (
    <header className="topbar">
      <button className="btn btn-ghost btn-icon topbar-mobile-menu" onClick={onMenuToggle} id="mobile-menu-btn">
        <Menu size={20} />
      </button>

      <form className="search-bar" onSubmit={handleSearchSubmit}>
        <Search className="search-icon" size={16} />
        <input
          type="text"
          placeholder="Search events, conferences, debates..."
          value={searchValue}
          onChange={e => handleSearch(e.target.value)}
          id="global-search"
        />
      </form>

      <div className="topbar-actions">
        <button
          className="btn btn-ghost btn-icon"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          id="theme-toggle-btn"
          aria-label="Toggle theme mode"
        >
          {theme === 'dark' ? <Sun size={19} color="#f59e0b" /> : <Moon size={19} color="#6366f1" />}
        </button>

        <button className="btn btn-primary btn-sm topbar-add-btn" onClick={onAddEvent} id="add-event-btn">
          <Plus size={16} /> <span className="topbar-add-label">Add Event</span>
        </button>

        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setShowNotifications(!showNotifications)}
            style={{ position: 'relative' }}
            id="notifications-btn"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </button>

          {showNotifications && (
            <div className="topbar-dropdown topbar-notifications-dropdown">
              <div className="topbar-dropdown-header">
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Notifications</span>
                {unreadCount > 0 && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => markRead.mutate('all')}
                    style={{ fontSize: '0.75rem' }}
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: '0.85rem' }}>
                    No notifications yet
                  </div>
                ) : (
                  notifications.slice(0, 20).map((n) => (
                    <div
                      key={n.id}
                      style={{
                        padding: '12px 18px',
                        borderBottom: '1px solid var(--color-border-primary)',
                        cursor: 'pointer',
                        background: n.is_read ? 'transparent' : 'var(--color-accent-soft)',
                      }}
                      onClick={() => {
                        if (!n.is_read) markRead.mutate(n.id);
                        if (n.event_id) navigate(`/events/${n.event_id}`);
                        setShowNotifications(false);
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: '4px', color: 'var(--color-text-primary)' }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                        {n.message}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
                        {formatRelative(n.created_at)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar & Menu */}
        <div ref={userMenuRef} style={{ position: 'relative' }}>
          <button
            className="topbar-user-btn"
            onClick={() => setShowUserMenu(!showUserMenu)}
            id="user-menu-btn"
          >
            <div className="topbar-user-avatar">{userInitials}</div>
            <ChevronDown size={14} className="topbar-user-chevron" />
          </button>

          {showUserMenu && (
            <div className="topbar-dropdown topbar-user-dropdown">
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-border-primary)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-text-primary)' }}>
                  {user?.name || 'User'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
                  {user?.email || ''}
                </div>
              </div>
              <div style={{ padding: '6px' }}>
                <button
                  className="topbar-menu-item"
                  onClick={() => { setShowUserMenu(false); navigate('/settings'); }}
                >
                  <User size={15} /> Profile & Settings
                </button>
                <button
                  className="topbar-menu-item topbar-menu-item-danger"
                  onClick={handleLogout}
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
