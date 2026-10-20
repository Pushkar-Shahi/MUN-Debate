// ============================================================
// Main Application Layout Component
// ============================================================

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileBottomNav } from './MobileBottomNav';
import { AddEventModal } from '../events/AddEventModal';
import { EventDetailModal } from '../events/EventDetailModal';
import { PwaInstallPrompt } from '../common/PwaInstallPrompt';

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

        <main className="app-main-content">
          <Outlet context={{ openDetailModal: (id: string) => setSelectedEventId(id) }} />
        </main>

        {/* Mobile PWA Bottom Navigation Dock */}
        <MobileBottomNav />
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

      {/* PWA Install Promotion & Offline Radar */}
      <PwaInstallPrompt />
    </div>
  );
}
