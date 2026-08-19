import React, { useState, useEffect } from 'react';
import { UserAccount, LinkItem, AdminTab } from './types';
import { ToastProvider, useToast } from './context/ToastContext';
import { LangProvider, useLang } from './context/LangContext';
import { AdminSidebar } from './components/AdminSidebar';
import { UserListTab } from './components/UserListTab';
import { AddUserTab } from './components/AddUserTab';
import { AdminSettingsTab } from './components/AdminSettingsTab';
import { UserSubscriptionView } from './components/UserSubscriptionView';
import { QRCodeModal } from './components/QRCodeModal';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import {
  ShieldCheck,
  ShieldAlert,
  Globe,
  Eye,
  EyeOff,
  Sparkles,
  Users,
  UserPlus,
  Settings,
  LogOut,
  ArrowRight,
  Lock,
} from 'lucide-react';

function MainApp() {
  const { showToast } = useToast();
  const { t, lang, toggleLang } = useLang();

  const [theme, setTheme] = useState<'dark' | 'light' | 'ocean'>(() => {
    return (localStorage.getItem('app_theme') as 'dark' | 'light' | 'ocean') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  const [baseUrl, setBaseUrl] = useState('');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUsernameInput, setAdminUsernameInput] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [adminError, setAdminError] = useState('');

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Database State
  const [currentAdminUsername, setCurrentAdminUsername] = useState('admin');
  const [users, setUsers] = useState<UserAccount[]>([]);

  // Current Path state (for dynamic navigation without full reload if requested)
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined' && (window.location.pathname === '/' || window.location.pathname === '')) {
      window.history.replaceState(null, '', '/admin');
      return '/admin';
    }
    return typeof window !== 'undefined' ? window.location.pathname : '/admin';
  });

  // QR Modal global trigger
  const [globalQrState, setGlobalQrState] = useState<{ open: boolean; title: string; url: string }>({
    open: false,
    title: '',
    url: '',
  });

  // Current URL Path Routing Check (/USR/:username or /u/:username or /sub/:username)
  const subMatch = currentPath.match(/^\/(?:USR|u|sub)\/([^/]+)/i);
  const requestedUsername = subMatch ? decodeURIComponent(subMatch[1]) : null;
  const isAdminPath = currentPath === '/admin' || currentPath.startsWith('/admin/');

  // Session state for User page login
  const [authenticatedUser, setAuthenticatedUser] = useState<string | null>(() => {
    return sessionStorage.getItem('sub_auth_user');
  });

  useEffect(() => {
    setBaseUrl(window.location.origin);
    fetchData();

    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const data = await res.json();
        setCurrentAdminUsername(data.adminUsername || 'admin');
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Failed to fetch API data:', err);
    }
  };

  const navigateToAdmin = () => {
    window.history.pushState({}, '', '/admin');
    setCurrentPath('/admin');
  };

  // --- Admin Auth ---
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: adminUsernameInput.trim(),
          password: adminPasswordInput.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAdminLoggedIn(true);
        showToast(t('login_success'), 'success');
      } else {
        setAdminError(data.message || t('login_error'));
      }
    } catch {
      setAdminError(t('server_error'));
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    showToast(t('logout_success'), 'info');
  };

  // --- User Auth for Sub View ---
  const handleUserLogin = async (password: string): Promise<boolean> => {
    if (!requestedUsername) return false;
    try {
      const res = await fetch('/api/auth/user-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: requestedUsername, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAuthenticatedUser(requestedUsername);
        sessionStorage.setItem('sub_auth_user', requestedUsername);
        showToast(t('login_success'), 'success');
        return true;
      }
    } catch {}
    return false;
  };

  const handleUserLogout = () => {
    setAuthenticatedUser(null);
    sessionStorage.removeItem('sub_auth_user');
    showToast(t('logout_success'), 'info');
  };

  // --- Admin Data Mutations ---
  const handleAddUser = async (userObj: {
    username: string;
    password?: string;
    expire_date?: string;
    order_index?: number;
  }): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userObj),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(t('user_created_success'), 'success');
        await fetchData();
        setActiveTab('users');
        return true;
      } else {
        showToast(data.message || t('action_error'), 'error');
      }
    } catch {
      showToast(t('server_error'), 'error');
    }
    return false;
  };

  const handleUpdateUser = async (userObj: UserAccount): Promise<boolean> => {
    try {
      const res = await fetch(`/api/admin/users/${userObj.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userObj),
      });
      if (res.ok) {
        showToast(t('user_updated_success'), 'success');
        await fetchData();
        return true;
      }
    } catch {
      showToast(t('action_error'), 'error');
    }
    return false;
  };

  const handleReorderUsers = async (userIds: number[]): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/reorder-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds }),
      });
      if (res.ok) {
        await fetchData();
        return true;
      }
    } catch {
      showToast(t('action_error'), 'error');
    }
    return false;
  };

  const handleDeleteUser = async (userId: number): Promise<boolean> => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(t('user_deleted_success'), 'info');
        await fetchData();
        return true;
      }
    } catch {
      showToast(t('action_error'), 'error');
    }
    return false;
  };

  const handleAddLink = async (userId: number, title: string, url: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, url }),
      });
      if (res.ok) {
        showToast(t('action_success'), 'success');
        await fetchData();
        return true;
      }
    } catch {
      showToast(t('action_error'), 'error');
    }
    return false;
  };

  const handleUpdateLink = async (linkObj: LinkItem): Promise<boolean> => {
    try {
      const res = await fetch(`/api/admin/links/${linkObj.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(linkObj),
      });
      if (res.ok) {
        showToast(t('action_success'), 'success');
        await fetchData();
        return true;
      }
    } catch {
      showToast(t('action_error'), 'error');
    }
    return false;
  };

  const handleReorderLinks = async (userId: number, linkIds: number[]): Promise<boolean> => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/reorder-links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkIds }),
      });
      if (res.ok) {
        await fetchData();
        return true;
      }
    } catch {
      showToast(t('action_error'), 'error');
    }
    return false;
  };

  const handleDeleteLink = async (linkId: number): Promise<boolean> => {
    try {
      const res = await fetch(`/api/admin/links/${linkId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(t('action_success'), 'info');
        await fetchData();
        return true;
      }
    } catch {
      showToast(t('action_error'), 'error');
    }
    return false;
  };

  const handleUpdateAdminCredentials = async (
    newUsername: string,
    newPassword?: string
  ): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/update-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername, password: newPassword }),
      });
      if (res.ok) {
        showToast(t('action_success'), 'success');
        await fetchData();
        return true;
      }
    } catch {
      showToast(t('action_error'), 'error');
    }
    return false;
  };

  const handleDownloadBackup = () => {
    window.location.href = '/api/admin/backup';
    showToast(t('backup_downloaded'), 'success');
  };

  const handleRestoreBackup = async (file: File) => {
    try {
      const text = await file.text();
      const db = JSON.parse(text);
      const res = await fetch('/api/admin/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(db),
      });
      if (res.ok) {
        showToast(t('action_success'), 'success');
        await fetchData();
      } else {
        showToast(t('action_error'), 'error');
      }
    } catch {
      showToast(t('action_error'), 'error');
    }
  };

  // --- ROUTE 1: User Subscription Page Request (`/USR/:username` or `/u/:username` or `/sub/:username`) ---
  if (requestedUsername) {
    const targetUser = users.find(
      (u) => u.username.toLowerCase() === requestedUsername.toLowerCase()
    ) || {
      id: 999,
      username: requestedUsername,
      role: 'user',
      status: 'active',
      expire_date: '2026-12-31',
      created_at: new Date().toISOString(),
      links: [],
    };

    const isUserAuth = authenticatedUser?.toLowerCase() === requestedUsername.toLowerCase();

    return (
      <UserSubscriptionView
        user={targetUser}
        baseUrl={baseUrl}
        isAuthenticated={isUserAuth}
        onLogin={handleUserLogin}
        onLogout={handleUserLogout}
        theme={theme}
        setTheme={setTheme}
      />
    );
  }

  // --- ROUTE 2: 404 / Non-Admin Direct Access Restriction ---
  // If the path is not /admin or /admin/*, display a pure 404 page with no hints
  if (!isAdminPath) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl space-y-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 text-slate-400 mx-auto flex items-center justify-center border border-slate-700/50">
            <Lock className="w-8 h-8 stroke-[2]" />
          </div>

          <h2 className="text-xl font-bold text-slate-200">{t('not_found_title')}</h2>
        </div>
      </div>
    );
  }

  // --- ROUTE 3: Admin Login Screen (at `/admin`) ---
  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6">
        <header className="flex items-center justify-between max-w-4xl mx-auto w-full py-2">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleLang}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-slate-100 transition-colors h-full"
            >
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>{lang === 'fa' ? 'English' : 'فارسی'}</span>
            </button>
            <ThemeSwitcher theme={theme} setTheme={setTheme} />
          </div>
          <span className="font-mono text-xs font-bold text-emerald-400 tracking-wider">SubManager v1.2.0</span>
        </header>

        <main className="flex-1 flex items-center justify-center py-10">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl space-y-6 text-center gradient-border-emerald">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-slate-950 mx-auto flex items-center justify-center shadow-lg shadow-emerald-950/50">
              <ShieldCheck className="w-8 h-8 stroke-[2.2]" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-100">{t('admin_panel')}</h2>
              <p className="text-xs text-slate-400">{t('admin_login_desc')}</p>
            </div>

            {adminError && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-300 text-xs font-medium">
                {adminError}
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-1 text-start">
                <input
                  type="text"
                  required
                  value={adminUsernameInput}
                  onChange={(e) => setAdminUsernameInput(e.target.value)}
                  dir="ltr"
                  placeholder={t('username')}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="relative text-start" dir="ltr">
                <input
                  type={showAdminPass ? 'text' : 'password'}
                  required
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  dir="ltr"
                  placeholder={t('password')}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono text-sm focus:border-emerald-500 focus:outline-none pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPass(!showAdminPass)}
                  className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-400 hover:text-slate-100 p-1"
                >
                  {showAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all duration-200"
              >
                <Sparkles className="w-4 h-4" />
                <span>{t('login_btn')}</span>
              </button>
            </form>
          </div>
        </main>

        <footer className="text-center text-xs text-slate-600 py-4 font-mono">
          SubManager &copy; 2026 &bull; Slate & Emerald Edition
        </footer>
      </div>
    );
  }

  // --- ROUTE 4: Main Admin Dashboard View (when logged in at `/admin`) ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex overflow-x-hidden">
      {/* Modern Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleAdminLogout}
        isOpenMobile={isMobileSidebarOpen}
        setIsOpenMobile={setIsMobileSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:ms-[88px] flex flex-col min-h-screen transition-all duration-300 max-w-full overflow-x-hidden">
        {/* Top Header Bar for Mobile Toggle & Page Title */}
        <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="font-bold text-base sm:text-lg text-slate-100">
                {activeTab === 'users' && t('user_list')}
                {activeTab === 'add_user' && t('add_user')}
                {activeTab === 'settings' && t('admin_settings')}
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                {t('admin_header_subtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeSwitcher theme={theme} setTheme={setTheme} />
            <button
              onClick={toggleLang}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300 hover:text-slate-100 transition-colors h-full"
            >
              <Globe className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">{lang === 'fa' ? 'English' : 'فارسی'}</span>
              <span className="sm:hidden">{lang === 'fa' ? 'EN' : 'FA'}</span>
            </button>
            <button
              onClick={handleAdminLogout}
              className="lg:hidden p-1.5 rounded-xl bg-rose-500/20 hover:opacity-75 text-rose-400 border border-rose-500/30 transition-all shadow-sm active:scale-95"
              title={t('logout')}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Tab View Container */}
        <main className="flex-1 p-4 sm:p-8 max-w-6xl w-full mx-auto max-w-full overflow-x-hidden pb-24 lg:pb-8">
          {activeTab === 'users' && (
            <UserListTab
              users={users}
              baseUrl={baseUrl}
              onUpdateUser={handleUpdateUser}
              onUpdateUserStatus={async (u, status) => {
                return handleUpdateUser({ ...u, status });
              }}
              onDeleteUser={handleDeleteUser}
              onReorderUsers={handleReorderUsers}
              onAddLink={handleAddLink}
              onUpdateLink={handleUpdateLink}
              onDeleteLink={handleDeleteLink}
              onReorderLinks={handleReorderLinks}
              onShowQR={(title, url) => setGlobalQrState({ open: true, title, url })}
            />
          )}

          {activeTab === 'add_user' && <AddUserTab onAddUser={handleAddUser} usersCount={users.length} />}

          {activeTab === 'settings' && (
            <AdminSettingsTab
              currentAdminUsername={currentAdminUsername}
              onUpdateAdmin={handleUpdateAdminCredentials}
              onDownloadBackup={handleDownloadBackup}
              onRestoreBackup={handleRestoreBackup}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 z-40 flex items-center justify-around p-3 pb-safe">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
            activeTab === 'users' ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] font-bold">{t('user_list')}</span>
        </button>
        <button
          onClick={() => setActiveTab('add_user')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
            activeTab === 'add_user' ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserPlus className="w-5 h-5" />
          <span className="text-[10px] font-bold">{t('add_user')}</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
            activeTab === 'settings' ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-bold">{t('admin_settings')}</span>
        </button>
      </div>

      {/* Global QR Code Modal */}
      <QRCodeModal
        isOpen={globalQrState.open}
        onClose={() => setGlobalQrState({ ...globalQrState, open: false })}
        title={globalQrState.title}
        url={globalQrState.url}
      />
    </div>
  );
}

export default function App() {
  return (
    <LangProvider>
      <ToastProvider>
        <MainApp />
      </ToastProvider>
    </LangProvider>
  );
}
