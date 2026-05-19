import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dna, Fingerprint, Heart, Search } from 'lucide-react';
import { Language, i18n } from '../i18n';

interface LoadingScreenProps {
  lang: Language;
  adImageUrl?: string | null;
}

export function LoadingScreen({ lang, adImageUrl }: LoadingScreenProps) {
  const steps = [
    { icon: Search, label: i18n[lang].analyzingFaces },
    { icon: Fingerprint, label: i18n[lang].mergingDNA },
    { icon: Dna, label: i18n[lang].processing },
    { icon: Heart, label: i18n[lang].finalizing }
  ];

  const [currentStep, setCurrentStep] = React.useState(0);
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => (prev >= 100 ? 100 : prev + 1));
    }, 50);

    const stepInterval = setInterval(() => {
      setCurrentStep(prev => (prev === steps.length - 1 ? prev : prev + 1));
    }, 1500);

    return () => {
      clearInterval(interval);
      clearInterval(stepInterval);
    };
  }, [steps.length]);

  const ActiveIcon = steps[currentStep].icon;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between p-6 bg-[#050505]/95 backdrop-blur-xl overflow-y-auto" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/5 via-transparent to-neon-purple/5 pointer-events-none" />
      
      {/* القسم العلوي: عداد التقدّم والخطوات المتحركة */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full my-auto space-y-10">
        
        {/* الدائرة المركزية المشعة التي تعرض الأيقونة الحالية */}
        <div className="relative w-28 h-28 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl shadow-neon-blue/10 group">
          <div className="absolute inset-0 rounded-full border-2 border-t-neon-blue border-r-transparent border-b-neon-purple border-l-transparent animate-spin duration-1000" />
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, scale: 0.8, rotate: -20 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.8, rotate: 20 }}
              transition={{ duration: 0.3 }}
              className="text-neon-blue"
            >
              <ActiveIcon size={38} className="animate-pulse" />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* النصوص المتغيرة للخطوات التكنولوجية الحالية */}
        <div className="text-center h-14 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-1"
            >
              <p className="text-sm font-bold tracking-widest text-white uppercase">
                {steps[currentStep].label}
              </p>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">
                {lang === 'ar' ? 'برجاء الانتظار قليلاً...' : 'Please wait a moment...'}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* شريط التحميل الرقمي والنسبة المئوية */}
        <div className="w-full space-y-3">
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
              {lang === 'ar' ? 'معدل المعالجة الجينية' : 'Genetic Processing Rate'}
            </span>
            <span className="text-sm font-mono font-bold text-neon-blue">
              {progress}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
            <motion.div 
              className="h-full rounded-full bg-gradient-to-r from-neon-blue to-neon-purple shadow-lg shadow-neon-blue/50"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </div>
      </div>

      {/* القسم السفلي: بنر الإعلانات المجدول (إذا تم رفعه من لوحة التحكم) */}
      {adImageUrl && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xl mx-auto mt-auto pt-6 border-t border-white/5 text-center space-y-2 shrink-0"
        >
          <span className="text-[9px] font-bold uppercase tracking-widest text-white/30 px-2 py-0.5 border border-white/10 rounded bg-white/5">
            {lang === 'ar' ? 'إعلان ترويجي' : 'Sponsored Ad'}
          </span>
          <div className="w-full aspect-[4/1] sm:aspect-[5/1] rounded-2xl overflow-hidden border border-white/10 bg-white/5 shadow-2xl relative group">
            <img 
              src={adImageUrl} 
              alt="Platform Sponsor" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}
