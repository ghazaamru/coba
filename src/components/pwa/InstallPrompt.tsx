import React from 'react';
import { Download, X } from 'lucide-react';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';

export const InstallPrompt: React.FC = () => {
  const { isInstallable, triggerInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = React.useState(false);

  if (!isInstallable || dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-900/80 to-slate-900/80 border border-indigo-500/30 rounded-xl p-4 flex items-center justify-between gap-4 shadow-lg backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-lg">
          <Download className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-100">Install Offline Tracker</h4>
          <p className="text-xs text-slate-400">Install to your home screen for quick offline access.</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={triggerInstall}
          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-semibold rounded-lg shadow transition cursor-pointer"
        >
          Install
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg transition cursor-pointer"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
