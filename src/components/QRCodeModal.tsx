import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, QrCode } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useLang } from '../context/LangContext';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose, title, url }) => {
  const { showToast } = useToast();
  const { t } = useLang();
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      showToast(t('copied_toast'), 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Error copying to clipboard', 'error');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative text-center flex flex-col items-center gap-4 gradient-border-emerald"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 end-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-emerald-400 font-bold text-lg mt-1">
          <QrCode className="w-5 h-5" />
          <span>{title || t('qr_title')}</span>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-inner my-2 flex items-center justify-center border-2 border-emerald-500/20">
          <QRCodeSVG value={url || 'https://example.com'} size={210} level="M" includeMargin={false} />
        </div>

        <p className="text-xs text-slate-400 leading-relaxed px-2">
          {t('scan_qr_hint')}
        </p>

        <div className="w-full flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 overflow-hidden">
          <span className="truncate flex-1 text-start px-2">{url}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-sans font-semibold px-3 py-1.5 rounded-lg transition-colors shrink-0"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? t('copied') : t('copy')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
