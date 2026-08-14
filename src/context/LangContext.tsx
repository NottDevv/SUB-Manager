import React, { createContext, useContext, useState, useEffect } from 'react';
import { Lang } from '../types';
import { translations, t as translate } from '../translations';

interface LangContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: (key: keyof typeof translations['fa'], replacements?: Record<string, any>) => string;
  dir: 'rtl' | 'ltr';
}

const LangContext = createContext<LangContextType>({
  lang: 'fa',
  setLang: () => {},
  toggleLang: () => {},
  t: (key) => key,
  dir: 'rtl',
});

export const useLang = () => useContext(LangContext);

export const LangProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem('sub_lang') as Lang) || 'fa';
  });

  const dir = lang === 'fa' ? 'rtl' : 'ltr';

  useEffect(() => {
    localStorage.setItem('sub_lang', lang);
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [lang, dir]);

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
  };

  const toggleLang = () => {
    setLangState((prev) => (prev === 'fa' ? 'en' : 'fa'));
  };

  const t = (key: keyof typeof translations['fa'], replacements?: Record<string, any>) => {
    return translate(key, lang, replacements);
  };

  return (
    <LangContext.Provider value={{ lang, setLang, toggleLang, t, dir }}>
      {children}
    </LangContext.Provider>
  );
};
