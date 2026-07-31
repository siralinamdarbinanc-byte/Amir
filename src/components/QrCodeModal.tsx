import React, { useState } from 'react';
import { QrCode, X, Download, ExternalLink, Copy, Check, Github, Smartphone, Sparkles, Printer } from 'lucide-react';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({ isOpen, onClose }) => {
  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://amir-barber.github.io';
  const [targetUrl, setTargetUrl] = useState<string>(currentUrl);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  // Generate QR Code URL using free reliable QR Server API
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(targetUrl)}&margin=10&color=000000&bgcolor=ffffff`;

  const handleCopy = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadQr = async () => {
    try {
      const response = await fetch(qrCodeImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'amir-barber-qrcode.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(qrCodeImageUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl overflow-y-auto max-h-[90vh] space-y-5 text-right font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-100">کد QR و راهنمای انتشار در GitHub</h3>
              <p className="text-xs text-zinc-400">بارکد اختصاصی جهت چاپ و نصب روی گوشی مشتریان</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Code Card */}
        <div className="bg-zinc-950 border border-amber-500/20 rounded-2xl p-5 text-center flex flex-col items-center gap-4">
          <div className="bg-white p-3 rounded-2xl shadow-xl border-4 border-amber-400/80">
            <img 
              src={qrCodeImageUrl} 
              alt="QR Code" 
              className="w-48 h-48 object-contain rounded-lg"
            />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-400 flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>پیرایش امیر — رزرو آنلاین نوبت</span>
            </span>
            <p className="text-[11px] text-zinc-400">
              مشتریان با اسکن این بارکد توسط دوربین گوشی، وارد سامانه شده و اپلیکیشن را روی صفحه اصلی نصب می‌کنند.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2 w-full pt-1">
            <button
              onClick={handleDownloadQr}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs transition-colors shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>دانلود عکس بارکد جهت چاپ</span>
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs transition-colors border border-zinc-700"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'کپی شد' : 'کپی لینک'}</span>
            </button>
          </div>
        </div>

        {/* Link Customizer */}
        <div className="space-y-1.5 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
          <label className="block text-xs font-medium text-zinc-300">آدرس لینک قرار گرفته در بارکد QR:</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-zinc-100 font-mono dir-ltr"
              placeholder="https://yourusername.github.io/barber"
            />
          </div>
        </div>

        {/* GitHub Deployment Instructions */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3">
          <h4 className="font-bold text-xs text-amber-400 flex items-center gap-2">
            <Github className="w-4 h-4 text-white" />
            <span>نحوه انتشار (Deploy) پروژه روی GitHub Pages (رایگان)</span>
          </h4>

          <ol className="text-xs text-zinc-300 space-y-2 list-decimal list-inside leading-relaxed">
            <li>
              از منوی بالا سمت راست محیط AI Studio گزینه <strong>Export Code / Download ZIP</strong> را بزنید تا کدهای پروژه دانلود شوند.
            </li>
            <li>
              یک مخزن جدید (Repository) در <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline dir-ltr inline-block">GitHub.com</a> بسازید و فایل‌های پروژه را آپلود (Push) کنید.
            </li>
            <li>
              در تنظیمات گیت‌هاب بخش <strong>Pages</strong>، شاخه اصلی را روی <code>main</code> تنظیم کنید تا لینک رایگان <code>https://username.github.io/...</code> ساخته شود.
            </li>
            <li>
              لینک گیت‌هاب را در کادر بالا وارد کرده و دکمه <strong>دانلود عکس بارکد</strong> را بزنید تا روی کاغذ چاپ کرده و در آرایشگاه نصب کنید!
            </li>
          </ol>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
          <span className="flex items-center gap-1">
            <Smartphone className="w-3.5 h-3.5 text-amber-400" />
            <span>سازگار با iOS Safari و Android Chrome</span>
          </span>
          <button 
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg"
          >
            بستن
          </button>
        </div>

      </div>
    </div>
  );
};
