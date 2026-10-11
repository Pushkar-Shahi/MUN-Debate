// ============================================================
// Utility Functions
// ============================================================

import { format, formatDistanceToNow, differenceInDays, differenceInHours, isPast, isToday, addDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';

// --- Date Formatting ---
export function formatDate(date: string | null | undefined): string {
  if (!date) return '—';
  try {
    return format(new Date(date), 'dd MMM yyyy');
  } catch { return date; }
}

export function formatDateTime(date: string | null | undefined): string {
  if (!date) return '—';
  try {
    return format(new Date(date), 'dd MMM yyyy, HH:mm');
  } catch { return date; }
}

export function formatDateShort(date: string | null | undefined): string {
  if (!date) return '—';
  try {
    return format(new Date(date), 'dd MMM');
  } catch { return date; }
}

export function formatRelative(date: string | null | undefined): string {
  if (!date) return '—';
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch { return date; }
}

// --- Countdown ---
export function getCountdown(deadline: string | null | undefined): {
  text: string;
  urgency: 'urgent' | 'soon' | 'ok' | 'past' | 'unknown';
  hours: number;
  days: number;
} {
  if (!deadline) return { text: 'Deadline unknown', urgency: 'unknown', hours: -1, days: -1 };
  try {
    const d = new Date(deadline);
    if (isPast(d)) return { text: 'Deadline passed', urgency: 'past', hours: 0, days: 0 };

    const hours = differenceInHours(d, new Date());
    const days = differenceInDays(d, new Date());

    if (hours <= 24) {
      return { text: `${hours}h remaining`, urgency: 'urgent', hours, days: 0 };
    }
    if (days <= 3) {
      return { text: `${days}d ${hours % 24}h remaining`, urgency: 'urgent', hours, days };
    }
    if (days <= 7) {
      return { text: `${days} days remaining`, urgency: 'soon', hours, days };
    }
    return { text: `${days} days remaining`, urgency: 'ok', hours, days };
  } catch {
    return { text: 'Invalid date', urgency: 'unknown', hours: -1, days: -1 };
  }
}

// --- Status Helpers ---
export function getStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    open: 'badge-open',
    opening_soon: 'badge-upcoming',
    closing_soon: 'badge-closing',
    closed: 'badge-closed',
    upcoming_unverified: 'badge-unverified',
    postponed: 'badge-postponed',
    cancelled: 'badge-cancelled',
    completed: 'badge-completed',
  };
  return map[status] || 'badge-unverified';
}

export function getHealthDotClass(health: string): string {
  const map: Record<string, string> = {
    healthy: 'health-healthy',
    delayed: 'health-delayed',
    failed: 'health-failed',
    manual_only: 'health-manual',
  };
  return map[health] || 'health-manual';
}

// --- Calendar Helpers ---
export function getCalendarDays(year: number, month: number) {
  const start = startOfMonth(new Date(year, month));
  const end = endOfMonth(new Date(year, month));
  const days = eachDayOfInterval({ start, end });

  // Pad start with previous month
  const startDay = getDay(start);
  const padStart = [];
  for (let i = startDay - 1; i >= 0; i--) {
    padStart.push({ date: addDays(start, -(i + 1)), isCurrentMonth: false });
  }

  const calDays = days.map(d => ({ date: d, isCurrentMonth: true }));

  // Pad end to complete the grid
  const total = padStart.length + calDays.length;
  const padEnd = [];
  const remaining = total % 7 === 0 ? 0 : 7 - (total % 7);
  for (let i = 1; i <= remaining; i++) {
    padEnd.push({ date: addDays(end, i), isCurrentMonth: false });
  }

  return [...padStart, ...calDays, ...padEnd];
}

// --- Misc ---
export function truncate(text: string | null | undefined, len: number): string {
  if (!text) return '';
  return text.length > len ? text.substring(0, len) + '…' : text;
}

export function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).replace(/_/g, ' ');
}

export function formatCurrency(amount: number | null | undefined, currency?: string | null): string {
  if (amount === null || amount === undefined) return '—';
  const curr = currency || 'INR';
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: curr, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${curr} ${amount}`;
  }
}

export function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  };
}

export { isToday, isPast, format, addDays };
