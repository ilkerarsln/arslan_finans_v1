import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toastMessage } = useFinance();
  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 duration-300 pointer-events-none">
      <div
        className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold backdrop-blur-md ${
          toastMessage.type === 'error'
            ? 'bg-rose-950/90 border-rose-800 text-rose-200'
            : toastMessage.type === 'info'
            ? 'bg-blue-950/90 border-blue-800 text-blue-200'
            : 'bg-emerald-950/90 border-emerald-800 text-emerald-200'
        }`}
      >
        {toastMessage.type === 'error' ? (
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
        ) : toastMessage.type === 'info' ? (
          <Info className="w-4 h-4 text-blue-400 shrink-0" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        )}
        <span>{toastMessage.text}</span>
      </div>
    </div>
  );
};
