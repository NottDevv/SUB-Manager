import React, { useState, useEffect } from 'react';
import { HardDrive, Clock } from 'lucide-react';
import { useLang } from '../context/LangContext';

interface SubLinkUsageInfoProps {
  url: string;
}

export const SubLinkUsageInfo: React.FC<SubLinkUsageInfoProps> = ({ url }) => {
  const { t, lang } = useLang();
  const [loading, setLoading] = useState(true);
  const [subData, setSubData] = useState<{
    upload: number;
    download: number;
    total: number;
    expire: number;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchInfo() {
      try {
        const res = await fetch(`/api/sub-info?url=${encodeURIComponent(url)}`);
        const data = await res.json();
        if (data.subscriptionUserinfo && isMounted) {
          const parts = data.subscriptionUserinfo.split(';');
          const info: Record<string, number> = {};
          parts.forEach((p: string) => {
            const [k, v] = p.trim().split('=');
            if (k && v) info[k] = parseInt(v, 10);
          });
          setSubData({
            upload: info.upload || 0,
            download: info.download || 0,
            total: info.total || 0,
            expire: info.expire || 0,
          });
        }
      } catch (err) {
        console.error('Failed to load sub info:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchInfo();
    return () => {
      isMounted = false;
    };
  }, [url]);

  if (loading) {
    return (
      <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center gap-2 text-xs text-slate-500">
        <div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        <span>{t('fetching_sub_info')}</span>
      </div>
    );
  }

  if (!subData) return null;

  const used = subData.upload + subData.download;
  const total = subData.total;
  const trafficPercentage = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;

  function formatBytes(bytes: number): string {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Duration calculations
  const nowSec = Math.floor(Date.now() / 1000);
  let durationStr = t('unlimited');
  let elapsedPercentage = 0; // Visual progress bar based on ELAPSED time
  let formattedDate = '';

  if (subData.expire > 0) {
    const diffSec = subData.expire - nowSec;
    const expDate = new Date(subData.expire * 1000);
    const dayStr = String(expDate.getDate()).padStart(2, '0');
    const monthStr = String(expDate.getMonth() + 1).padStart(2, '0');
    const yearStr = expDate.getFullYear();
    formattedDate = `${dayStr}/${monthStr}/${yearStr}`;

    if (diffSec <= 0) {
      durationStr = '0D 0H / 365D';
      elapsedPercentage = 100; // Fully expired
    } else {
      const remHoursTotal = Math.floor(diffSec / 3600);
      const remDays = Math.floor(remHoursTotal / 24);
      const remHours = remHoursTotal % 24;

      let totalDays = 365;
      if (remDays > 365) {
        totalDays = Math.ceil(remDays / 365) * 365;
      } else if (remDays <= 30) {
        totalDays = 30;
      } else if (remDays <= 90) {
        totalDays = 90;
      } else if (remDays <= 180) {
        totalDays = 180;
      }

      // Display format: Remaining Days & Hours / Total Days
      durationStr = `${remDays}D ${remHours}H / ${totalDays}D`;
      
      // Graphic progress bar: Elapsed Days / Total Days (progresses forward as time passes)
      const elapsedDays = Math.max(0, totalDays - remDays);
      elapsedPercentage = Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)));
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-slate-800/80 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/90 shadow-inner">
        {/* Left Column: Traffic Usage Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('traffic_usage')}</span>
            </div>
            <span className="font-mono text-xs font-bold text-slate-100">
              {formatBytes(used)} / {total > 0 ? formatBytes(total) : t('unlimited')}
            </span>
          </div>

          <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800 shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                trafficPercentage > 90
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'
                  : trafficPercentage > 75
                  ? 'bg-gradient-to-r from-emerald-500 to-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]'
                  : 'bg-gradient-to-r from-emerald-500 to-cyan-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
              }`}
              style={{ width: `${Math.max(total > 0 ? trafficPercentage : 100, 2)}%` }}
            />
          </div>
        </div>

        {/* Right Column: Duration Progress Bar (Elapsed Progress) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t('duration')}</span>
            </div>
            <span className="font-mono text-xs font-bold text-slate-100">
              {durationStr}
            </span>
          </div>

          <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800 shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                elapsedPercentage > 90
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'
                  : elapsedPercentage > 75
                  ? 'bg-gradient-to-r from-emerald-500 to-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]'
                  : 'bg-gradient-to-r from-emerald-500 to-cyan-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
              }`}
              style={{ width: `${Math.max(elapsedPercentage, 2)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
export default SubLinkUsageInfo;
