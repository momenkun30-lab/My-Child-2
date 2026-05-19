import React from 'react';
import { Camera, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { Language, i18n } from '../i18n';

interface FileUploadProps {
  label: string;
  image: string | null;
  lang: Language;
  onUpload: (base64: string) => void;
  onRemove: () => void;
}

export function FileUpload({ label, image, lang, onUpload, onRemove }: FileUploadProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const t = i18n[lang];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 320;
          const MAX_HEIGHT = 320;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // تحويل الصورة إلى JPEG منخفض الحجم لضمان ثبات وسرعة النقل للسيرفر
          const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.3);
          onUpload(resizedDataUrl);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <span className="text-xs font-bold uppercase tracking-widest text-white/50 px-2">{label}</span>
      <div 
        onClick={() => !image && fileInputRef.current?.click()}
        className={`relative aspect-[3/4] rounded-3xl overflow-hidden glass border-2 transition-all duration-500 group
          ${image ? 'border-neon-blue/50' : 'border-white/10 hover:border-neon-blue/30 cursor-pointer'}`}
      >
        <AnimatePresence mode="wait">
          {image ? (
            <motion.div
              key="image"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="w-full h-full"
            >
              <img src={image} alt={label} className="w-full h-full object-cover" />
              <button 
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                className="absolute top-3 right-3 p-2 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-red-500/80 transition-colors z-10"
              >
                <X size={16} />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full h-full flex flex-col items-center justify-center gap-4 text-white/40 group-hover:text-neon-blue transition-colors"
            >
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-neon-blue/30 group-hover:bg-neon-blue/10 transition-all duration-500">
                <Camera size={32} />
              </div>
              <div className="text-center px-4">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-[10px] uppercase tracking-tighter opacity-60">{t.clickToUpload}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />
      </div>
    </div>
  );
}
