import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface BusyModeContextType {
  busyMode: boolean;
  setBusyMode: (value: boolean) => Promise<void>;
  collectionMinutes: number;
  isLoading: boolean;
}

const BusyModeContext = createContext<BusyModeContextType | undefined>(undefined);

export function BusyModeProvider({ children }: { children: ReactNode }) {
  const [busyMode, setBusyModeState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBusyMode = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('shop_config')
        .select('value')
        .eq('key', 'busy_mode')
        .maybeSingle();

      if (error) {
        console.warn('BusyMode fetch:', error.message);
        return;
      }
      const value = data?.value;
      setBusyModeState(value === true || value === 'true');
    } catch (e) {
      console.warn('BusyMode fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBusyMode();
  }, [fetchBusyMode]);

  // Subscribe to changes so all tabs/clients stay in sync
  useEffect(() => {
    const channel = supabase
      .channel('shop_config')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shop_config', filter: 'key=eq.busy_mode' },
        () => fetchBusyMode()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchBusyMode]);

  const setBusyMode = useCallback(
    async (value: boolean) => {
      setBusyModeState(value);
      try {
        await supabase
          .from('shop_config')
          .update({ value, updated_at: new Date().toISOString() })
          .eq('key', 'busy_mode');
      } catch (e) {
        console.error('BusyMode update failed:', e);
        fetchBusyMode();
      }
    },
    [fetchBusyMode]
  );

  const collectionMinutes = busyMode ? 55 : 25;

  return (
    <BusyModeContext.Provider
      value={{
        busyMode,
        setBusyMode,
        collectionMinutes,
        isLoading,
      }}
    >
      {children}
    </BusyModeContext.Provider>
  );
}

export function useBusyMode() {
  const context = useContext(BusyModeContext);
  if (context === undefined) {
    throw new Error('useBusyMode must be used within a BusyModeProvider');
  }
  return context;
}
