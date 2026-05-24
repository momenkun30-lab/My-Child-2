import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, 
  Users, 
  ImageIcon, 
  Dna,
  Activity, 
  Trash2, 
  Bell, 
  Settings as SettingsIcon,
  LogOut,
  MessageSquare,
  Ban,
  Globe,
  Megaphone,
  Database as DatabaseIcon
} from 'lucide-react';

// تصحيح المسار بنقطة واحدة لقراءة الملف من نفس المجلد لحل مشكلة الـ Build في Render
import { Language, i18n } from './i18n';
import { LanguageSwitcher } from './LanguageSwitcher';

interface AdminPanelProps {
  onLogout: () => void;
  lang: Language;
  onLanguageToggle: () => void;
}

export function AdminPanel({ onLogout, lang, onLanguageToggle }: AdminPanelProps) {
  const t = i18n[lang];
  const [activeTab, setActiveTab] = React.useState('dashboard');
  
  // State for Settings
  const [siteSettings, setSiteSettings] = React.useState({
    name: '',
    logo: '',
    primaryColor: '#bc13fe',
    defaultLang: 'ar'
  });

  // State for Broadcast
  const [broadcastMsg, setBroadcastMsg] = React.useState('');
  const [generalMessages, setGeneralMessages] = React.useState<any[]>([]);
  const [newMessageText, setNewMessageText] = React.useState('');

  // Real stats from server
  const [realStats, setRealStats] = React.useState({ visitors: 0, images: 0, users: 0, activeNow: 1 });

  const [adSettings, setAdSettings] = React.useState({
    imageUrl: '',
    startHour: 0,
    startMinute: 0,
    endHour: 23,
    endMinute: 59,
    expiryDate: '',
    isActive: false
  });

  React.useEffect(() => {
    // Fetch stats
    const fetchStats = () => {
      fetch('/api/stats')
        .then(res => res.json())
        .then(data => setRealStats(data))
        .catch(() => {});
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Update every 5s for admin

    // Fetch config
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        setSiteSettings({
          name: data.siteName || '',
          logo: data.siteLogo || '',
          primaryColor: data.primaryColor || '#bc13fe',
          defaultLang: data.defaultLang || 'ar'
        });
        setBroadcastMsg(data.broadcastMessage || '');
      })
      .catch(() => {});

    // Fetch ad
    fetch('/api/ad')
      .then(res => res.json())
      .then(data => {
        if (data) {
          setAdSettings({
            imageUrl: data.imageUrl || '',
            startHour: data.startHour ?? 0,
            startMinute: data.startMinute ?? 0,
            endHour: data.endHour ?? 23,
            endMinute: data.endMinute ?? 59,
            expiryDate: data.expiryDate ? new Date(data.expiryDate).toISOString().split('T')[0] : '',
            isActive: data.isActive || false
          });
        }
      })
      .catch(() => {});

    // Fetch general messages
    fetch('/api/messages')
      .then(res => res.json())
      .then(data => setGeneralMessages(data))
      .catch(() => {});

    return () => clearInterval(interval);
  }, []);

  // Mock data for Users
  const [users, setUsers] = React.useState([
    { id: '1', name: lang === 'ar' ? 'أحمد محمد' : 'Ahmed Mohamed', email: 'ahmed@example.com', joined: '2024-05-10 14:20', status: 'active' },
    { id: '2', name: lang === 'ar' ? 'سارة خالد' : 'Sara Khaled', email: 'sara@example.com', joined: '2024-05-11 09:15', status: 'active' },
  ]);

  const statsProps = [
    { label: t.totalUsers, value: realStats.users.toLocaleString(), icon: Users, color: 'text-blue-400' },
    { label: t.dailyVisits, value: realStats.visitors.toLocaleString(), icon: Activity, color: 'text-green-400' },
    { label: t.imagesCreated, value: realStats.images.toLocaleString(), icon: ImageIcon, color: 'text-purple-400' },
    { label: t.onlineNow, value: realStats.activeNow.toLocaleString(), icon: Activity, color: 'text-neon-blue' },
    { label: lang === 'ar' ? 'حالة القاعدة' : 'DB Status', value: (realStats as any).dbStatus === 'online' ? (lang === 'ar' ? 'متصل' : 'Online') : (lang === 'ar' ? 'منفصل' : 'Offline'), icon: DatabaseIcon, color: (realStats as any).dbStatus === 'online' ? 'text-green-400' : 'text-red-400' }
  ];

  const handleSaveSettings = async () => {
    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteName: siteSettings.name,
          siteLogo: siteSettings.logo,
          primaryColor: siteSettings.primaryColor,
          defaultLang: siteSettings.defaultLang
        })
      });
      alert(lang === 'ar' ? 'تم حفظ الإعدادات بنجاح!' : 'Settings saved successfully!');
      window.location.reload(); 
    } catch (err) {
      alert(lang === 'ar' ? 'فشل حفظ الإعدادات' : 'Failed to save settings');
    }
  };

  const handleBroadcast = async () => {
    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          broadcastMessage: broadcastMsg
        })
      });
      alert(lang === 'ar' ? 'تم إرسال الرسالة لجميع المستخدمين!' : 'Broadcast message sent!');
    } catch (err) {
      alert(lang === 'ar' ? 'فشل إرسال الرسالة' : 'Failed to send broadcast');
    }
  };

  const [isSavingAd, setIsSavingAd] = React.useState(false);
  const handleSaveAd = async () => {
    setIsSavingAd(true);
    try {
      // إرسال البيانات مع ضمان تحويل الأوقات إلى أرقام دقيقة لحل مشكلة النوع في السيرفر
      const payload = {
        ...adSettings,
        startHour: Number(adSettings.startHour),
        startMinute: Number(adSettings.startMinute),
        endHour: Number(adSettings.endHour),
        endMinute: Number(adSettings.endMinute)
      };

      const res = await fetch('/api/ad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to save');
      alert(lang === 'ar' ? 'تم حفظ الإعلان بنجاح!' : 'Ad saved successfully!');
    } catch (err) {
      console.error(err);
      alert(lang === 'ar' ? 'فشل حفظ الإعلان - قد يكون الحجم كبيراً جداً' : 'Failed to save ad - image might be too large');
    } finally {
      setIsSavingAd(false);
    }
  };

  const handleAdImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAdSettings({ ...adSettings, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteAd = async () => {
    try {
      await fetch('/api/ad', { method: 'DELETE' });
      setAdSettings({ imageUrl: '', startHour: 0, startMinute: 0, endHour: 23, endMinute: 59, expiryDate: '', isActive: false });
      alert(lang === 'ar' ? 'تم حذف الإعلان!' : 'Ad deleted!');
    } catch (err) {
      alert(lang === 'ar' ? 'فشل حذف الإعلان' : 'Failed to delete ad');
    }
  };

  const handleSendGeneralMessage = async () => {
    if (!newMessageText.trim()) return;
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newMessageText })
      });
      const data = await res.json();
      setGeneralMessages([data, ...generalMessages]);
      setNewMessageText('');
      alert(lang === 'ar' ? 'تم إرسال الرسالة!' : 'Message sent!');
    } catch (err) {
      alert(lang === 'ar' ? 'فشل إرسال الرسالة' : 'Failed to send message');
    }
  };

  const handleDeleteAllMessages = async () => {
    if (!confirm(lang === 'ar' ? 'هل أنت متأكد من حذف جميع الرسائل؟' : 'Are you sure you want to delete all messages?')) return;
    try {
      await fetch('/api/messages', { method: 'DELETE' });
      setGeneralMessages([]);
      alert(lang === 'ar' ? 'تم حذف جميع الرسائل!' : 'All messages deleted!');
    } catch (err) {
      alert(lang === 'ar' ? 'فشل حذف الرسائل' : 'Failed to delete messages');
    }
  };

  return (
    <div className={`min-h-screen bg-[#050505] text-slate-100 flex flex-col lg:flex-row ${lang === 'ar' ? 'rtl' : 'ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Sidebar */}
      <aside className={`w-full lg:w-72 glass ${lang === 'ar' ? 'border-l' : 'border-r'} border-white/5 p-6 flex flex-col gap-8 shrink-0`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neon-blue/10 flex items-center justify-center border border-neon-blue/20 shadow-lg shadow-neon-blue/5">
            <Dna size={20} className="text-neon-blue" />
          </div>
          <div>
            <h2 className="font-display font-bold tracking-tight">{t.adminPanel}</h2>
            <p className="text-[10px] uppercase font-bold text-white/40 tracking-widest">{t.proSystem}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { id: 'dashboard', label: t.dashboard, icon: BarChart3 },
            { id: 'users', label: t.userMgmt, icon: Users },
            { id: 'images', label: t.imageMgmt, icon: ImageIcon },
            { id: 'ads', label: lang === 'ar' ? 'الإعلانات' : 'Advertisements', icon: Megaphone },
            { id: 'messages', label: t.broadcast, icon: MessageSquare },
            { id: 'settings', label: t.siteSettings, icon: SettingsIcon }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                activeTab === item.id ? 'glass bg-white/5 border-white/10 text-neon-blue' : 'text-white/60 hover:bg-white/5'
              }`}
            >
              <item.icon size={18} className={activeTab === item.id ? 'text-neon-blue' : 'group-hover:text-white'} />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto space-y-4">
          <div className="flex justify-center">
            <LanguageSwitcher current={lang} onToggle={onLanguageToggle} />
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">{t.logout}</span>
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: lang === 'ar' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: lang === 'ar' ? 20 : -20 }}
            className="max-w-6xl mx-auto space-y-10"
          >
            {/* Header */}
            <div>
              <h1 className="text-3xl font-display font-bold tracking-tight text-white mb-2 italic">
                {activeTab === 'dashboard' && t.dashboard}
                {activeTab === 'users' && t.userMgmt}
                {activeTab === 'images' && t.imageMgmt}
                {activeTab === 'ads' && (lang === 'ar' ? 'إدارة الإعلانات' : 'Ads Management')}
                {activeTab === 'messages' && t.broadcast}
                {activeTab === 'settings' && t.siteSettings}
              </h1>
              <p className="text-white/40 text-sm">{lang === 'ar' ? 'إدارة ومراقبة معايير النظام في الوقت الفعلي.' : 'Manage and monitor system parameters in real-time.'}</p>
            </div>

            {/* dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div className="space-y-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                  {statsProps.map((stat, i) => (
                    <div key={i} className="glass p-6 rounded-3xl border-white/10 relative overflow-hidden group">
                      <div className={`absolute top-0 ${lang === 'ar' ? 'left-0' : 'right-0'} w-24 h-24 ${lang === 'ar' ? '-ml-8' : '-mr-8'} -mt-8 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity bg-current ${stat.color}`} />
                      <div className={`p-3 rounded-xl bg-white/5 border border-white/10 w-fit mb-4 ${stat.color}`}>
                        <stat.icon size={20} />
                      </div>
                      <div className="text-2xl font-bold tracking-tight mb-1">{stat.value}</div>
                      <div className="text-xs font-bold text-white/40 uppercase tracking-widest">{stat.label}</div>
                    </div>
                  ))}
                </div>
                
                <div className="glass p-8 rounded-3xl border-white/10">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Activity size={20} className="text-neon-blue" />
                    {t.systemActivity}
                  </h3>
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs">
                            {i}
                          </div>
                          <div>
                            <p className="text-sm">{t.newImgKSA}</p>
                            <p className="text-[10px] text-white/40">{i * 2} {t.minutesAgo}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-neon-blue px-2 py-1 bg-neon-blue/5 rounded">{t.success}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* users Tab */}
            {activeTab === 'users' && (
              <div className="glass rounded-3xl border-white/10 overflow-hidden">
                <table className={`w-full ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-white/40">{t.users}</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-white/40">{lang === 'ar' ? 'وقت الانضمام' : 'Join Date'}</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-white/40">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                      <th className={`px-6 py-4 text-xs font-bold uppercase text-white/40 ${lang === 'ar' ? 'text-left' : 'text-right'}`}>{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.map(user => (
                      <tr key={user.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-neon-blue/10 flex items-center justify-center text-neon-blue font-bold">
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-bold">{user.name}</p>
                              <p className="text-xs text-white/40">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-white/60">{user.joined}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                            user.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {user.status === 'active' ? t.active : t.blocked}
                          </span>
                        </td>
                        <td className={`px-6 py-4 ${lang === 'ar' ? 'text-left' : 'text-right'}`}>
                          <div className={`flex items-center gap-2 ${lang === 'ar' ? 'justify-start' : 'justify-end'}`}>
                            <button className="p-2 hover:bg-red-500/10 text-white/40 hover:text-red-400 rounded-lg transition-colors"><Ban size={18} /></button>
                            <button className="p-2 hover:bg-red-500/10 text-white/40 hover:text-red-400 rounded-lg transition-colors"><Trash2 size={18} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* images Tab */}
            {activeTab === 'images' && (
              <div className="glass p-8 rounded-3xl border-white/10 space-y-4">
                <div className="flex items-center gap-2 text-purple-400 mb-2">
                  <ImageIcon size={20} />
                  <h3 className="font-bold text-sm uppercase tracking-widest">{lang === 'ar' ? 'معرض الصور المولدة' : 'Generated Images Gallery'}</h3>
                </div>
                <p className="text-sm text-white/60">{lang === 'ar' ? 'نظام الحذف التلقائي نشط؛ الصور تُحذف فوراً بعد المعالجة للحفاظ على الخصوصية.' : 'Automated purge system active; images are deleted immediately after processing for privacy.'}</p>
                <div className="border border-white/5 bg-white/5 p-6 rounded-2xl text-center text-xs font-medium text-white/40 tracking-wider">
                  {lang === 'ar' ? 'لا توجد صور مخزنة حالياً في السيرفر' : 'No images currently retained on server'}
                </div>
              </div>
            )}

            {/* ads Tab */}
            {activeTab === 'ads' && (
              <div className="glass p-8 rounded-3xl border-white/10 space-y-6">
                 <div className="flex items-center gap-2 text-neon-purple mb-2">
                   <Megaphone size={20} />
                   <h3 className="font-bold text-sm uppercase tracking-widest">{lang === 'ar' ? 'إدارة الإعلانات الترويجية' : 'Ads Management'}</h3>
                 </div>
                 <p className="text-sm text-white/60">{lang === 'ar' ? 'رفع وتعديل بنر الإعلانات المجدولة ونطاق ظهورها للمستخدمين.' : 'Upload banner images and schedule active windows for user visibility.'}</p>
                 <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border border-white/5 bg-white/5 p-4 rounded-xl">
                   <input type="file" onChange={handleAdImageUpload} accept="image/*" className="text-xs text-white/60 file:bg-white/10 file:text-white file:border-0 file:p-2 file:px-4 file:rounded-lg file:mr-2 cursor-pointer" />
                   {adSettings.imageUrl && (
                     <div className="relative group">
                       <img src={adSettings.imageUrl} className="w-48 h-20 object-cover rounded-lg border border-white/10" alt="Ad Preview" />
                       <button onClick={handleDeleteAd} className="absolute -top-2 -right-2 p-1.5 bg-red-600 rounded-full text-white hover:bg-red-700 transition-colors"><Trash2 size={12} /></button>
                     </div>
                   )}
                 </div>
                 <button 
                   onClick={handleSaveAd} 
                   disabled={isSavingAd}
                   className="neon-button-purple px-8 py-3 rounded-xl text-xs uppercase font-bold text-white tracking-widest disabled:opacity-50"
                 >
                   {isSavingAd ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (lang === 'ar' ? 'حفظ التغييرات' : 'Save Ad')}
                 </button>
              </div>
            )}
            
            {/* messages Tab */}
            {activeTab === 'messages' && (
              <div className="space-y-10">
                <div className="glass p-8 rounded-3xl border-white/10 space-y-6">
                  <h3 className="font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                    <Megaphone size={18} className="text-neon-purple" />
                    {lang === 'ar' ? 'شريط الإعلانات العلوي المستمر' : 'Top Broadcast Bar'}
                  </h3>
                  <textarea 
                    value={broadcastMsg}
                    onChange={(e) => setBroadcastMsg(e.target.value)}
                    placeholder={t.broadcastPlaceholder}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-neon-purple/50 h-24 resize-none"
                  />
                  <div className="flex gap-4">
                    <button onClick={handleBroadcast} className="neon-button-purple px-8 py-3 rounded-xl text-sm font-bold uppercase tracking-widest">{t.sendBroadcast}</button>
                    <button onClick={async () => { 
                      setBroadcastMsg(''); 
                      try {
                        await fetch('/api/config', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ broadcastMessage: '' })
                        });
                        alert(lang === 'ar' ? 'تم سحب الرسالة بنجاح' : 'Broadcast withdrawn');
                      } catch (err) {
                        console.error('Failed to withdraw broadcast:', err);
                      }
                    }} className="px-8 py-3 glass rounded-xl text-sm font-bold uppercase tracking-widest text-white/40">{t.withdrawBroadcast}</button>
                  </div>
                </div>

                <div className="glass p-8 rounded-3xl border-white/10 space-y-6">
                  <h3 className="font-bold uppercase tracking-widest text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare size={18} className="text-neon-blue" />
                      {lang === 'ar' ? 'الرسائل العامة (المتحركة)' : 'General Messages (Scrolling)'}
                    </div>
                    {generalMessages.length > 0 && (
                      <button onClick={handleDeleteAllMessages} className="text-red-400 hover:text-red-500 text-xs flex items-center gap-1 font-medium transition-colors">
                        <Trash2 size={14} /> {lang === 'ar' ? 'حذف الكل' : 'Delete All'}
                      </button>
                    )}
                  </h3>
                  <div className="flex gap-3">
                    <input 
                      type="text"
                      value={newMessageText}
                      onChange={(e) => setNewMessageText(e.target.value)}
                      placeholder={lang === 'ar' ? 'اكتب رسالة جديدة لتظهر في الشريط السفلي...' : 'Type a new scrolling message...'}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-neon-blue/50"
                    />
                    <button 
                      onClick={handleSendGeneralMessage}
                      className="px-8 py-4 bg-neon-blue text-black font-bold rounded-xl text-sm uppercase tracking-widest hover:scale-105 transition-transform"
                    >
                      {lang === 'ar' ? 'إضافة' : 'Add'}
                    </button>
                  </div>
                  
                  {generalMessages.length > 0 && (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2 border border-white/5 bg-black/20 p-4 rounded-xl">
                      {generalMessages.map((msg: any) => (
                        <div key={msg._id || msg.id} className="flex items-center justify-between text-xs py-2 border-b border-white/5 last:border-0">
                          <span className="text-white/80">{msg.text}</span>
                          <span className="text-white/40">{new Date(msg.createdAt || Date.now()).toLocaleDateString(lang)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* settings Tab */}
            {activeTab === 'settings' && (
              <div className="glass p-8 rounded-3xl border-white/10 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                      <Globe size={18} className="text-neon-blue" />
                      <h3 className="font-bold uppercase tracking-widest text-xs">{lang === 'ar' ? 'الإعدادات الأساسية للهوية' : 'General Settings'}</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-white/40 uppercase px-1">{lang === 'ar' ? 'اسم الموقع الإلكتروني' : 'Site Name'}</label>
                        <input 
                          type="text" 
                          value={siteSettings.name}
                          onChange={(e) => setSiteSettings(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-neon-blue/50" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-white/40 uppercase px-1">{lang === 'ar' ? 'اللغة الافتراضية للمنصة' : 'Default Language'}</label>
                        <select 
                          value={siteSettings.defaultLang}
                          onChange={(e) => setSiteSettings(prev => ({ ...prev, defaultLang: e.target.value }))}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-neon-blue/50 appearance-none text-slate-200"
                        >
                          <option value="ar" className="bg-[#050505]">العربية</option>
                          <option value="en" className="bg-[#050505]">English</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={handleSaveSettings}
                  className="neon-button-purple px-12 py-4 rounded-2xl text-sm font-bold uppercase tracking-[0.2em] w-full sm:w-auto"
                >
                  {t.saveSettings}
                </button>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
