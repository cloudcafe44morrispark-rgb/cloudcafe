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
  // Use Intl.DateTimeFormat - reliable across all browsers including Android
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? '';
  const weekdayShort = get('weekday').toLowerCase().slice(0, 3); // 'mon', 'tue', etc.
  const h = get('hour').padStart(2, '0');
  const m = get('minute').padStart(2, '0');
  const timeStr = `${h}:${m}`;

  // Map en-GB short weekday to our keys
  const weekdayMap: Record<string, string> = {
    mon: 'mon', tue: 'tue', wed: 'wed', thu: 'thu',
    fri: 'fri', sat: 'sat', sun: 'sun',
  };
  const dayKey = weekdayMap[weekdayShort] ?? weekdayShort;
  const dayIdx = DAY_KEYS.indexOf(dayKey);

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
