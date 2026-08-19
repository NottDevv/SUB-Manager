import React, { useState } from 'react';
import { UserPlus, User, Lock, Calendar, Eye, EyeOff, Sparkles, ListOrdered } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { useToast } from '../context/ToastContext';

interface AddUserTabProps {
  usersCount?: number;
  onAddUser: (data: {
    username: string;
    password?: string;
    expire_date?: string;
    order_index?: number;
  }) => Promise<boolean>;
}

export const AddUserTab: React.FC<AddUserTabProps> = ({ usersCount = 0, onAddUser }) => {
  const { t } = useLang();
  const { showToast } = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [expireDays, setExpireDays] = useState('');
  const [orderIndex, setOrderIndex] = useState<string>(() => String(usersCount + 1));
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      showToast('لطفا نام کاربری را وارد کنید', 'error');
      return;
    }

    setIsSubmitting(true);
    
    let finalExpireDate = undefined;
    if (expireDays && !isNaN(Number(expireDays))) {
      const d = new Date();
      d.setDate(d.getDate() + parseInt(expireDays, 10));
      finalExpireDate = d.toISOString().split('T')[0];
    }

    const customOrder = orderIndex ? parseInt(orderIndex, 10) : usersCount + 1;

    const success = await onAddUser({
      username: username.trim(),
      password: password || undefined,
      expire_date: finalExpireDate,
      order_index: isNaN(customOrder) ? 1 : customOrder,
    });

    setIsSubmitting(false);

    if (success) {
      setUsername('');
      setPassword('');
      setExpireDays('');
      setOrderIndex(String(usersCount + 2));
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-900 border border-slate-800 shadow-xl relative overflow-hidden gradient-border-emerald">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <UserPlus className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">{t('add_user')}</h2>
            <p className="text-xs text-slate-400 mt-1">{t('new_user_title')}</p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-400" />
              <span>{t('username')}</span>
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('username_placeholder')}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>{t('password')}</span>
            </label>
            <div className="relative" dir="ltr">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                dir="ltr"
                placeholder={t('password_input_placeholder')}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-400 hover:text-slate-100 p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Expiration Days & Row Order Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Expiration Days */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>{t('expiration_date')} ({t('days')})</span>
              </label>
              <input
                type="number"
                min="1"
                value={expireDays}
                onChange={(e) => setExpireDays(e.target.value)}
                dir="ltr"
                placeholder={t('unlimited')}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all"
              />
              <p className="text-[11px] text-slate-500 ms-1 text-start">{t('expire_date_hint')}</p>
            </div>

            {/* Row / Order Index */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-emerald-400" />
                <span>{t('row_order')}</span>
              </label>
              <input
                type="number"
                min="1"
                value={orderIndex}
                onChange={(e) => setOrderIndex(e.target.value)}
                dir="ltr"
                placeholder="1"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all"
              />
              <p className="text-[11px] text-slate-500 ms-1 text-start">{t('row_order_hint')}</p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? t('submitting') : t('btn_create_user')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
