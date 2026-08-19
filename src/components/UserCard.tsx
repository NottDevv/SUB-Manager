import React, { useState } from 'react';
import { UserAccount, LinkItem } from '../types';
import {
  Copy,
  QrCode,
  Edit2,
  Trash2,
  ChevronDown,
  Plus,
  Calendar,
  Link as LinkIcon,
  Check,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Server,
  Globe,
  GripVertical,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useLang } from '../context/LangContext';
import { ConfirmModal } from './ConfirmModal';
import { SubLinkUsageInfo } from './SubLinkUsageInfo';

interface UserCardProps {
  user: UserAccount;
  index: number;
  baseUrl: string;
  onEditUser: (user: UserAccount) => void;
  onUpdateUserStatus: (user: UserAccount, status: 'active' | 'disabled') => Promise<boolean>;
  onDeleteUser: (userId: number) => void;
  onAddLink: (userId: number, title: string, url: string) => void;
  onEditLink: (link: LinkItem) => void;
  onDeleteLink: (linkId: number) => void;
  onReorderLinks?: (userId: number, linkIds: number[]) => Promise<boolean>;
  onShowQR: (title: string, url: string) => void;
  isDragging?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  index,
  baseUrl,
  onEditUser,
  onUpdateUserStatus,
  onDeleteUser,
  onAddLink,
  onEditLink,
  onDeleteLink,
  onReorderLinks,
  onShowQR,
  isDragging = false,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}) => {
  const { showToast } = useToast();
  const { t, lang } = useLang();
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedSub, setCopiedSub] = useState(false);

  // New Link form state
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const [confirmUserDelete, setConfirmUserDelete] = useState(false);
  const [confirmLinkDelete, setConfirmLinkDelete] = useState<number | null>(null);

  // Drag and Drop for Links within this card
  const [draggedLinkId, setDraggedLinkId] = useState<number | null>(null);
  const [dragOverLinkId, setDragOverLinkId] = useState<number | null>(null);

  const subUrl = `${baseUrl}/USR/${encodeURIComponent(user.username || '')}`;

  const handleCopySub = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await navigator.clipboard.writeText(subUrl);
      setCopiedSub(true);
      showToast(t('copied_toast'), 'success');
      setTimeout(() => setCopiedSub(false), 2000);
    } catch {
      showToast('Copy failed', 'error');
    }
  };

  const handleToggleStatus = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const nextStatus = user.status === 'active' ? 'disabled' : 'active';
    const success = await onUpdateUserStatus(user, nextStatus);
    if (success) {
      showToast(
        nextStatus === 'active' ? t('status_changed_active') : t('status_changed_disabled'),
        nextStatus === 'active' ? 'success' : 'info'
      );
    }
  };

  const handleAddLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;
    onAddLink(user.id, newTitle.trim(), newUrl.trim());
    setNewTitle('');
    setNewUrl('');
  };

  // Link DnD handlers
  const handleLinkDragStart = (e: React.DragEvent, linkId: number) => {
    e.stopPropagation();
    setDraggedLinkId(linkId);
    e.dataTransfer.setData('text/plain', `link-${linkId}`);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleLinkDragOver = (e: React.DragEvent, linkId: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedLinkId && draggedLinkId !== linkId) {
      setDragOverLinkId(linkId);
    }
  };

  const handleLinkDrop = async (e: React.DragEvent, targetLinkId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverLinkId(null);
    if (!draggedLinkId || draggedLinkId === targetLinkId || !onReorderLinks) return;

    const linksList = [...(user.links || [])];
    const sourceIdx = linksList.findIndex((l) => l.id === draggedLinkId);
    const targetIdx = linksList.findIndex((l) => l.id === targetLinkId);

    if (sourceIdx !== -1 && targetIdx !== -1) {
      const [movedLink] = linksList.splice(sourceIdx, 1);
      linksList.splice(targetIdx, 0, movedLink);
      const linkIds = linksList.map((l) => l.id);
      await onReorderLinks(user.id, linkIds);
      showToast(t('reorder_success'), 'success');
    }
    setDraggedLinkId(null);
  };

  const handleLinkDragEnd = (e: React.DragEvent) => {
    e.stopPropagation();
    setDraggedLinkId(null);
    setDragOverLinkId(null);
  };

  // Determine user expiration status
  const isExpired = user.expire_date && new Date(user.expire_date) < new Date();
  const isUserActive = user.status === 'active' && !isExpired;

  let daysRemaining: number | string = t('unlimited');
  if (user.expire_date) {
    const remainingTime = new Date(user.expire_date).getTime() - new Date().getTime();
    daysRemaining = Math.max(0, Math.ceil(remainingTime / (1000 * 3600 * 24)));
  }

  const rowNumber = user.order_index ?? index + 1;

  return (
    <div
      draggable={true}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`bg-slate-900 border rounded-2xl overflow-hidden shadow-xl transition-all duration-200 mb-5 max-w-full ${
        isDragging
          ? 'opacity-40 border-emerald-500 scale-[0.99]'
          : 'border-slate-800 hover:border-slate-700/80 hover:shadow-2xl hover:shadow-slate-950/50'
      }`}
    >
      {/* User Card Top Header */}
      <div className="p-4 sm:p-6 bg-slate-900/90 border-b border-slate-800/60 max-w-full overflow-x-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 max-w-full">
          {/* Main User Meta info */}
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            {/* Drag Grip Handle */}
            <div
              title={t('drag_drop_hint')}
              className="p-2 -ms-1 text-slate-500 hover:text-emerald-400 cursor-grab active:cursor-grabbing transition-colors shrink-0 touch-none"
            >
              <GripVertical className="w-5 h-5" />
            </div>

            {/* Row Number Badge */}
            <div className="px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700/80 font-mono font-bold text-xs text-emerald-400 shrink-0 shadow-inner flex items-center gap-1">
              <span className="text-[10px] text-slate-400 font-sans hidden sm:inline">{t('row')}</span>
              <span>#{rowNumber}</span>
            </div>

            <div className="w-11 h-11 rounded-2xl bg-slate-800 border border-slate-700/60 flex items-center justify-center font-mono font-bold text-base text-emerald-400 shrink-0 shadow-inner">
              {(user.username || '').charAt(0).toUpperCase()}
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight font-mono truncate max-w-[180px] sm:max-w-none">
                  {user.username}
                </h3>

                {/* Clickable Status Badge */}
                <button
                  onClick={handleToggleStatus}
                  title={t('click_to_change_status')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95 ${
                    isUserActive
                      ? 'bg-emerald-950/90 hover:bg-emerald-900 text-emerald-400 border border-emerald-800/80 shadow-sm shadow-emerald-950/50'
                      : 'bg-rose-950/90 hover:bg-rose-900 text-rose-400 border border-rose-800/80 shadow-sm shadow-rose-950/50'
                  }`}
                >
                  {isUserActive ? (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{t('active')}</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>{isExpired ? t('expired') : t('disabled')}</span>
                    </>
                  )}
                </button>

                {/* Config Count Badge */}
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700/60 shrink-0">
                  {t('links_count', { count: (user.links || []).length })}
                </span>
              </div>

              {/* Expiration Date Metric */}
              <div className="flex items-center gap-1.5 text-xs text-slate-400 pt-0.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{t('expiration_date')}:</span>
                <strong className="text-slate-200 font-mono">
                  {user.expire_date ? `${user.expire_date} (${daysRemaining} ${t('days')})` : t('unlimited')}
                </strong>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* Edit User */}
            <button
              onClick={() => onEditUser(user)}
              title={t('edit')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:opacity-75 text-slate-950 border border-amber-400 text-xs font-bold transition-all duration-200 shadow-sm active:scale-95 btn-edit"
            >
              <Edit2 className="w-4 h-4 text-slate-950 icon-edit" />
              <span className="hidden sm:inline">{t('edit')}</span>
            </button>

            {/* Delete User */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setConfirmUserDelete(true);
              }}
              title={t('delete')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:opacity-75 text-white border border-rose-500 text-xs font-bold transition-all duration-200 shadow-sm active:scale-95 btn-delete"
            >
              <Trash2 className="w-4 h-4 text-white icon-delete" />
              <span className="hidden sm:inline">{t('delete')}</span>
            </button>

            {/* Toggle Configs Expand */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/60 ms-1"
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-300 ${
                  isExpanded ? 'rotate-180 text-emerald-400' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* SECTION 1: Subscription Link Display (User Page URL) */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <LinkIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t('user_page_link')}</span>
          </div>
          <div
            className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono max-w-full overflow-hidden"
            dir="ltr"
          >
            <span className="text-slate-300 truncate flex-1 text-start select-all">{subUrl}</span>
            <a
              href={subUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 text-slate-400 hover:text-emerald-400 transition-colors shrink-0"
              title="Open User Page"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* SECTION 2: Expandable Direct Config Links Section */}
      {isExpanded && (
        <div className="p-5 bg-slate-950/60 space-y-6 border-t border-slate-800/80 max-w-full overflow-x-hidden animate-fadeIn">
          {/* Form to Add New Config Link to this user */}
          <form
            onSubmit={handleAddLinkSubmit}
            className="grid grid-cols-1 md:grid-cols-12 gap-2.5 p-3 rounded-xl bg-slate-900 border border-slate-800 max-w-full shadow-lg"
            dir="ltr"
          >
            <div className="md:col-span-3">
              <input
                type="text"
                placeholder={t('title_placeholder')}
                dir="ltr"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
            <div className="md:col-span-6">
              <input
                type="text"
                placeholder={t('url_placeholder')}
                dir="ltr"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
            <div className="md:col-span-3">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>{t('add_sub_links_and_configs')}</span>
              </button>
            </div>
          </form>

          {/* Categorized Lists */}
          <div className="space-y-6">
            {(() => {
              const safeLinks = Array.isArray(user.links) ? user.links : [];
              const subLinks = safeLinks.filter(
                (l) => typeof l.url === 'string' && l.url.toLowerCase().startsWith('http')
              );
              const directConfigs = safeLinks.filter(
                (l) => typeof l.url === 'string' && !l.url.toLowerCase().startsWith('http')
              );

              if (safeLinks.length === 0) {
                return (
                  <p className="text-xs text-slate-500 italic py-2 text-center">
                    {t('no_links_user')}
                  </p>
                );
              }

              const renderItem = (link: LinkItem, linkIndex: number) => {
                const isSub = typeof link.url === 'string' && link.url.toLowerCase().startsWith('http');
                const isItemDragging = draggedLinkId === link.id;
                const isItemDragOver = dragOverLinkId === link.id;

                return (
                  <div
                    key={link.id || linkIndex}
                    draggable={true}
                    onDragStart={(e) => handleLinkDragStart(e, link.id)}
                    onDragOver={(e) => handleLinkDragOver(e, link.id)}
                    onDrop={(e) => handleLinkDrop(e, link.id)}
                    onDragEnd={handleLinkDragEnd}
                    className={`p-3.5 rounded-xl bg-slate-900/90 border text-xs transition-all max-w-full overflow-hidden shadow-sm space-y-2.5 ${
                      isItemDragging
                        ? 'opacity-40 border-emerald-500'
                        : isItemDragOver
                        ? 'border-emerald-400 bg-slate-800/90'
                        : 'border-slate-800/90 hover:border-slate-700/80'
                    }`}
                    dir="ltr"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        {/* Drag Handle for Link */}
                        <div
                          title={t('drag_drop_hint')}
                          className="p-1 -ms-1 text-slate-500 hover:text-emerald-400 cursor-grab active:cursor-grabbing transition-colors shrink-0"
                        >
                          <GripVertical className="w-4 h-4" />
                        </div>

                        <span className="px-2.5 py-1 rounded-md bg-slate-800 font-semibold text-emerald-400 shrink-0 font-sans shadow-inner">
                          {link.title}
                        </span>
                        <span
                          dir={lang === 'fa' ? 'ltr' : 'auto'}
                          className="font-mono text-slate-400 truncate text-[11px] flex-1 text-start"
                        >
                          {link.url}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        {/* Copy Link */}
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            await navigator.clipboard.writeText(link.url);
                            showToast(t('copied_toast'), 'success');
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition-colors border border-slate-700/50 btn-action-copy"
                          title={t('copy')}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {/* QR Code */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            onShowQR(link.title, link.url);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition-colors border border-slate-700/50 btn-action-qr"
                          title={t('qr_code')}
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit Link */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            onEditLink(link);
                          }}
                          className="p-1.5 rounded-lg bg-amber-500/20 hover:opacity-75 text-amber-400 border border-amber-500/40 transition-all btn-edit"
                          title={t('edit')}
                        >
                          <Edit2 className="w-3.5 h-3.5 icon-edit" />
                        </button>

                        {/* Delete Link */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setConfirmLinkDelete(link.id);
                          }}
                          className="p-1.5 rounded-lg bg-rose-500/20 hover:opacity-75 text-rose-400 border border-rose-500/40 transition-all btn-delete"
                          title={t('delete')}
                        >
                          <Trash2 className="w-3.5 h-3.5 icon-delete" />
                        </button>
                      </div>
                    </div>

                    {/* Subscription Info & Traffic Usage & Duration Progress Bars */}
                    {isSub && <SubLinkUsageInfo url={link.url} />}
                  </div>
                );
              };

              return (
                <>
                  {subLinks.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        <Globe className="w-4 h-4 text-emerald-400" />
                        <span>
                          {t('sub_links_management')} ({subLinks.length})
                        </span>
                      </h4>
                      <div className="space-y-2.5">{subLinks.map((l, i) => renderItem(l, i))}</div>
                    </div>
                  )}

                  {directConfigs.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        <Server className="w-4 h-4 text-teal-400" />
                        <span>
                          {t('direct_configs_section')} ({directConfigs.length})
                        </span>
                      </h4>
                      <div className="space-y-2.5">{directConfigs.map((l, i) => renderItem(l, i))}</div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={confirmUserDelete}
        onClose={() => setConfirmUserDelete(false)}
        onConfirm={() => {
          onDeleteUser(user.id);
          setConfirmUserDelete(false);
        }}
        title={t('delete')}
        message={t('confirm_delete_user')}
      />

      <ConfirmModal
        isOpen={confirmLinkDelete !== null}
        onClose={() => setConfirmLinkDelete(null)}
        onConfirm={() => {
          if (confirmLinkDelete !== null) {
            onDeleteLink(confirmLinkDelete);
            setConfirmLinkDelete(null);
          }
        }}
        title={t('delete')}
        message={t('confirm_delete_link')}
      />
    </div>
  );
};
