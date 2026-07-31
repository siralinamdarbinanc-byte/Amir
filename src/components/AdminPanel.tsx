import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Lock, CheckCircle2, XCircle, Clock, Calendar, 
  DollarSign, RefreshCw, Volume2, VolumeX, Plus, Trash2, Edit2, 
  Settings, Download, FileSpreadsheet, ExternalLink, Eye, EyeOff, AlertTriangle, 
  Sparkles, Phone, User, Check, Search, Share2, HelpCircle 
} from 'lucide-react';
import { Appointment, BarberService, ShopSettings } from '../types';
import { formatPrice, toPersianDigits } from '../utils/jalali';
import { soundEngine } from '../utils/audio';

interface AdminPanelProps {
  appointments: Appointment[];
  services: BarberService[];
  settings: ShopSettings;
  onUpdateStatus: (id: string, status: Appointment['status'], reason?: string) => void;
  onRefresh: () => void;
  onSaveService: (service: Partial<BarberService>) => void;
  onDeleteService: (id: string) => void;
  onSaveSettings: (settings: Partial<ShopSettings>) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  appointments,
  services,
  settings,
  onUpdateStatus,
  onRefresh,
  onSaveService,
  onDeleteService,
  onSaveSettings
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>('');

  const [adminTab, setAdminTab] = useState<'appointments' | 'services' | 'settings' | 'export'>('appointments');
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Rejection modal
  const [rejectingAppId, setRejectingAppId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('تکمیل ظرفیت ساعت درخواستی');

  // Service Edit modal
  const [editingService, setEditingService] = useState<Partial<BarberService> | null>(null);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<ShopSettings>(settings);

  useEffect(() => {
    setSettingsForm(settings);
  }, [settings]);

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (pinInput === (settings.adminPin || '1234')) {
      setIsAuthenticated(true);
      soundEngine.playBookingChime();
    } else {
      setLoginError('رمز عبور (پین کد) اشتباه است. (پین پیش‌فرض: ۱۲۳۴)');
      soundEngine.playRejectTone();
    }
  };

  // Filter appointments
  const pendingApps = appointments.filter(a => a.status === 'pending');
  const todayApps = appointments.filter(a => a.status === 'approved');

  const filteredAppointments = appointments.filter(a => {
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      return (
        a.customerName.toLowerCase().includes(q) ||
        a.customerPhone.includes(q) ||
        a.trackingCode.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Calculate statistics
  const totalApprovedPrice = appointments
    .filter(a => a.status === 'approved' || a.status === 'completed')
    .reduce((sum, a) => sum + a.price, 0);

  // Approve action with chime
  const handleApprove = (id: string) => {
    soundEngine.playApprovalSound();
    onUpdateStatus(id, 'approved');
  };

  // Reject action
  const handleConfirmReject = () => {
    if (rejectingAppId) {
      soundEngine.playRejectTone();
      onUpdateStatus(rejectingAppId, 'rejected', rejectReason);
      setRejectingAppId(null);
    }
  };

  // Export CSV download
  const downloadCSV = () => {
    window.open('/api/export/csv', '_blank');
  };

  // LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-10 px-4">
        <div className="bg-zinc-900/95 border border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden">
          <div className="w-14 h-14 bg-amber-500/20 text-amber-400 rounded-2xl mx-auto flex items-center justify-center mb-4 border border-amber-500/30">
            <Lock className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-bold text-amber-400 mb-1">ورود به پنل مدیریت پیرایش امیر</h2>
          <p className="text-xs text-zinc-400 mb-6">برای مدیریت نوبت‌ها، تغییر قیمت‌ها و تنظیمات وارد شوید.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-2 text-right">
                کد پین مدیریت (پیش‌فرض: <span className="text-amber-400 font-mono font-bold">1234</span>)
              </label>

              <div className="relative">
                <input
                  type={showPin ? "text" : "password"}
                  required
                  placeholder="۱۲۳۴"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-center text-lg font-bold tracking-widest text-amber-400 focus:outline-none focus:border-amber-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute left-3 top-3.5 text-zinc-500 hover:text-zinc-300"
                >
                  {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {loginError && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 p-2.5 rounded-xl">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-3 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>ورود به پنل ادمین</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // MAIN ADMIN DASHBOARD
  return (
    <div className="max-w-5xl mx-auto py-4 px-3 sm:px-4 space-y-6">
      {/* Top Admin Header Bar */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-amber-400">پنل مدیریت پیرایش امیر</h2>
            <span className="flex items-center gap-1 text-[11px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              همگام‌سازی زنده فعال
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">مدیریت لحظه‌ای رزروها، خدمات، قیمت‌ها و خروجی گوگل شیت</p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 text-xs text-zinc-300 bg-zinc-950 border border-zinc-800 hover:border-amber-500/40 px-3 py-2 rounded-xl transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>بروزرسانی داده‌ها</span>
          </button>

          <button
            onClick={() => setIsAuthenticated(false)}
            className="text-xs text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 px-3 py-2 rounded-xl transition-colors"
          >
            خروج از ادمین
          </button>
        </div>
      </div>

      {/* KPI Stats Widgets */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-zinc-900/90 border border-amber-500/30 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-400">در انتظار تأیید</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-2xl font-black text-amber-400">{toPersianDigits(pendingApps.length)}</span>
          <span className="text-[10px] text-amber-300/80 block mt-1">نیازمند اقدام فوری</span>
        </div>

        <div className="bg-zinc-900/90 border border-emerald-500/30 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-400">تأیید شده</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-black text-emerald-400">{toPersianDigits(todayApps.length)}</span>
          <span className="text-[10px] text-emerald-300/80 block mt-1">امروز / آماده ارائه</span>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-400">مجموع نوبت‌ها</span>
            <Calendar className="w-4 h-4 text-zinc-400" />
          </div>
          <span className="text-2xl font-black text-zinc-200">{toPersianDigits(appointments.length)}</span>
          <span className="text-[10px] text-zinc-400 block mt-1">کل رزروهای ثبت‌شده</span>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-400">کارکرد کل مالی</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-base sm:text-lg font-black text-emerald-400 truncate block">
            {formatPrice(totalApprovedPrice)}
          </span>
          <span className="text-[10px] text-zinc-500 block mt-1">مجموع فاکتورهای تأییدشده</span>
        </div>
      </div>

      {/* Admin Navigation Sub-Tabs */}
      <div className="flex border-b border-zinc-800 gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setAdminTab('appointments')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            adminTab === 'appointments'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>مدیریت رزروها</span>
          {pendingApps.length > 0 && (
            <span className="bg-amber-500 text-zinc-950 text-[10px] px-1.5 py-0.2 rounded-full font-black">
              {pendingApps.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setAdminTab('services')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            adminTab === 'services'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Edit2 className="w-4 h-4" />
          <span>خدمات و قیمت‌ها</span>
        </button>

        <button
          onClick={() => setAdminTab('settings')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            adminTab === 'settings'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>ساعات کاری و سالن</span>
        </button>

        <button
          onClick={() => setAdminTab('export')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            adminTab === 'export'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>اتصال به گوگل شیت و GitHub</span>
        </button>
      </div>

      {/* TAB 1: APPOINTMENTS MANAGEMENT */}
      {adminTab === 'appointments' && (
        <div className="space-y-4">
          {/* Controls & Search */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800">
            {/* Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <button
                onClick={() => setFilterStatus('pending')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  filterStatus === 'pending'
                    ? 'bg-amber-500 text-zinc-950'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                در انتظار تأیید ({pendingApps.length})
              </button>

              <button
                onClick={() => setFilterStatus('approved')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  filterStatus === 'approved'
                    ? 'bg-emerald-500 text-zinc-950'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                تأیید شده ({appointments.filter(a => a.status === 'approved').length})
              </button>

              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  filterStatus === 'all'
                    ? 'bg-zinc-100 text-zinc-950'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                همه رزروها ({appointments.length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="جستجوی نام یا تلفن..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500 pr-8"
              />
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute right-2.5 top-2.5" />
            </div>
          </div>

          {/* Appointments List Grid */}
          <div className="space-y-3">
            {filteredAppointments.length === 0 ? (
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-500 text-xs">
                هیچ نوبتی با این فیلتر وجود ندارد.
              </div>
            ) : (
              filteredAppointments.map((app) => (
                <div
                  key={app.id}
                  className={`bg-zinc-900/90 border rounded-2xl p-4 sm:p-5 transition-all ${
                    app.status === 'pending'
                      ? 'border-amber-500/50 bg-amber-500/5'
                      : 'border-zinc-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-zinc-100">{app.customerName}</span>
                        <a
                          href={`tel:${app.customerPhone}`}
                          className="text-xs text-amber-400 bg-zinc-950 border border-zinc-800 px-2 py-0.5 rounded flex items-center gap-1 dir-ltr hover:border-amber-500/40"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{app.customerPhone}</span>
                        </a>
                      </div>
                      <span className="text-[11px] text-zinc-400 mt-1 block">
                        کد: <strong className="text-zinc-200 dir-ltr">{app.trackingCode}</strong> | خدمت: <strong className="text-amber-300">{app.serviceName}</strong>
                      </span>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {app.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(app.id)}
                            className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-4 py-2 rounded-xl text-xs transition-colors flex items-center gap-1 shadow"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>تأیید نوبت</span>
                          </button>

                          <button
                            onClick={() => setRejectingAppId(app.id)}
                            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 font-bold px-3 py-2 rounded-xl text-xs transition-colors flex items-center gap-1"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>رد درخواست</span>
                          </button>
                        </>
                      )}

                      {app.status === 'approved' && (
                        <>
                          <button
                            onClick={() => onUpdateStatus(app.id, 'completed')}
                            className="bg-blue-500 hover:bg-blue-400 text-zinc-950 font-bold px-3.5 py-1.5 rounded-xl text-xs transition-colors"
                          >
                            علامت به عنوان انجام شد
                          </button>

                          <button
                            onClick={() => setRejectingAppId(app.id)}
                            className="text-xs text-red-400 hover:text-red-300 px-2 py-1"
                          >
                            لغو
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-zinc-500 block">تاریخ:</span>
                      <span className="font-bold text-zinc-200">{app.jDayName} {app.jDate}</span>
                    </div>

                    <div>
                      <span className="text-zinc-500 block">ساعت:</span>
                      <span className="font-bold text-amber-300 dir-ltr">{toPersianDigits(app.timeSlot)}</span>
                    </div>

                    <div>
                      <span className="text-zinc-500 block">آرایشگر:</span>
                      <span className="font-bold text-zinc-200">{app.barberName}</span>
                    </div>

                    <div>
                      <span className="text-zinc-500 block">هزینه:</span>
                      <span className="font-bold text-emerald-400">{formatPrice(app.price)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SERVICES & PRICING MANAGER */}
      {adminTab === 'services' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-base text-zinc-100">مدیریت خدمات و قیمت‌ها</h3>
              <p className="text-xs text-zinc-400">قیمت، زمان و عناوین خدمات سالن را ویرایش یا اضافه کنید.</p>
            </div>

            <button
              onClick={() => setEditingService({ name: '', price: 150000, duration: 30, description: '', category: 'hair', isActive: true })}
              className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن خدمت جدید</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {services.map(s => (
              <div key={s.id} className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-sm text-zinc-100 mb-1">{s.name}</h4>
                  <p className="text-xs text-zinc-400 mb-2">{s.description}</p>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-emerald-400 font-bold">{formatPrice(s.price)}</span>
                    <span className="text-zinc-500">{toPersianDigits(s.duration)} دقیقه</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingService(s)}
                    className="p-2 text-zinc-400 hover:text-amber-400 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('آیا این خدمت حذف شود؟')) {
                        onDeleteService(s.id);
                      }
                    }}
                    className="p-2 text-zinc-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SHOP SETTINGS */}
      {adminTab === 'settings' && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-base text-zinc-100 border-b border-zinc-800 pb-2">تنظیمات سالن و ساعات کاری</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">نام پیرایشگاه:</label>
              <input
                type="text"
                value={settingsForm.shopName}
                onChange={(e) => setSettingsForm({ ...settingsForm, shopName: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">شماره تماس پشتیبانی:</label>
              <input
                type="text"
                value={settingsForm.phone}
                onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 dir-ltr text-right"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">ساعت شروع کار سالن:</label>
              <input
                type="text"
                value={settingsForm.openingTime}
                onChange={(e) => setSettingsForm({ ...settingsForm, openingTime: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 text-center dir-ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">ساعت پایان کار سالن:</label>
              <input
                type="text"
                value={settingsForm.closingTime}
                onChange={(e) => setSettingsForm({ ...settingsForm, closingTime: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 text-center dir-ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">پین کد مدیریت (ادمین):</label>
              <input
                type="text"
                value={settingsForm.adminPin}
                onChange={(e) => setSettingsForm({ ...settingsForm, adminPin: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-amber-400 font-bold text-center dir-ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">آدرس سالن:</label>
              <input
                type="text"
                value={settingsForm.address}
                onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100"
              />
            </div>
          </div>

          {/* Telegram & Webhook Integration Box */}
          <div className="bg-zinc-950 border border-amber-500/20 rounded-xl p-4 space-y-4 mt-4">
            <h4 className="font-bold text-xs text-amber-400 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>اتصال سیستم به گوگل شیت و تلگرام</span>
              </span>
              {settingsForm.googleSheetUrl && (
                <a
                  href={settingsForm.googleSheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-[11px] font-medium hover:bg-emerald-600/30 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>باز کردن فایل گوگل شیت شما</span>
                </a>
              )}
            </h4>

            <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <FileSpreadsheet className="w-4 h-4" />
                <span>لینک فایل گوگل شیت شما (Google Sheet Connected):</span>
              </div>
              <input
                type="text"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={settingsForm.googleSheetUrl || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, googleSheetUrl: e.target.value })}
                className="w-full bg-zinc-900 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-emerald-300 font-mono dir-ltr"
              />
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                لینک گوگل شیت شما ذخیره شد! همچنین در بخش «خروجی فایل اکسل» می‌توانید هر لحظه لیست رزروها را مستقیماً دانلود یا همگام‌سازی کنید.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                ارسال پیامک/اطلاعیه لحظه‌ای رزروها به تلگرام و ثبت اتوماتیک در گوگل شیت:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-300 mb-1">Telegram Bot Token (توکن ربات تلگرام):</label>
                  <input
                    type="text"
                    placeholder="123456789:ABCdefGhIJKlmNoPQ..."
                    value={settingsForm.telegramBotToken || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, telegramBotToken: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono dir-ltr"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-300 mb-1">Telegram Chat ID (شناسه چت تلگرام شما):</label>
                  <input
                    type="text"
                    placeholder="987654321"
                    value={settingsForm.telegramChatId || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, telegramChatId: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono dir-ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-300 mb-1">آدرس Webhook ثبت خودکار در گوگل شیت (Google Apps Script Webhook):</label>
                <input
                  type="text"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={settingsForm.googleSheetsWebhook || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, googleSheetsWebhook: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono dir-ltr"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">اعلامیه بالای سایت:</label>
            <textarea
              rows={2}
              value={settingsForm.announcement || ''}
              onChange={(e) => setSettingsForm({ ...settingsForm, announcement: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100"
            />
          </div>

          <button
            onClick={() => {
              onSaveSettings(settingsForm);
              alert('تنظیمات با موفقیت ذخیره شد.');
            }}
            className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-6 py-2.5 rounded-xl text-xs transition-colors"
          >
            ذخیره تغییرات تنظیمات
          </button>
        </div>
      )}

      {/* TAB 4: EXPORT TO GOOGLE SHEETS & GITHUB */}
      {adminTab === 'export' && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-5">
          <div>
            <h3 className="font-bold text-base text-zinc-100 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              <span>خروجی گرفتن و میزبانی روی GitHub / Google Sheets</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              شما می‌توانید از تمامی اطلاعات رزروها خروجی اکسل و CSV تهیه کنید یا اپلیکیشن را روی GitHub میزبانی نمائید.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CSV Download Box */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
              <h4 className="font-bold text-sm text-amber-400 flex items-center gap-1.5">
                <Download className="w-4 h-4" />
                <span>دانلود خروجی CSV (گوگل شیت / اکسل)</span>
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                با کلیک بر روی دکمه زیر، فایل CSV تمام نوبت‌های ثبت شده را دریافت کنید و مستقیماً در Google Sheets وارد (Import) نمائید.
              </p>
              <button
                onClick={downloadCSV}
                className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 w-full transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>دانلود فایل CSV نوبت‌ها</span>
              </button>
            </div>

            {/* GitHub Hosting Guide Box */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
              <h4 className="font-bold text-sm text-amber-400 flex items-center gap-1.5">
                <Share2 className="w-4 h-4" />
                <span>راهنمای میزبانی رایگان روی GitHub Pages</span>
              </h4>
              <ol className="text-xs text-zinc-300 space-y-1.5 list-decimal list-inside leading-relaxed">
                <li>پروژه را به گیتهاب خود پوش (Push) کنید.</li>
                <li>در تنظیمات گیت‌هاب بخش Pages شاخه <span className="text-amber-300 font-mono">main</span> را انتخاب کنید.</li>
                <li>سامانه PWA شما بر روی تمام گوشی‌ها به صورت آنلاین اجرا خواهد شد!</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingAppId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="font-bold text-sm text-red-400">علت عدم تأیید نوبت:</h3>
            
            <select
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-200"
            >
              <option value="تکمیل ظرفیت ساعت درخواستی">تکمیل ظرفیت ساعت درخواستی</option>
              <option value="تغییر شیفت آرایشگاه">تغییر شیفت آرایشگاه</option>
              <option value="تعطیلی اضطراری سالن">تعطیلی اضطراری سالن</option>
              <option value="تلفن همراه پاسخ داده نشد">تلفن همراه پاسخ داده نشد</option>
            </select>

            <div className="flex gap-2">
              <button
                onClick={handleConfirmReject}
                className="flex-1 bg-red-500 hover:bg-red-400 text-zinc-950 font-bold py-2 rounded-xl text-xs"
              >
                تأیید و رد درخواست
              </button>
              <button
                onClick={() => setRejectingAppId(null)}
                className="bg-zinc-800 text-zinc-300 px-4 py-2 rounded-xl text-xs"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Service Add/Edit Modal */}
      {editingService && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-bold text-sm text-amber-400">
              {editingService.id ? 'ویرایش خدمت' : 'افزودن خدمت جدید'}
            </h3>

            <div>
              <label className="block text-xs text-zinc-300 mb-1">نام خدمت:</label>
              <input
                type="text"
                value={editingService.name || ''}
                onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-300 mb-1">قیمت (تومان):</label>
                <input
                  type="number"
                  value={editingService.price || 0}
                  onChange={(e) => setEditingService({ ...editingService, price: Number(e.target.value) })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 dir-ltr text-right"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-300 mb-1">مدت زمان (دقیقه):</label>
                <input
                  type="number"
                  value={editingService.duration || 30}
                  onChange={(e) => setEditingService({ ...editingService, duration: Number(e.target.value) })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 dir-ltr text-right"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-300 mb-1">توضیحات کوتاه:</label>
              <textarea
                rows={2}
                value={editingService.description || ''}
                onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  if (editingService.name && editingService.price) {
                    onSaveService(editingService);
                    setEditingService(null);
                  }
                }}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-2.5 rounded-xl text-xs"
              >
                ذخیره خدمت
              </button>
              <button
                onClick={() => setEditingService(null)}
                className="bg-zinc-800 text-zinc-300 px-4 py-2.5 rounded-xl text-xs"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
