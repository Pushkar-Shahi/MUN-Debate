// ============================================================
// Main Application Layout Component
// ============================================================

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { AddEventModal } from '../events/AddEventModal';
import { EventDetailModal } from '../events/EventDetailModal';

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className={`main-content ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <TopBar
          onMenuToggle={() => setMobileOpen(!mobileOpen)}
          onAddEvent={() => setAddModalOpen(true)}
        />

        <main style={{ padding: '24px 28px', maxWidth: '1440px', margin: '0 auto' }}>
          <Outlet context={{ openDetailModal: (id: string) => setSelectedEventId(id) }} />
        </main>
      </div>

      {/* Add Event Modal */}
      <AddEventModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
      />

      {/* Quick View Drawer Modal */}
      <EventDetailModal
        eventId={selectedEventId}
        onClose={() => setSelectedEventId(null)}
      />
    </div>
  );
}
