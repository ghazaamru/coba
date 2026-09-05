import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineBadge: React.FC = () => {
  const isOnline = useOnlineStatus();

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
        isOnline ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
      }`}
    >
      {isOnline ? (
        <>
          <Wifi className="w-3.5 h-3.5" />
          <span>Online</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline Ready</span>
        </>
      )}
    </div>
  );
};
