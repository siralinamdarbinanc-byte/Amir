import React from 'react';
import { Download, X, Share, PlusSquare, Smartphone, CheckCircle } from 'lucide-react';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PwaInstallModal: React.FC<PwaInstallModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream: unknown }).MSStream;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-sm w-full p-6 relative text-right space-y-4">
        <button
          onClick={onClose}
          className="absolute left-4 top-4 text-zinc-400 hover:text-zinc-100 p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center border border-amber-500/30">
          <Download className="w-6 h-6" />
        </div>

        <div>
          <h3 className="font-bold text-base text-zinc-100">نصب وب اپلیکیشن پیرایش امیر</h3>
          <p className="text-xs text-zinc-400 mt-1">
            با نصب اپلیکیشن می‌توانید بدون نیاز به مرورگر و با سرعت بالا در تمام گوشی‌ها (آیفون و اندروید) نوبت‌های خود را رزرو کنید.
          </p>
        </div>

        {isIOS ? (
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-xs space-y-2.5">
            <span className="font-bold text-amber-400 block mb-1">راهنمای نصب در آیفون (iOS - Safari):</span>
            <div className="flex items-center gap-2 text-zinc-300">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px] shrink-0">۱</span>
              <span>در پایین مرورگر سافاری دکمه اشتراک‌گذاری (<Share className="w-3.5 h-3.5 inline text-amber-400" />) را بزنید.</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-300">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px] shrink-0">۲</span>
              <span>گزینه <strong className="text-zinc-100">Add to Home Screen</strong> (<PlusSquare className="w-3.5 h-3.5 inline text-amber-400" />) را انتخاب کنید.</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-300">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px] shrink-0">۳</span>
              <span>دکمه <strong className="text-zinc-100">Add</strong> در بالای صفحه را لمس کنید.</span>
            </div>
          </div>
        ) : (
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-xs space-y-2.5">
            <span className="font-bold text-amber-400 block mb-1">راهنمای نصب در اندروید (Chrome):</span>
            <div className="flex items-center gap-2 text-zinc-300">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px] shrink-0">۱</span>
              <span>منوی سه نقطه بالا سمت راست مرورگر کروم را باز کنید.</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-300">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px] shrink-0">۲</span>
              <span>گزینه <strong className="text-zinc-100">افزودن به صفحه اصلی (Add to Home Screen)</strong> یا <strong className="text-zinc-100">نصب برنامه</strong> را لمس کنید.</span>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-2.5 rounded-xl text-xs transition-colors"
        >
          متوجه شدم
        </button>
      </div>
    </div>
  );
};
