import React from 'react';
import { Users, UserPlus, Settings, LogOut, ShieldCheck, Globe, X, Layers } from 'lucide-react';
import { AdminTab } from '../types';
import { useLang } from '../context/LangContext';

interface AdminSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  onLogout: () => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  setActiveTab,
  onLogout,
  isOpenMobile,
  setIsOpenMobile,
}) => {
  const { t, lang, toggleLang } = useLang();

  const navItems = [
    {
      id: 'users' as AdminTab,
      label: t('user_list'),
      icon: Users,
    },
    {
      id: 'add_user' as AdminTab,
      label: t('add_user'),
      icon: UserPlus,
    },
    {
      id: 'settings' as AdminTab,
      label: t('admin_settings'),
      icon: Settings,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      {/* Sidebar Main Container - Collapsible on Hover for Desktop */}
      <aside
        className={`group fixed top-0 bottom-0 z-50 bg-slate-900/95 border-e border-slate-800 backdrop-blur-xl flex-col justify-between transition-all duration-300 ease-in-out shadow-2xl hidden lg:flex lg:translate-x-0 lg:w-[88px] lg:hover:w-72`}
      >
        {/* Sidebar Header */}
        <div className="p-4 lg:p-5 border-b border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-slate-950 shadow-lg shadow-emerald-950/50 shrink-0">
                <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="whitespace-nowrap opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300">
                <h1 className="font-bold text-slate-100 text-lg tracking-tight">SubManager</h1>
                <p className="text-xs text-emerald-400 font-medium">{t('admin_panel')}</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpenMobile(false)}
              className="lg:hidden text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="p-3 lg:p-4 space-y-2 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpenMobile(false);
                }}
                title={item.label}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3.5 rounded-xl font-medium text-sm transition-all duration-200 relative overflow-hidden ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500/20 to-slate-800/40 text-emerald-300 border-s-4 border-emerald-500 shadow-md shadow-emerald-950/20 font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border-s-4 border-transparent'
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-transform duration-300 ${
                    isActive
                      ? 'text-emerald-400 scale-110'
                      : 'text-slate-400 group-hover:text-emerald-400'
                  }`}
                />
                <span className="flex-1 text-start whitespace-nowrap opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300">
                  {item.label}
                </span>
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer: Version Badge & Logout */}
        <div className="p-3 lg:p-4 border-t border-slate-800/80 space-y-3 bg-slate-950/40">
          {/* Version Badge */}
          <div className="flex items-center lg:justify-center lg:group-hover:justify-between justify-between p-2 rounded-xl bg-slate-900 border border-slate-800/80 overflow-hidden">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 shrink-0">
              <Layers className="w-5 h-5 lg:w-3.5 lg:h-3.5 text-emerald-400" />
              <span className="whitespace-nowrap lg:hidden lg:group-hover:inline">{t('version')}</span>
            </div>
            <span className="px-2 py-0.5 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 text-[11px] font-mono font-bold tracking-wider shrink-0 lg:hidden lg:group-hover:inline">
              v2.2.0
            </span>
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            title={t('logout')}
            className="w-full flex items-center justify-center gap-2.5 p-3 rounded-xl bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 transition-all duration-200 font-semibold text-sm shadow-sm overflow-hidden"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap lg:hidden lg:group-hover:inline">{t('logout')}</span>
          </button>
        </div>
      </aside>
    </>
  );
};
