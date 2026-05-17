/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
// تصحيح مسار الحزمة ليتوافق مع package.json الخاص بك في React 19
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dna, 
  ChevronRight, 
  Baby, 
  Settings, 
  Lock, 
  Eye, 
  EyeOff,
  AlertCircle,
  Users,
  Activity
} from 'lucide-react';
import { Language, i18n } from './i18n';
import { FileUpload } from './components/FileUpload';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { LoadingScreen } from './components/LoadingScreen';
import { ResultCard } from './components/ResultCard';
import { AdminPanel } from './components/AdminPanel';
import { generateChildImage, validateParentsGender } from './services/aiService';

const ADMIN_PASSWORD = "SD09042112";
// تجميع خيارات الأعمار لتجنب التكرار في الأكواد
const AGE_OPTIONS = ['Infant', '5 Years', '10 Years', '15 Years', 'Adult'];

export default function App() {
  const [lang, setLang] = React.useState<Language>((localStorage.getItem('site_lang') as Language) || 'ar');
  const [fatherImg, setFatherImg] = React.useState<string | null>(null);
  const [motherImg, setMotherImg] = React.useState<string | null>(null);
  const [gender, setGender] = React.useState<'boy' | 'girl'>('boy');
  const [ageIndex, setAgeIndex] = React.useState(1); // الافتراضي هو '5 Years'
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [resultImage, setResultImage] = React.useState<string | null>(null);

  // إعدادات الإدارة (Admin States)
  const [showAdminLogin, setShowAdminLogin] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [adminPass, setAdminPass] = React.useState('');
  const [adminError, setAdminError] = React.useState(false);
  const [adminClickCount, setAdminClickCount] = React.useState(0);
  const [showPass, setShowPass] = React.useState(false);

  // إحصائيات حيوية ومحاكاة العدادات
  const [activeCount, setActiveCount] = React.useState(13000000);
  const [totalVisits, setTotalVisits] = React.useState(0);
  const [messages, setMessages] = React.useState<any[]>([]);
  const [activeAd, setActiveAd] = React.useState<any>(null);
  const [siteConfig, setSiteConfig] = React.useState<any>({
    siteName: 'طفلي بالذكاء الاصطناعي',
    broadcastMessage: '',
    primaryColor: '#bc13fe',
    siteLogo: '',
    defaultLang: 'ar'
  });

  React.useEffect(() => {
    // 1. جلب الإحصائيات الحقيقية وزيادة عداد الزيارات عند فتح الموقع
    fetch('/api/stats/visit', { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        setTotalVisits(data.visitors || 0);
      })
      .catch(() => {});

    // 2. جلب إعدادات الموقع واللغة الافتراضية
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        if (data && data.siteName) {
          setSiteConfig(data);
          if (data.defaultLang && !localStorage.getItem('site_lang')) {
            setLang(data.defaultLang as Language);
          }
        }
      })
      .catch(() => {});

    // 3. جلب الإعلانات النشطة لقاعدة البيانات
    fetch('/api/ad')
      .then(res => res.json())
      .then(data => {
        if (data && data.imageUrl && data.isActive) {
          setActiveAd(data);
        }
      })
      .catch(() => {});

    // 4. جلب شريط الرسائل الإدارية المتحرك
    fetch('/api/messages')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setMessages(data);
      })
      .catch(() => {});
  }, []);

  // منطق المحاكاة السريعة لأرقام المتواجدين حالياً (للشكل الجمالي والتفاعلي)
  React.useEffect(() => {
    const fluctuationInterval = setInterval(() => {
      setActiveCount(prev => {
        const delta = Math.floor(Math.random() * 850000) - 400000;
        let next = prev + delta;
        if (next < 13000000) next = 13000000 + Math.random() * 1000000;
        return Math.floor(next);
      });
    }, 150);
    return () => clearInterval(fluctuationInterval);
  }, []);

  const t = i18n[lang];

  // دالة توليد صورة الطفل مع فحص الجينات والربط مع السيرفر السحابي
  const handleGenerate = async () => {
    if (!fatherImg || !motherImg) return;
    setIsGenerating(true);
    try {
      // المرحلة الأولى: التحقق من جنس الوالدين عبر Gemini
      const validation = await validateParentsGender(fatherImg, motherImg);
      if (!validation.isValid) {
        alert(t.bothGendersInvalid || "تأكد من رفع صورة أب (ذكر) وصورة أم (أنثى) صحيحة.");
        setIsGenerating(false);
        return;
      }
      
      // المرحلة الثانية: إرسال الملامح وتوليد صورة الطفل الحقيقية
      const aiAge = AGE_OPTIONS[ageIndex];
      const result = await generateChildImage(fatherImg, motherImg, gender, aiAge);
      setResultImage(result);

      // المرحلة الثالثة: إرسال إشارة للسيرفر لزيادة عداد التوقعات الحقيقية في الـ Database
      await fetch('/api/stats/increment', { method: 'POST' }).catch(() => {});
      
    } catch (err: any) {
      alert("AI Service Error: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleLanguage = () => {
    const newLang = lang === 'ar' ? 'en' : 'ar';
    setLang(newLang);
    localStorage.setItem('site_lang', newLang);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPass === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setAdminError(false);
    } else {
      setAdminError(true);
    }
  };

  if (isAdmin) {
    return <AdminPanel onLogout={() => { setIsAdmin(false); setAdminClickCount(0); }} lang={lang} onLanguageToggle={toggleLanguage} />;
  }

  return (
    <div className={`min-h-screen relative flex flex-col font-sans ${lang === 'ar' ? 'rtl' : 'ltr'}`}>
      <div className="atmosphere" />
      
      {/* سطر الرسائل المتحرك الإداري */}
      {messages.length > 0 && (
        <div className="bg-white/5 py-1.5 z-40 overflow-hidden whitespace-nowrap border-b border-white/5">
          <div className="animate-marquee inline-block">
            {messages.map((m, i) => (
              <span key={i} className="text-[11px] font-medium text-white/80 mx-10">
                {m.text}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* الهيدر العلوي */}
      <header className="p-6 flex items-center justify-between z-20 max-w-7xl w-full mx-auto">
        <LanguageSwitcher current={lang} onToggle={toggleLanguage} />
        
        {/* زر سري مدمج: اضغط 5 مرات متتالية لفتح لوحة التحكم الإدارية */}
        <motion.button
          onClick={() => {
            const nextCount = adminClickCount + 1;
            if (nextCount >= 5) setShowAdminLogin(true);
            setAdminClickCount(nextCount);
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-3 glass rounded-full border border-white/10 shadow-lg"
        >
          <Dna size={20} className="text-[#bc13fe]" />
        </motion.button>
      </header>

      {/* نافذة تسجيل دخول الإدارة المنبثقة */}
      <AnimatePresence>
        {showAdminLogin && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass p-8 rounded-3xl max-w-md w-full border border-white/10 relative"
            >
              <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
                <Lock size={20} className="text-[#bc13fe]" /> لوحة التحكم الأمنية
              </h2>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="relative">
                  <input 
                    type={showPass ? "text" : "password"} 
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    placeholder="أدخل كلمة مرور النظام"
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white pr-12 focus:outline-none focus:border-[#bc13fe]"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPass(!showPass)}
                    className="absolute top-4 left-4 text-white/50 hover:text-white"
                  >
                    {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {adminError && <p className="text-red-400 text-sm flex items-center gap-1"><AlertCircle size={16}/> كلمة المرور غير صحيحة!</p>}
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 py-3 bg-[#bc13fe] text-white font-bold rounded-xl hover:bg-[#a111db] transition">دخول</button>
                  <button type="button" onClick={() => { setShowAdminLogin(false); setAdminClickCount(0); }} className="py-3 px-4 bg-white/10 text-white rounded-xl hover:bg-white/20">إلغاء</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* محتوى الصفحة الرئيسي التفاعلي */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 z-10 max-w-7xl w-full mx-auto">
        <AnimatePresence mode="wait">
          {isGenerating ? (
            <LoadingScreen lang={lang} adImageUrl={activeAd?.imageUrl} />
          ) : resultImage ? (
            <ResultCard 
              image={resultImage} 
              gender={gender} 
              age={AGE_OPTIONS[ageIndex]} 
              lang={lang} 
              onReset={() => setResultImage(null)} 
            />
          ) : (
            <div className="w-full grid lg:grid-cols-2 gap-12 items-center">
              {/* قسم رفع الصور المتطور */}
              <div className="grid grid-cols-2 gap-6">
                <FileUpload label={t.uploadFather} image={fatherImg} lang={lang} onUpload={setFatherImg} onRemove={() => setFatherImg(null)} />
                <FileUpload label={t.uploadMother} image={motherImg} lang={lang} onUpload={setMotherImg} onRemove={() => setMotherImg(null)} />
              </div>

              {/* قسم التحكم والإعدادات */}
              <div className="space-y-8">
                <div className="space-y-2">
                  <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-white/90 to-white/60 bg-clip-text text-transparent">
                    {siteConfig.siteName || t.title}
                  </h1>
                  <p className="text-white/50 text-sm font-medium flex items-center gap-4">
                    <span className="flex items-center gap-1"><Users size={16} className="text-[#bc13fe]"/> {activeCount.toLocaleString()} {lang === 'ar' ? 'مستعلم نشط' : 'Active users'}</span>
                    <span className="flex items-center gap-1"><Activity size={16} className="text-green-400"/> {totalVisits} {lang === 'ar' ? 'زيارة حقيقية' : 'Total visits'}</span>
                  </p>
                </div>

                <div className="glass p-8 rounded-[2.5rem] space-y-6 border border-white/5 shadow-2xl">
                  {/* أزرار اختيار نوع الطفل */}
                  <div className="grid grid-cols-2 gap-4">
                    {(['boy', 'girl'] as const).map((g) => (
                      <button 
                        key={g} 
                        onClick={() => setGender(g)} 
                        className={`py-4 rounded-2xl border transition-all duration-3xl text-sm font-bold tracking-wide ${gender === g ? 'border-[#bc13fe]/50 bg-[#bc13fe]/10 text-white shadow-lg shadow-[#bc13fe]/10' : 'border-white/5 bg-white/5 text-white/40 hover:bg-white/10'}`}
                      >
                        {g === 'boy' ? t.boy : t.girl}
                      </button>
                    ))}
                  </div>

                  {/* شريط اختيار عمر الطفل التقريبي */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/60 uppercase tracking-wider">{lang === 'ar' ? 'عمر الطفل المستهدف:' : 'Target Age Group:'}</label>
                    <input 
                      type="range" 
                      min="0" 
                      max="4" 
                      value={ageIndex} 
                      onChange={(e) => setAgeIndex(Number(e.target.value))}
                      className="w-full accent-[#bc13fe] bg-white/10 h-2 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[11px] font-bold text-white/40 px-1">
                      {AGE_OPTIONS.map((age, i) => (
                        <span key={i} className={ageIndex === i ? 'text-[#bc13fe] font-extrabold' : ''}>
                          {lang === 'ar' ? (age === 'Infant' ? 'رضيع' : age === 'Adult' ? 'بالغ' : age.replace('Years', 'سنوات')) : age}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* زر التوليد السحري المدمج */}
                  <button 
                    onClick={handleGenerate} 
                    disabled={!fatherImg || !motherImg} 
                    className="w-full py-5 bg-gradient-to-r from-[#bc13fe] to-[#8a06c2] text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl shadow-[#bc13fe]/20 disabled:opacity-30 disabled:pointer-events-none hover:brightness-110 active:scale-[0.99] transition-all"
                  >
                    {t.generate}
                  </button>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
