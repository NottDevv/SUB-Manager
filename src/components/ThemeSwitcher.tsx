import React, { useState, useEffect, useRef } from 'react';
import { Palette, Moon, Sun, Droplet, Check } from 'lucide-react';
import { useLang } from '../context/LangContext';

interface ThemeSwitcherProps {
  theme: 'dark' | 'light' | 'ocean';
  setTheme: (theme: 'dark' | 'light' | 'ocean') => void;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ theme, setTheme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const themes = [
    { id: 'dark', label: 'Dark Slate', icon: <Moon className="w-4 h-4 text-emerald-400" />, color: 'bg-slate-900' },
    { id: 'light', label: 'Light', icon: <Sun className="w-4 h-4 text-amber-500" />, color: 'bg-slate-100' },
    { id: 'ocean', label: 'Modern Navy', icon: <Droplet className="w-4 h-4 text-blue-400" />, color: 'bg-blue-900' },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-slate-100 transition-colors h-full"
        title="Change Theme"
      >
        <Palette className="w-4 h-4 sm:mr-2" />
        <span className="hidden sm:inline text-xs font-medium">Theme</span>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 end-0 w-48 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-1.5 z-50 animate-fadeIn">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTheme(t.id as any);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                theme === t.id ? 'bg-slate-800 text-slate-100' : 'hover:bg-slate-800/60 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {t.icon}
                <span>{t.label}</span>
              </div>
              {theme === t.id && <Check className="w-3.5 h-3.5 text-slate-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
