import React, { useRef, useState } from 'react';
import { Download, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { exportTransactionsToJSON, importTransactionsFromJSON } from '../../utils/exportImport';

export const DataPortability: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ message: string; isError: boolean } | null>(null);

  const handleExport = async () => {
    await exportTransactionsToJSON();
    setStatus({ message: 'Backup successfully exported as JSON.', isError: false });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await importTransactionsFromJSON(file, 'merge');
    if (result.success) {
      setStatus({ message: `Successfully imported ${result.count} transactions!`, isError: false });
    } else {
      setStatus({ message: result.error || 'Import failed.', isError: true });
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Data Portability</h3>
      <p className="text-xs text-slate-400">
        Your data is stored exclusively on this device. Back up regularly or restore from a JSON file.
      </p>

      {status && (
        <div
          className={`flex items-center gap-2 p-3 rounded-xl text-xs ${
            status.isError ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          }`}
        >
          {status.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
          <span>{status.message}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleExport}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Export JSON
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 text-xs font-semibold rounded-xl transition cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          Import JSON
        </button>
        <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={handleFileChange} className="hidden" />
      </div>
    </div>
  );
};
