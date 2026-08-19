import React, { useState } from 'react';
import { UserAccount, LinkItem } from '../types';
import { UserCard } from './UserCard';
import { Search, Users, ShieldCheck, Link2, X, Eye, EyeOff, Calendar, ListOrdered } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { useToast } from '../context/ToastContext';

interface UserListTabProps {
  users: UserAccount[];
  baseUrl: string;
  onUpdateUser: (user: UserAccount) => Promise<boolean>;
  onUpdateUserStatus: (user: UserAccount, status: 'active' | 'disabled') => Promise<boolean>;
  onDeleteUser: (userId: number) => Promise<boolean>;
  onReorderUsers?: (userIds: number[]) => Promise<boolean>;
  onAddLink: (userId: number, title: string, url: string) => Promise<boolean>;
  onUpdateLink: (link: LinkItem) => Promise<boolean>;
  onDeleteLink: (linkId: number) => Promise<boolean>;
  onReorderLinks?: (userId: number, linkIds: number[]) => Promise<boolean>;
  onShowQR: (title: string, url: string) => void;
}

export const UserListTab: React.FC<UserListTabProps> = ({
  users,
  baseUrl,
  onUpdateUser,
  onUpdateUserStatus,
  onDeleteUser,
  onReorderUsers,
  onAddLink,
  onUpdateLink,
  onDeleteLink,
  onReorderLinks,
  onShowQR,
}) => {
  const { t } = useLang();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  // Drag and Drop state for Users
  const [draggedUserId, setDraggedUserId] = useState<number | null>(null);
  const [dragOverUserId, setDragOverUserId] = useState<number | null>(null);

  // Modals state
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);

  // Edit user form fields
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'disabled'>('active');
  const [editDurationDays, setEditDurationDays] = useState('');
  const [editOrderIndex, setEditOrderIndex] = useState<number>(1);
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Edit link form fields
  const [editLinkTitle, setEditLinkTitle] = useState('');
  const [editLinkUrl, setEditLinkUrl] = useState('');

  const sortedUsers = [...users].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

  const filteredUsers = sortedUsers.filter((u) =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = users.filter((u) => u.status === 'active').length;
  const totalLinks = users.reduce((acc, u) => acc + (u.links || []).length, 0);

  const handleOpenEditUserModal = (u: UserAccount) => {
    setEditingUser(u);
    setEditUsername(u.username);
    setEditPassword('');
    setShowEditPassword(false);
    setEditStatus(u.status);
    setEditOrderIndex(u.order_index ?? 1);

    let days = '';
    if (u.expire_date) {
      const diff = new Date(u.expire_date).getTime() - new Date().getTime();
      if (diff > 0) {
        days = Math.ceil(diff / (1000 * 3600 * 24)).toString();
      }
    }
    setEditDurationDays(days);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    let finalExpireDate = editingUser.expire_date;
    if (editDurationDays !== '') {
      const days = parseInt(editDurationDays, 10);
      if (!isNaN(days) && days > 0) {
        const d = new Date();
        d.setDate(d.getDate() + days);
        finalExpireDate = d.toISOString().split('T')[0];
      } else {
        finalExpireDate = null;
      }
    } else {
      finalExpireDate = null;
    }

    const updated: UserAccount = {
      ...editingUser,
      username: editUsername.trim(),
      status: editStatus,
      expire_date: finalExpireDate,
      order_index: editOrderIndex,
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

  // DnD Handlers for User Cards
  const handleUserDragStart = (e: React.DragEvent, userId: number) => {
    setDraggedUserId(userId);
    e.dataTransfer.setData('text/plain', `user-${userId}`);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleUserDragOver = (e: React.DragEvent, userId: number) => {
    e.preventDefault();
    if (draggedUserId && draggedUserId !== userId) {
      setDragOverUserId(userId);
    }
  };

  const handleUserDragLeave = () => {
    setDragOverUserId(null);
  };

  const handleUserDrop = async (e: React.DragEvent, targetUserId: number) => {
    e.preventDefault();
    setDragOverUserId(null);
    if (!draggedUserId || draggedUserId === targetUserId || !onReorderUsers) return;

    const list = [...sortedUsers];
    const sourceIdx = list.findIndex((u) => u.id === draggedUserId);
    const targetIdx = list.findIndex((u) => u.id === targetUserId);

    if (sourceIdx !== -1 && targetIdx !== -1) {
      const [movedUser] = list.splice(sourceIdx, 1);
      list.splice(targetIdx, 0, movedUser);
      const userIds = list.map((u) => u.id);
      await onReorderUsers(userIds);
      showToast(t('reorder_success'), 'success');
    }
    setDraggedUserId(null);
  };

  const handleUserDragEnd = () => {
    setDraggedUserId(null);
    setDragOverUserId(null);
  };

  return (
    <div className="space-y-6 max-w-full">
      {/* Top Overview Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-5 shadow-lg flex flex-col sm:flex-row items-center sm:gap-4 text-center sm:text-start">
          <div className="p-2 sm:p-3.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 mb-2 sm:mb-0">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-slate-400 font-medium">{t('total_users')}</p>
            <h3 className="text-lg sm:text-2xl font-bold font-mono text-slate-100">{users.length}</h3>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-5 shadow-lg flex flex-col sm:flex-row items-center sm:gap-4 text-center sm:text-start">
          <div className="p-2 sm:p-3.5 rounded-xl bg-teal-500/15 text-teal-400 border border-teal-500/20 mb-2 sm:mb-0">
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-slate-400 font-medium">{t('active_users')}</p>
            <h3 className="text-lg sm:text-2xl font-bold font-mono text-emerald-400">{activeCount}</h3>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-5 shadow-lg flex flex-col sm:flex-row items-center sm:gap-4 text-center sm:text-start">
          <div className="p-2 sm:p-3.5 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 mb-2 sm:mb-0">
            <Link2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-slate-400 font-medium">{t('total_links')}</p>
            <h3 className="text-lg sm:text-2xl font-bold font-mono text-slate-100">{totalLinks}</h3>
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
          filteredUsers.map((user, idx) => (
            <UserCard
              key={user.id}
              user={user}
              index={idx}
              baseUrl={baseUrl}
              isDragging={draggedUserId === user.id}
              onDragStart={(e) => handleUserDragStart(e, user.id)}
              onDragOver={(e) => handleUserDragOver(e, user.id)}
              onDragLeave={handleUserDragLeave}
              onDrop={(e) => handleUserDrop(e, user.id)}
              onDragEnd={handleUserDragEnd}
              onEditUser={handleOpenEditUserModal}
              onUpdateUserStatus={onUpdateUserStatus}
              onDeleteUser={(id) => onDeleteUser(id)}
              onAddLink={onAddLink}
              onEditLink={handleOpenEditLinkModal}
              onDeleteLink={(linkId) => onDeleteLink(linkId)}
              onReorderLinks={onReorderLinks}
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
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
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
                  <label className="text-slate-300 font-semibold flex items-center gap-1">
                    <ListOrdered className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{t('row')}</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editOrderIndex}
                    onChange={(e) => setEditOrderIndex(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">{t('password')}</label>
                <div className="relative" dir="ltr">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    dir="ltr"
                    placeholder={t('password_placeholder')}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:border-emerald-500 focus:outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-400 hover:text-slate-100 p-1"
                  >
                    {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
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
                  <label className="text-slate-300 font-semibold">
                    {t('duration')} ({t('days')})
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editDurationDays}
                    onChange={(e) => setEditDurationDays(e.target.value)}
                    placeholder={t('unlimited')}
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
