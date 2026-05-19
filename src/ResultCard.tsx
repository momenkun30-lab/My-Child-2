import React from 'react';
import { 
  Download, 
  Share2, 
  RefreshCw, 
  Baby, 
  Calendar, 
  User
} from 'lucide-react';
import { motion } from 'motion/react';
import { Language, i18n } from '../i18n';

interface ResultCardProps {
  image: string;
  fatherImage: string;
  motherImage: string;
  gender: string;
  age: string;
  lang: Language;
  onReset: () => void;
}

export function ResultCard({ image, fatherImage, motherImage, gender, age, lang, onReset }: ResultCardProps) {
  const downloadImage = () => {
    const link = document.createElement('a');
    link.href = image;
    link.download = `my-child-${gender}-${age}.png`;
    link.click();
  };

  const shareResult = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: i18n[lang].title,
          text: `${i18n[lang].subtitle} - ${age} ${gender === 'boy' ? i18n[lang].boy : i18n[lang].girl}`,
          url: window.location.href
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed', err);
          copyToClipboard();
        }
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    alert(i18n[lang].linkCopied);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-4xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8 relative"
    >
      <div className="absolute -inset-4 bg-gradient-to-br from-neon-blue/10 via-transparent to-neon-purple/10 blur-3xl -z-10" />
      
      {/* Visual Side */}
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="relative glass p-1.5 rounded-3xl border-white/10 overflow-hidden">
            <img src={fatherImage} alt="Father" className="w-full aspect-square object-cover rounded-2xl opacity-80" />
            <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[8px] font-bold text-neon-blue uppercase tracking-widest">
              {i18n[lang].fatherSide}
            </div>
          </div>
          <div className="relative glass p-1.5 rounded-3xl border-white/10 overflow-hidden">
            <img src={motherImage} alt="Mother" className="w-full aspect-square object-cover rounded-2xl opacity-80" />
            <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[8px] font-bold text-neon-purple uppercase tracking-widest">
              {i18n[lang].motherSide}
            </div>
          </div>
        </div>

        <div className="relative group">
          <div className="relative glass p-2 rounded-[2.5rem] border-white/20">
            <img src={image} alt="Generated Child" className="w-full aspect-square object-cover rounded-[2rem] shadow-2xl" />
          </div>
        </div>
      </div>

      {/* Data Side */}
      <div className="flex flex-col gap-6">
        <div className="glass p-8 rounded-[2rem] border-white/10 space-y-8">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-display font-bold italic">{i18n[lang].resultTitle}</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="glass bg-white/5 p-4 rounded-2xl border-white/5 text-sm font-bold">
              {gender === 'boy' ? i18n[lang].boy : i18n[lang].girl}
            </div>
            <div className="glass bg-white/5 p-4 rounded-2xl border-white/5 text-sm font-bold">
              {age}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <button onClick={downloadImage} className="flex items-center justify-center gap-2 px-6 py-4 glass hover:bg-white/10 rounded-2xl text-xs font-bold uppercase tracking-widest text-white shadow-xl">
              <Download size={16} /> {i18n[lang].download}
            </button>
            <button onClick={shareResult} className="flex items-center justify-center gap-2 px-6 py-4 glass hover:bg-white/10 rounded-2xl text-xs font-bold uppercase tracking-widest text-white shadow-xl">
              <Share2 size={16} /> {i18n[lang].share}
            </button>
          </div>
        </div>

        <button onClick={onReset} className="w-full neon-button-purple p-6 rounded-[2rem] flex items-center justify-center gap-3 group">
          <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-700" />
          <span className="font-bold uppercase tracking-widest">{i18n[lang].createNew}</span>
        </button>
      </div>
    </motion.div>
  );
}
