import React from 'react';
import { useLang } from '../context/LangContext';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, message, onConfirm, onCancel }) => {
  const { t, lang } = useLang();
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm animate-fadeIn p-4" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scaleIn">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-500/15 text-rose-500 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <p className="text-slate-200 text-sm font-semibold">{message}</p>
          <div className="flex gap-3 w-full pt-2">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onCancel();
              }}
              className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors"
            >
              {t('delete')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
