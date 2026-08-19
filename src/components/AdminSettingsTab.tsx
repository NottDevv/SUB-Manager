import React, { useState } from 'react';
import { Settings, Shield, Lock, Download, Database, Save, Eye, EyeOff } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { useToast } from '../context/ToastContext';

interface AdminSettingsTabProps {
  currentAdminUsername: string;
  onUpdateAdmin: (newUsername: string, newPassword?: string) => Promise<boolean>;
  onDownloadBackup: () => void;
  onRestoreBackup: (file: File) => Promise<void>;
}

export const AdminSettingsTab: React.FC<AdminSettingsTabProps> = ({
  currentAdminUsername,
  onUpdateAdmin,
  onDownloadBackup,
  onRestoreBackup,
}) => {
  const { t } = useLang();
  const { showToast } = useToast();
  const [adminUsername, setAdminUsername] = useState(currentAdminUsername);
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUsername.trim()) {
      showToast('نام کاربری ادمین نمی‌تواند خالی باشد', 'error');
      return;
    }
    setIsSaving(true);
    const success = await onUpdateAdmin(adminUsername.trim(), adminPassword || undefined);
    setIsSaving(false);
    if (success) {
      setAdminPassword('');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Account Settings Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-center gap-3.5 border-b border-slate-800 pb-5">
          <div className="p-3 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">{t('admin_account_settings')}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{t('admin_settings')}</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-5">
            <div className="space-y-2 flex-1">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" />
                <span>{t('admin_username')}</span>
              </label>
              <input
                type="text"
                required
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                dir="ltr"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm font-mono focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none transition-all"
              />
              <p className="text-[11px] text-slate-500 ms-6 text-start">{t('admin_username_hint')}</p>
            </div>
            
            <div className="space-y-2 flex-1">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>{t('admin_password')}</span>
              </label>
              <div className="relative" dir="ltr">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  dir="ltr"
                  placeholder={t('leave_blank')}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm font-mono focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-400 hover:text-slate-100 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 ms-6 text-start">{t('leave_blank')}</p>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-1/4 py-3.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? t('saving') : t('save')}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Backup and Restore Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* One-Click Backup Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col space-y-6 gradient-border-emerald h-full">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">{t('backup_title')}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{t('backup_desc')}</p>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col justify-end space-y-4">
            <button
              onClick={onDownloadBackup}
              className="w-full py-3.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 font-bold text-sm shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-2.5 transition-all duration-200"
            >
              <Download className="w-5 h-5 animate-bounce" />
              <span>{t('download_backup')}</span>
            </button>
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 leading-relaxed text-center h-20 flex items-center justify-center">
              💡 {t('backup_hint')}
            </div>
          </div>
        </div>

        {/* Restore Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col space-y-6 gradient-border-emerald h-full">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">{t('restore_title')}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{t('restore_desc')}</p>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col justify-end space-y-4">
            <label className="w-full py-3.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 cursor-pointer font-bold text-sm shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-2.5 transition-all duration-200">
              <Download className="w-5 h-5 rotate-180 animate-bounce" />
              <span>{t('restore_db')}</span>
              <input type="file" accept=".json" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  await onRestoreBackup(file);
                }
              }} />
            </label>
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 leading-relaxed text-center h-20 flex items-center justify-center">
              ⚠️ {t('restore_hint')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
