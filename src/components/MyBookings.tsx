import React, { useState, useEffect } from 'react';
import { Search, Clock, Calendar, AlertCircle, Phone, XCircle, RefreshCw, Scissors, MapPin } from 'lucide-react';
import { Appointment, ShopSettings } from '../types';
import { formatPrice, toPersianDigits } from '../utils/jalali';

interface MyBookingsProps {
  appointments: Appointment[];
  settings: ShopSettings;
  onRefreshAppointments: () => void;
  onCancelAppointment: (id: string) => void;
}

export const MyBookings: React.FC<MyBookingsProps> = ({
  appointments,
  settings,
  onRefreshAppointments,
  onCancelAppointment
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Auto load last stored phone from localStorage
  useEffect(() => {
    const savedPhone = localStorage.getItem('amir_barber_customer_phone');
    if (savedPhone) {
      setSearchQuery(savedPhone);
    }
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      localStorage.setItem('amir_barber_customer_phone', searchQuery.trim());
      onRefreshAppointments();
    }
  };

  // Filter appointments by phone or tracking code
  const filteredAppointments = appointments.filter(a => {
    if (!searchQuery.trim()) return true; // Show recent if no search
    const query = searchQuery.trim().toLowerCase();
    return (
      a.customerPhone.includes(query) ||
      a.trackingCode.toLowerCase().includes(query) ||
      a.customerName.toLowerCase().includes(query)
    );
  });

  const getStatusBadge = (status: Appointment['status']) => {
    switch (status) {
      case 'approved':
        return (
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <span>تأیید شده</span>
          </span>
        );
      case 'pending':
        return (
          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse">
            <span>در انتظار تأیید مدیریت</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="bg-red-500/20 text-red-400 border border-red-500/40 px-3 py-1 rounded-full text-xs font-bold">
            <span>رد شده</span>
          </span>
        );
      case 'completed':
        return (
          <span className="bg-blue-500/20 text-blue-400 border border-blue-500/40 px-3 py-1 rounded-full text-xs font-bold">
            <span>انجام شد</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="bg-zinc-800 text-zinc-400 border border-zinc-700 px-3 py-1 rounded-full text-xs font-medium">
            <span>لغو شده</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-4 px-3 sm:px-4 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <span>پیگیری و مدیریت نوبت‌های من</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            شماره موبایل یا کد پیگیری خود را وارد کنید تا وضعیت لحظه‌ای رزروها را ببینید.
          </p>
        </div>

        <button
          onClick={() => {
            setIsSearching(true);
            onRefreshAppointments();
            setTimeout(() => setIsSearching(false), 500);
          }}
          className="self-start sm:self-auto flex items-center gap-1.5 text-xs text-amber-400 bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 px-3 py-2 rounded-xl transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSearching ? 'animate-spin' : ''}`} />
          <span>بروزرسانی وضعیت</span>
        </button>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearchSubmit} className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4">
        <label className="block text-xs font-medium text-zinc-300 mb-2">
          جستجو با شماره موبایل یا کد پیگیری:
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="مثال: 09123456789 یا PA-9842"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-amber-500 transition-colors pr-10"
            />
            <Search className="w-4 h-4 text-zinc-500 absolute right-3.5 top-3.5" />
          </div>
          <button
            type="submit"
            className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-5 py-2.5 rounded-xl text-xs transition-colors"
          >
            جستجو
          </button>
        </div>
      </form>

      {/* Appointments List */}
      <div className="space-y-4">
        {filteredAppointments.length === 0 ? (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-400">
            <Calendar className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="font-bold text-zinc-300 text-sm mb-1">هیچ نوبتی یافت نشد</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              {searchQuery
                ? 'نوبتی با این شماره یا کد پیگیری ثبت نشده است. لطفاً شماره موبایل را بررسی کنید.'
                : 'هنوز نوبتی ثبت نکرده‌اید.'}
            </p>
          </div>
        ) : (
          filteredAppointments.map((app) => (
            <div
              key={app.id}
              className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden transition-all hover:border-zinc-700"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded dir-ltr">
                    کد: {app.trackingCode}
                  </span>
                  <span className="text-xs text-zinc-400 font-medium">
                    {app.customerName}
                  </span>
                </div>
                <div>{getStatusBadge(app.status)}</div>
              </div>

              {/* 5-minute Warning Box if Approved */}
              {app.status === 'approved' && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 mb-3.5 text-xs text-emerald-300 flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong className="font-bold text-emerald-400">تأیید نوبت:</strong> نوبت شما تأیید گردید. لطفاً <span className="underline font-bold">۵ دقیقه قبل از ساعت {toPersianDigits(app.timeSlot)}</span> در پیرایش امیر حضور داشته باشید.
                  </div>
                </div>
              )}

              {/* Rejection notice */}
              {app.status === 'rejected' && app.rejectionReason && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-3.5 text-xs text-red-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <div>
                    <strong className="font-bold">علت عدم تأیید:</strong> {app.rejectionReason}
                  </div>
                </div>
              )}

              {/* Details grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3">
                <div className="bg-zinc-950/70 p-2.5 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500 block mb-1">خدمت:</span>
                  <span className="font-bold text-zinc-200">{app.serviceName}</span>
                </div>

                <div className="bg-zinc-950/70 p-2.5 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500 block mb-1">آرایشگر:</span>
                  <span className="font-bold text-zinc-200">{app.barberName}</span>
                </div>

                <div className="bg-zinc-950/70 p-2.5 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500 block mb-1">تاریخ و روز:</span>
                  <span className="font-bold text-amber-300">{app.jDayName} {app.jDate}</span>
                </div>

                <div className="bg-zinc-950/70 p-2.5 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500 block mb-1">ساعت حضور:</span>
                  <span className="font-bold text-amber-300 dir-ltr">{toPersianDigits(app.timeSlot)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-800/80">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <MapPin className="w-3.5 h-3.5 text-amber-500" />
                  <span className="truncate max-w-[200px] sm:max-w-none">{settings.address}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-bold text-emerald-400">{formatPrice(app.price)}</span>
                  {(app.status === 'pending' || app.status === 'approved') && (
                    <button
                      onClick={() => {
                        if (window.confirm('آیا از لغو این نوبت اطمینان دارید؟')) {
                          onCancelAppointment(app.id);
                        }
                      }}
                      className="text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>لغو نوبت</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
