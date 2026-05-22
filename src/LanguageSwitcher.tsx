import React from 'react';
import { Languages } from 'lucide-react';
// تصحيح المسار بنقطة واحدة لقراءة الملف من نفس المجلد الرئيسي لحل مشكلة الـ Build
import { Language } from './i18n';

interface LanguageSwitcherProps {
  current: Language;
  onToggle: () => void;
}

export function LanguageSwitcher({ current, onToggle }: LanguageSwitcherProps) {
  return (
    <button 
      onClick={onToggle}
      className="flex items-center gap-2 px-4 py-2 glass rounded-full hover:bg-white/10 transition-all group"
    >
      <Languages size={18} className="text-neon-blue group-hover:rotate-12 transition-transform" />
      <span className="text-xs font-bold uppercase tracking-wider text-white">
        {current === 'en' ? 'العربية' : 'English'}
      </span>
    </button>
  );
}
