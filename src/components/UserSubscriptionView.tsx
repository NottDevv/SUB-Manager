import React, { useState } from 'react';
import { UserAccount, Lang } from '../types';
import {
  Copy,
  QrCode,
  Check,
  Globe,
  Lock,
  LogOut,
  Zap,
  Activity,
  Calendar,
  ExternalLink,
  Smartphone,
  Eye,
  EyeOff,
  ChevronDown,
  ShieldAlert,
  Clock,
  HelpCircle,
  HardDrive,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useLang } from '../context/LangContext';
import { QRCodeModal } from './QRCodeModal';
import { SubLinkUsageInfo } from './SubLinkUsageInfo';

interface UserSubscriptionViewProps {
  user: UserAccount;
  baseUrl: string;
  isAuthenticated: boolean;
  onLogin: (password: string) => Promise<boolean>;
  onLogout: () => void;
}

export const UserSubscriptionView: React.FC<UserSubscriptionViewProps> = ({
  user,
  baseUrl,
  isAuthenticated,
  onLogin,
  onLogout,
}) => {
  const { showToast } = useToast();
  const { t, lang, toggleLang } = useLang();

  // Login form state
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // QR Modal state
  const [qrState, setQrState] = useState<{ open: boolean; title: string; url: string }>({
    open: false,
    title: '',
    url: '',
  });

  // Copied states
  const [copiedSub, setCopiedSub] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showDeepLinks, setShowDeepLinks] = useState<number | false>(false);

  const fullSubUrl = `${baseUrl}/USR/${encodeURIComponent(user.username || "")}`;

  // Deep Links
  const encodedSubUrl = encodeURIComponent(fullSubUrl);
  const deepLinks = {
    v2rayng: `v2rayng://install-sub?url=${encodedSubUrl}&name=${encodeURIComponent(user.username || "")}`,
    hiddify: `hiddify://import/${fullSubUrl}#${encodeURIComponent(user.username || "")}`,
    shadowrocket: `shadowrocket://add/sub://` + btoa(fullSubUrl) + `?remark=` + encodeURIComponent(user.username || ""),
    nekobox: `nekobox://import/${fullSubUrl}`,
  };

  const handleCopySubLink = async () => {
    try {
      await navigator.clipboard.writeText(fullSubUrl);
      setCopiedSub(true);
      showToast(t('copied_toast'), 'success');
      setTimeout(() => setCopiedSub(false), 2000);
    } catch {
      showToast('Copy failed', 'error');
    }
  };

  const handleCopyConfigLink = async (url: string, index: number) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedIndex(index);
      showToast(t('copied_toast'), 'success');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      showToast('Copy failed', 'error');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    const success = await onLogin(passwordInput);
    setIsLoggingIn(false);
    if (!success) {
      setLoginError(t('invalid_pass'));
    }
  };

  // If user is not authenticated yet, render login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6">
        {/* Header */}
        <header className="flex items-center justify-between max-w-4xl mx-auto w-full py-2">
          <button
            onClick={toggleLang}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-slate-100 transition-colors"
          >
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>{lang === 'fa' ? 'English' : 'فارسی'}</span>
          </button>
          <span className="font-mono text-xs font-bold text-emerald-400 tracking-wider">SubManager</span>
        </header>

        {/* Login Box */}
        <main className="flex-1 flex items-center justify-center py-10">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl space-y-6 text-center gradient-border-emerald">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold font-mono text-slate-100">{user.username}</h2>
              <p className="text-xs text-slate-400">{t('enter_pass_user')}</p>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-300 text-xs font-medium">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="relative" dir="ltr">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  dir="ltr"
                  placeholder={t('password')}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono text-sm text-center focus:border-emerald-500 focus:outline-none pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-400 hover:text-slate-100 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-950/50 transition-all duration-200 disabled:opacity-50"
              >
                {isLoggingIn ? t('logging_in') : t('login_btn')}
              </button>
            </form>
          </div>
        </main>

        <footer className="text-center text-xs text-slate-600 py-4 font-mono">
          SubManager &copy; 2026
        </footer>
      </div>
    );
  }

  // Check Expiry or Disabled status
  const isExpired = user.expire_date && new Date(user.expire_date) < new Date();
  const isDisabled = user.status === 'disabled';

  if (isDisabled || isExpired) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6">
        <header className="flex items-center justify-between max-w-4xl mx-auto w-full py-2">
          <button
            onClick={toggleLang}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-slate-100 transition-colors"
          >
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>{lang === 'fa' ? 'English' : 'فارسی'}</span>
          </button>
          <span className="font-mono text-xs font-bold text-emerald-400 tracking-wider">SubManager</span>
        </header>

        <main className="flex-1 flex items-center justify-center py-10">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 text-center">
            <div className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center border ${
              isDisabled
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}>
              {isDisabled ? <ShieldAlert className="w-10 h-10" /> : <Clock className="w-10 h-10" />}
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-100">
                {isDisabled ? t('account_disabled_title') : t('account_expired_title')}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isDisabled ? t('account_disabled_msg') : t('account_expired_msg')}
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={onLogout}
                className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700/80 flex items-center justify-center gap-2 transition-colors"
              >
                <HelpCircle className="w-4 h-4 text-emerald-400" />
                <span>{t('contact_admin')}</span>
              </button>
            </div>
          </div>
        </main>

        <footer className="text-center text-xs text-slate-600 py-4 font-mono">
          SubManager &copy; 2026
        </footer>
      </div>
    );
  }

  // Calculate remaining days
  let daysRemaining: number | string = t('unlimited');
  if (user.expire_date) {
    const diff = new Date(user.expire_date).getTime() - new Date().getTime();
    daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* User Header Navigation */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-slate-950 font-bold font-mono flex items-center justify-center text-base shadow-lg shadow-emerald-950/40">
            {(user.username || "").charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-bold text-slate-100 text-base font-mono">{user.username}</h1>
            <span className="text-[11px] text-emerald-400 font-medium">{t('welcome_sub')}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-slate-100 transition-colors"
          >
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>{lang === 'fa' ? 'EN' : 'FA'}</span>
          </button>

          <button
            onClick={onLogout}
            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 transition-colors"
            title={t('logout')}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto w-full py-8 space-y-6 flex-1">
        {/* Status & Expiry Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 gradient-border-emerald">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-sm text-slate-100">{t('active_pulse')}</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 px-4 py-2 rounded-2xl border border-slate-800/80">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-slate-400">{t('expiration_date')}:</span>
            <span className="text-xs font-bold font-mono text-cyan-400">
              {typeof daysRemaining === 'number'
                ? t('remaining_days', { days: daysRemaining })
                : t('unlimited')}
            </span>
          </div>
        </div>

        {/* SECTION 1: Config Items List */}
        <div className="space-y-6 pt-2">
          {(() => {
            const subLinks = (user.links || []).filter(l => typeof l.url === "string" && l.url.toLowerCase().startsWith('http'));
            const directConfigs = (user.links || []).filter(l => typeof l.url === "string" && !l.url.toLowerCase().startsWith('http'));

            if ((user.links || []).length === 0) {
              return (
                <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-sm">
                  {t('no_links_user')}
                </div>
              );
            }

            return (
              <>
                {subLinks.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-200 text-sm tracking-wide uppercase flex items-center gap-2">
                      <Globe className="w-4 h-4 text-emerald-400" />
                      <span>{t('sub_links_management')} ({subLinks.length})</span>
                    </h3>
                    <div className="space-y-3">
                      {subLinks.map((link, idx) => renderConfigItem(link, idx))}
                    </div>
                  </div>
                )}

                {directConfigs.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-200 text-sm tracking-wide uppercase flex items-center gap-2">
                      <Activity className="w-4 h-4 text-cyan-400" />
                      <span>{t('user_configs_title')} ({directConfigs.length})</span>
                    </h3>
                    <div className="space-y-3">
                      {directConfigs.map((link, idx) => renderConfigItem(link, idx + subLinks.length))}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </main>

      <footer className="max-w-4xl mx-auto w-full pt-8 text-center text-xs text-slate-600 border-t border-slate-800/60 font-mono">
        SubManager Since 2022
      </footer>

      {/* QR Code Modal Popup */}
      <QRCodeModal
        isOpen={qrState.open}
        onClose={() => setQrState({ ...qrState, open: false })}
        title={qrState.title}
        url={qrState.url}
      />
    </div>
  );

  function renderConfigItem(link: any, idx: number) {
    const isSub = typeof link.url === 'string' && link.url.toLowerCase().startsWith('http');

    return (
      <div
        key={link.id}
        className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 shadow-lg transition-all space-y-3"
        dir="ltr"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="w-3 h-3 rounded-full bg-emerald-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-slate-100 text-sm">{link.title}</h4>
              <p className="font-mono text-xs text-slate-400 truncate mt-0.5 text-start">
                {link.url}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            {/* Copy Config */}
            <button
              onClick={() => handleCopyConfigLink(link.url, idx)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-semibold transition-all"
            >
              {copiedIndex === idx ? (
                <Check className="w-4 h-4 text-emerald-300" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              <span>{copiedIndex === idx ? t('copied') : t('copy')}</span>
            </button>

            {/* Import to App Dropdown for Subscription Links */}
            {isSub && (
              <div className="relative inline-block">
                <button
                  onClick={() => setShowDeepLinks(showDeepLinks === idx ? false : idx)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-semibold transition-all"
                >
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>{t('import_to_app')}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showDeepLinks === idx ? 'rotate-180' : ''}`} />
                </button>

                {showDeepLinks === idx && (
                  <div className="absolute top-full end-0 mt-2 w-52 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-30 space-y-1 animate-fadeIn">
                    <a
                      href={`v2rayng://install-sub?url=${encodeURIComponent(link.url)}&name=${encodeURIComponent(user.username || "")}`}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-800 text-xs font-medium text-slate-200 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{t('import_v2rayng')}</span>
                    </a>
                    <a
                      href={`hiddify://import/${link.url}#${encodeURIComponent(user.username || "")}`}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-800 text-xs font-medium text-slate-200 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{t('import_hiddify')}</span>
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* QR Code */}
            <button
              onClick={() => setQrState({ open: true, title: link.title, url: link.url })}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition-colors border border-slate-700/60"
              title={t('qr_code')}
            >
              <QrCode className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Subscription Info & Traffic Usage Progress Bar */}
        {isSub && <SubLinkUsageInfo url={link.url} />}
      </div>
    );
  }
};

