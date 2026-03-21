import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Opening hours in UK local time (Europe/London)
const OPENING_HOURS: Record<string, { open: string; close: string } | null> = {
  sun: null,
  mon: { open: '08:00', close: '16:30' },
  tue: { open: '08:00', close: '17:30' },
  wed: { open: '08:00', close: '17:30' },
  thu: { open: '08:00', close: '16:30' },
  fri: { open: '08:00', close: '16:30' },
  sat: { open: '08:00', close: '15:30' },
};

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function checkIsOpen(): { isOpen: boolean; nextOpenInfo: string } {
  const now = new Date();
  // Get UK local time correctly across all browsers
  const ukDate = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/London' }));
  const dayIdx = ukDate.getDay(); // 0=Sun, 1=Mon, ...
  const dayKey = DAY_KEYS[dayIdx];
  const h = ukDate.getHours().toString().padStart(2, '0');
  const m = ukDate.getMinutes().toString().padStart(2, '0');
  const timeStr = `${h}:${m}`;

  const todayHours = OPENING_HOURS[dayKey];

  if (todayHours && timeStr >= todayHours.open && timeStr < todayHours.close) {
    return { isOpen: true, nextOpenInfo: `Open until ${todayHours.close}` };
  }

  if (todayHours && timeStr < todayHours.open) {
    return { isOpen: false, nextOpenInfo: `Opens today at ${todayHours.open}` };
  }

  // After closing or closed all day — find next open day
  for (let i = 1; i <= 7; i++) {
    const nextIdx = (dayIdx + i) % 7;
    const nextKey = DAY_KEYS[nextIdx];
    const nextHours = OPENING_HOURS[nextKey];
    if (nextHours) {
      const label = i === 1 ? 'tomorrow' : DAY_NAMES[nextIdx];
      return { isOpen: false, nextOpenInfo: `Opens ${label} at ${nextHours.open}` };
    }
  }

  return { isOpen: false, nextOpenInfo: 'Currently closed' };
}

interface OpeningHoursContextType {
  isOpen: boolean;
  nextOpenInfo: string;
}

const OpeningHoursContext = createContext<OpeningHoursContextType>({ isOpen: true, nextOpenInfo: '' });

export function OpeningHoursProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OpeningHoursContextType>(checkIsOpen);

  useEffect(() => {
    // Re-check every minute
    const interval = setInterval(() => setState(checkIsOpen()), 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <OpeningHoursContext.Provider value={state}>
      {children}
    </OpeningHoursContext.Provider>
  );
}

export function useOpeningHours() {
  return useContext(OpeningHoursContext);
}
