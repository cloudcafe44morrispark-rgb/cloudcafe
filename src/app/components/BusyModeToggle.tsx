import { useAuth } from '../context/AuthContext';
import { useBusyMode } from '../context/BusyModeContext';
import { Switch } from './ui/switch';
import { Loader2 } from 'lucide-react';

export function BusyModeToggle() {
  const { isAdmin } = useAuth();
  const { busyMode, setBusyMode, collectionMinutes, isLoading } = useBusyMode();

  if (!isAdmin) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-amber-900">Busy mode</span>
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
          ) : (
            <Switch
              checked={busyMode}
              onCheckedChange={(checked) => setBusyMode(checked)}
              className="data-[state=checked]:bg-amber-600"
            />
          )}
        </div>
        <span className="text-sm text-amber-800">
          Collection time: <strong>{collectionMinutes} min</strong>
        </span>
      </div>
    </div>
  );
}
