import React, { useState } from 'react';
import { UserAccount, LinkItem } from '../types';
import { UserCard } from './UserCard';
import { Search, Users, ShieldCheck, Link2, X } from 'lucide-react';
import { useLang } from '../context/LangContext';

interface UserListTabProps {
  users: UserAccount[];
  baseUrl: string;
  onUpdateUser: (user: UserAccount) => Promise<boolean>;
  onUpdateUserStatus: (user: UserAccount, status: 'active' | 'disabled') => Promise<boolean>;
  onDeleteUser: (userId: number) => Promise<boolean>;
  onAddLink: (userId: number, title: string, url: string) => Promise<boolean>;
  onUpdateLink: (link: LinkItem) => Promise<boolean>;
  onDeleteLink: (linkId: number) => Promise<boolean>;
  onShowQR: (title: string, url: string) => void;
}

export const UserListTab: React.FC<UserListTabProps> = ({
  users,
  baseUrl,
  onUpdateUser,
  onUpdateUserStatus,
  onDeleteUser,
  onAddLink,
  onUpdateLink,
  onDeleteLink,
  onShowQR,
}) => {
  const { t } = useLang();
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);

  // Edit user form fields
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'disabled'>('active');
  const [editExpireDate, setEditExpireDate] = useState('');

  // Edit link form fields
  const [editLinkTitle, setEditLinkTitle] = useState('');
  const [editLinkUrl, setEditLinkUrl] = useState('');

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = users.filter((u) => u.status === 'active').length;
  const totalLinks = users.reduce((acc, u) => acc + u.links.length, 0);

  const handleOpenEditUserModal = (u: UserAccount) => {
    setEditingUser(u);
    setEditUsername(u.username);
    setEditPassword('');
    setEditStatus(u.status);
    setEditExpireDate(u.expire_date || '');
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const updated: UserAccount = {
      ...editingUser,
      username: editUsername.trim(),
      status: editStatus,
      expire_date: editExpireDate || null,
    };
    if (editPassword) {
      updated.password = editPassword;
    }

    const success = await onUpdateUser(updated);
    if (success) {
      setEditingUser(null);
    }
  };

  const handleOpenEditLinkModal = (link: LinkItem) => {
    setEditingLink(link);
    setEditLinkTitle(link.title);
    setEditLinkUrl(link.url);
  };

  const handleSaveLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLink) return;

    const updated: LinkItem = {
      ...editingLink,
      title: editLinkTitle.trim(),
      url: editLinkUrl.trim(),
    };

    const success = await onUpdateLink(updated);
    if (success) {
      setEditingLink(null);
    }
  };

  return (
    <div className="space-y-6 max-w-full">
      {/* Top Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">{t('total_users')}</p>
            <h3 className="text-2xl font-bold font-mono text-slate-100">{users.length}</h3>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-teal-500/15 text-teal-400 border border-teal-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">{t('active_users')}</p>
            <h3 className="text-2xl font-bold font-mono text-emerald-400">{activeCount}</h3>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/20">
            <Link2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">{t('total_links')}</p>
            <h3 className="text-2xl font-bold font-mono text-slate-100">{totalLinks}</h3>
          </div>
        </div>
      </div>

      {/* Search Input Filter */}
      <div className="relative">
        <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t('search_user_placeholder')}
          className="w-full ps-11 pe-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all shadow-inner"
        />
      </div>

      {/* Users Card List */}
      <div>
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl">
            <p className="text-slate-400 text-sm">{t('no_users')}</p>
          </div>
        ) : (
          filteredUsers.filter(u => !!u).map((user) => (
            <UserCard
              key={user.id}
              user={user}
              baseUrl={baseUrl}
              onEditUser={handleOpenEditUserModal}
              onUpdateUserStatus={onUpdateUserStatus}
              onDeleteUser={(id) => onDeleteUser(id)}
              onAddLink={onAddLink}
              onEditLink={handleOpenEditLinkModal}
              onDeleteLink={(linkId) => onDeleteLink(linkId)}
              onShowQR={onShowQR}
            />
          ))
        )}
      </div>

      {/* Modal: Edit User */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 max-w-md w-full shadow-2xl relative space-y-4 gradient-border-emerald">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-base">{t('edit_user')}</h3>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">{t('username')}</label>
                <input
                  type="text"
                  required
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  dir="ltr"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">{t('password')}</label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  dir="ltr"
                  placeholder={t('password_placeholder')}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">{t('status')}</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as 'active' | 'disabled')}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="active">{t('active')}</option>
                    <option value="disabled">{t('disabled')}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">{t('expiration_date')}</label>
                  <input
                    type="date"
                    value={editExpireDate}
                    onChange={(e) => setEditExpireDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors"
                >
                  {t('save')}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
                >
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Link */}
      {editingLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 max-w-md w-full shadow-2xl relative space-y-4 gradient-border-emerald">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-base">ویرایش لینک کانفیگ</h3>
              <button
                onClick={() => setEditingLink(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLink} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">{t('link_title')}</label>
                <input
                  type="text"
                  required
                  value={editLinkTitle}
                  onChange={(e) => setEditLinkTitle(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">{t('link_url')}</label>
                <input
                  type="text"
                  required
                  value={editLinkUrl}
                  onChange={(e) => setEditLinkUrl(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors"
                >
                  {t('save')}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingLink(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
                >
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
