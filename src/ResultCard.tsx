import React from 'react';
import { 
  Download, Share2, RefreshCw, Baby, Calendar, User
} from 'lucide-react';
import { motion } from 'motion/react';
import { Language, i18n } from '../i18n';

interface ResultCardProps {
  image: string;
  fatherImage: string | null;
  motherImage: string | null;
  gender: 'male' | 'female';
  age: string;
  lang: Language;
  onReset: () => void;
}

export function ResultCard({ image, fatherImage, motherImage, gender, age, lang, onReset }: ResultCardProps) {
  const t = i18n[lang];

  // دالة تحميل الصورة مباشرة على جهاز المستخدم
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = image;
    link.download = `redline-child-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // دالة مشاركة النتيجة عبر تطبيقات التواصل الاجتماعي (يدعم الهواتف ذكية)
  const handleShare = async () => {
    if (navigator.share) {
      try {
        // تحويل الـ Base64 إلى ملف حقيقي ليتمكن النظام من مشاركته كصورة
        const res = await fetch(image);
        const blob = await res.blob();
        const file = new File([blob], 'child-result.jpg', { type: 'image/jpeg' });

        await navigator.share({
          files: [file],
          title: t.resultTitle || 'Red Line AI',
          text: t.resultText || 'Check out our future child prediction via Red Line AI!',
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // حل بديل في حال كان المتصفح لا يدعم الميزة (نسخ الرابط أو التنبيه)
      navigator.clipboard.writeText(window.location.origin);
      alert(lang === 'ar' ? 'تم نسخ رابط المنصة برابط الحافظة!' : 'Platform link copied to clipboard!');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="max-w-4xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8 relative"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* القسم الأول: عرض صورة الطفل والتحكم بها */}
      <div className="flex flex-col gap-6 items-center">
        <div className="w-full aspect-[3/4] rounded-[32px] overflow-hidden glass border-2 border-neon-blue/30 shadow-2xl shadow-neon-blue/10 relative group">
          <img 
            src={image} 
            alt="AI Generated Child" 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-102"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
          
          {/* شارة جنس المولود العائمة فوق الصورة */}
          <span className={`absolute top-4 ${lang === 'ar' ? 'left-4' : 'right-4'} px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-lg ${
            gender === 'male' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
          }`}>
            {gender === 'male' ? t.boy : t.girl}
          </span>
        </div>

        {/* أزرار الإجراءات السريعة (تحميل ومشاركة) */}
        <div className="grid grid-cols-2 gap-4 w-full">
          <button 
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 py-4 glass border border-white/10 rounded-2xl hover:bg-white/10 active:scale-95 transition-all font-bold text-xs uppercase tracking-widest text-slate-200"
          >
            <Download size={16} className="text-neon-blue" />
            {t.download || 'Download'}
          </button>
          <button 
            onClick={handleShare}
            className="flex items-center justify-center gap-2 py-4 bg-neon-blue text-black rounded-2xl hover:scale-[1.02] active:scale-95 transition-all font-bold text-xs uppercase tracking-widest"
          >
            <Share2 size={16} />
            {t.share || 'Share'}
          </button>
        </div>
      </div>

      {/* القسم الثاني: البيانات الجينية للأبوين والتفاصيل الإضافية */}
      <div className="flex flex-col justify-between gap-6">
        <div className="space-y-6">
          <div className="glass p-6 rounded-3xl border border-white/10 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
              <Baby size={16} className="text-neon-purple" />
              {lang === 'ar' ? 'المواصفات الحيوية المستنتجة' : 'Extracted Bio Metadata'}
            </h3>
            
            <div className="space-y-3 divide-y divide-white/5">
              <div className="flex justify-between items-center py-2 first:pt-0">
                <span className="text-xs text-white/50 flex items-center gap-2"><User size={14} /> {t.gender}</span>
                <span className={`text-sm font-bold ${gender === 'male' ? 'text-blue-400' : 'text-pink-400'}`}>
                  {gender === 'male' ? t.boy : t.girl}
                </span>
              </div>
              <div className="flex justify-between items-center pt-3">
                <span className="text-xs text-white/50 flex items-center gap-2"><Calendar size={14} /> {t.age || 'Age'}</span>
                <span className="text-sm font-bold text-slate-200">{age}</span>
              </div>
            </div>
          </div>

          {/* لوحة المقارنة البصرية للمدخلات الأصلية (الأب والأم) */}
          <div className="glass p-6 rounded-3xl border border-white/10 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/40">
              {lang === 'ar' ? 'العناصر الجينية المستخدمة' : 'Genetic Elements Employed'}
            </h4>
            <div className="grid grid-cols-2 gap-4">
              {fatherImage && (
                <div className="space-y-2 text-center">
                  <div className="aspect-square rounded-2xl overflow-hidden border border-white/10 bg-black/40">
                    <img src={fatherImage} alt="Father" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{t.father}</span>
                </div>
              )}
              {motherImage && (
                <div className="space-y-2 text-center">
                  <div className="aspect-square rounded-2xl overflow-hidden border border-white/10 bg-black/40">
                    <img src={motherImage} alt="Mother" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{t.mother}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* زر إعادة المحاولة والمزج من جديد */}
        <button 
          onClick={onReset}
          className="w-full flex items-center justify-center gap-2 py-4 border border-dashed border-white/20 hover:border-neon-purple/50 rounded-2xl text-white/60 hover:text-neon-purple transition-all text-xs font-bold uppercase tracking-widest bg-white/[0.01]"
        >
          <RefreshCw size={16} className="animate-hover" />
          {t.tryAgain}
        </button>
      </div>
    </motion.div>
  );
}
