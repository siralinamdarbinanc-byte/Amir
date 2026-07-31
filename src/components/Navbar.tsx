import React, { useState, useRef, useEffect } from 'react';
import { Scissors, Calendar, Clock, ShoppingBag, ShieldCheck, Download, Volume2, VolumeX, Phone, QrCode, MoreVertical, ChevronDown, Lock, LogOut } from 'lucide-react';
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
  hideAdminButton?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  pendingCount,
  soundEnabled,
  setSoundEnabled,
  onOpenInstallModal,
  onOpenQrModal,
  shopPhone,
  hideAdminButton = false
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundEngine.enabled = next;
    if (next) soundEngine.playBookingChime();
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/80 px-4 py-2.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          {/* Logo & Shop Title */}
          <div 
            onClick={() => setActiveTab('book')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-zinc-950 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Scissors className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-base text-amber-400 leading-tight">پیرایش امیر</h1>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-1.5 py-0.2 rounded-full font-medium">VIP</span>
              </div>
              <p className="text-[11px] text-zinc-400">سامانه نوبت‌دهی آنلاین</p>
            </div>
          </div>

          {/* Clean Menu & Secondary Action Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-400 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-amber-500/40 transition-all shadow-sm"
            >
              <MoreVertical className="w-4 h-4" />
              <span>امکانات سالن</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Sub-menu Dropdown */}
            {isMenuOpen && (
              <div className="absolute left-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl z-50 py-2 text-right animate-fade-in divide-y divide-zinc-800/60">
                <div className="px-3 py-1.5 text-[11px] font-bold text-zinc-400">
                  ابزارها و میانبرها
                </div>

                <div className="py-1">
                  {/* QR Code */}
                  <button
                    onClick={() => {
                      onOpenQrModal();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-zinc-200 hover:bg-amber-500/10 hover:text-amber-400 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-amber-400" />
                      <span>بارکد QR و لینک گیت‌هاب</span>
                    </span>
                  </button>

                  {/* Install PWA */}
                  <button
                    onClick={() => {
                      onOpenInstallModal();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-zinc-200 hover:bg-amber-500/10 hover:text-amber-400 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Download className="w-4 h-4 text-amber-400" />
                      <span>نصب برنامه روی گوشی</span>
                    </span>
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full">PWA</span>
                  </button>

                  {/* Call Shop */}
                  <a
                    href={`tel:${shopPhone}`}
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-zinc-200 hover:bg-amber-500/10 hover:text-amber-400 transition-colors"
                  >
                    <Phone className="w-4 h-4 text-amber-400" />
                    <span>تماس مستقیم با آرایشگاه ({shopPhone})</span>
                  </a>

                  {/* Sound Toggle */}
                  <button
                    onClick={() => {
                      toggleSound();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-zinc-200 hover:bg-amber-500/10 hover:text-amber-400 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
                      <span>صدای اعلان‌ها</span>
                    </span>
                    <span className={`text-[10px] font-bold ${soundEnabled ? 'text-emerald-400' : 'text-zinc-500'}`}>
                      {soundEnabled ? 'فعال' : 'خاموش'}
                    </span>
                  </button>

                  {/* Dedicated Admin Entrance in Dropdown */}
                  {!hideAdminButton && (
                    <button
                      onClick={() => {
                        setActiveTab('admin');
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-amber-400 bg-amber-500/5 hover:bg-amber-500/15 font-bold transition-colors border-t border-zinc-800/80 mt-1"
                    >
                      <span className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-amber-400" />
                        <span>ورود اختصاصی مدیر سالن</span>
                      </span>
                      {pendingCount > 0 && (
                        <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                          {pendingCount} نوبت جدید
                        </span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ADMIN MODE BANNER (When activeTab === 'admin') */}
      {activeTab === 'admin' ? (
        <div className="bg-gradient-to-r from-amber-600/20 via-zinc-900 to-amber-600/20 border-b border-amber-500/30 px-4 py-2.5">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-amber-300 font-bold">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>شما در بخش مدیریت سالن هستید</span>
              {pendingCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                  {pendingCount} نوبت جدید منتظر تأیید
                </span>
              )}
            </div>

            <button
              onClick={() => setActiveTab('book')}
              className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-amber-500/40 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>خروج از مدیریت (بازگشت به سایت مشتریان)</span>
            </button>
          </div>
        </div>
      ) : (
        /* CUSTOMER MODE NAVIGATION BAR (Desktop) */
        <nav className="hidden md:block bg-zinc-900/70 border-b border-zinc-800/60 px-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5 py-1">
              <button
                onClick={() => setActiveTab('book')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
                  activeTab === 'book'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>رزرو آنلاین نوبت</span>
              </button>

              <button
                onClick={() => setActiveTab('my-bookings')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
                  activeTab === 'my-bookings'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>پیگیری نوبت‌های من</span>
              </button>

              <button
                onClick={() => setActiveTab('services')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
                  activeTab === 'services'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>لیست خدمات و قیمت‌ها</span>
              </button>
            </div>

            {/* Discrete Admin Link for Salon Manager */}
            {!hideAdminButton && (
              <button
                onClick={() => setActiveTab('admin')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-amber-400 hover:bg-zinc-900 rounded-xl transition-colors"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>ورود مدیر سالن</span>
              </button>
            )}
          </div>
        </nav>
      )}

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 border-t border-zinc-800 backdrop-blur-lg px-2 py-1.5">
        {activeTab === 'admin' ? (
          /* Mobile Bar when in Admin mode */
          <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
            <button
              onClick={() => setActiveTab('book')}
              className="flex items-center justify-center gap-1.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 text-xs font-medium"
            >
              <LogOut className="w-4 h-4 text-amber-400" />
              <span>خروج به سایت مشتریان</span>
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className="flex items-center justify-center gap-1.5 py-2 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400 text-xs font-bold"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>پنل مدیریت سالن</span>
            </button>
          </div>
        ) : (
          /* Mobile Bar for Customers (3 clean options) */
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => setActiveTab('book')}
              className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
                activeTab === 'book' ? 'text-amber-400 bg-amber-500/10 font-bold' : 'text-zinc-400'
              }`}
            >
              <Calendar className="w-5 h-5 mb-0.5" />
              <span className="text-[11px] font-medium">رزرو نوبت</span>
            </button>

            <button
              onClick={() => setActiveTab('my-bookings')}
              className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
                activeTab === 'my-bookings' ? 'text-amber-400 bg-amber-500/10 font-bold' : 'text-zinc-400'
              }`}
            >
              <Clock className="w-5 h-5 mb-0.5" />
              <span className="text-[11px] font-medium">نوبت‌های من</span>
            </button>

            <button
              onClick={() => setActiveTab('services')}
              className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
                activeTab === 'services' ? 'text-amber-400 bg-amber-500/10 font-bold' : 'text-zinc-400'
              }`}
            >
              <ShoppingBag className="w-5 h-5 mb-0.5" />
              <span className="text-[11px] font-medium">خدمات</span>
            </button>
          </div>
        )}
      </nav>
    </>
  );
};
