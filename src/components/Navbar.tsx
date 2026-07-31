import React from 'react';
import { Scissors, Calendar, Clock, ShoppingBag, ShieldCheck, Download, Volume2, VolumeX, Phone, QrCode } from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface NavbarProps {
  activeTab: 'book' | 'my-bookings' | 'services' | 'admin';
  setActiveTab: (tab: 'book' | 'my-bookings' | 'services' | 'admin') => void;
  pendingCount: number;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  onOpenInstallModal: () => void;
  onOpenQrModal: () => void;
  shopPhone: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  pendingCount,
  soundEnabled,
  setSoundEnabled,
  onOpenInstallModal,
  onOpenQrModal,
  shopPhone
}) => {
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundEngine.enabled = next;
    if (next) soundEngine.playBookingChime();
  };

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          {/* Logo & Shop Title */}
          <div 
            onClick={() => setActiveTab('book')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-zinc-950 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-lg text-amber-400 leading-tight">پیرایش امیر</h1>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-full font-medium">VIP</span>
              </div>
              <p className="text-xs text-zinc-400">نوبت‌دهی آنلاین و حرفه‌ای</p>
            </div>
          </div>

          {/* Quick Actions Header Desktop & Mobile */}
          <div className="flex items-center gap-2">
            {/* Call Shop Button */}
            <a
              href={`tel:${shopPhone}`}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-amber-500/40 hover:text-amber-400 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>تماس</span>
            </a>

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              title={soundEnabled ? 'غیرفعال کردن صدای اعلان' : 'فعال کردن صدای اعلان'}
              className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-amber-400 hover:border-zinc-700 transition-colors"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
            </button>

            {/* QR Code Button */}
            <button
              onClick={onOpenQrModal}
              title="بارکد QR و انتشار در گیت‌هاب"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg hover:bg-amber-500/20 transition-colors"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">بارکد QR</span>
            </button>

            {/* PWA Install Button */}
            <button
              onClick={onOpenInstallModal}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 rounded-lg shadow hover:opacity-90 transition-opacity"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">نصب اپ</span>
            </button>
          </div>
        </div>
      </header>

      {/* Desktop Main Navigation Bar */}
      <nav className="hidden md:block bg-zinc-900/70 border-b border-zinc-800/60 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 py-1">
            <button
              onClick={() => setActiveTab('book')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                activeTab === 'book'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>رزرو آنلاین نوبت</span>
            </button>

            <button
              onClick={() => setActiveTab('my-bookings')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                activeTab === 'my-bookings'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>پیگیری نوبت‌های من</span>
            </button>

            <button
              onClick={() => setActiveTab('services')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                activeTab === 'services'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>لیست خدمات و قیمت‌ها</span>
            </button>
          </div>

          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs border transition-colors ${
              activeTab === 'admin'
                ? 'bg-amber-500 text-zinc-950 border-amber-400 font-bold'
                : 'bg-zinc-950 text-amber-400 border-amber-500/30 hover:border-amber-400'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>پنل مدیریت ادمین</span>
            {pendingCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                {pendingCount}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 border-t border-zinc-800 backdrop-blur-lg px-2 py-1.5">
        <div className="grid grid-cols-4 gap-1">
          <button
            onClick={() => setActiveTab('book')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
              activeTab === 'book' ? 'text-amber-400 bg-amber-500/10' : 'text-zinc-400'
            }`}
          >
            <Calendar className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] font-medium">رزرو نوبت</span>
          </button>

          <button
            onClick={() => setActiveTab('my-bookings')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
              activeTab === 'my-bookings' ? 'text-amber-400 bg-amber-500/10' : 'text-zinc-400'
            }`}
          >
            <Clock className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] font-medium">نوبت‌های من</span>
          </button>

          <button
            onClick={() => setActiveTab('services')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
              activeTab === 'services' ? 'text-amber-400 bg-amber-500/10' : 'text-zinc-400'
            }`}
          >
            <ShoppingBag className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] font-medium">خدمات</span>
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`relative flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
              activeTab === 'admin' ? 'text-amber-400 bg-amber-500/10' : 'text-zinc-400'
            }`}
          >
            <ShieldCheck className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] font-medium">مدیریت</span>
            {pendingCount > 0 && (
              <span className="absolute top-1 right-3 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold border border-zinc-950">
                {pendingCount}
              </span>
            )}
          </button>
        </div>
      </nav>
    </>
  );
};
