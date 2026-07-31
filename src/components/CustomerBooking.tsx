import React, { useState } from 'react';
import { 
  Scissors, Sparkles, Crown, Smile, Palette, Star, UserCheck, 
  Calendar as CalendarIcon, Clock, CheckCircle2, ChevronLeft, ChevronRight, 
  AlertCircle, Lock, Phone, User, Copy, Check, Info 
} from 'lucide-react';
import { BarberService, BarberSpecialist, Appointment, ShopSettings } from '../types';
import { getNextDays, JalaliDateObj, generateTimeSlots, formatPrice, toPersianDigits } from '../utils/jalali';
import { soundEngine } from '../utils/audio';

interface CustomerBookingProps {
  services: BarberService[];
  specialists: BarberSpecialist[];
  appointments: Appointment[];
  settings: ShopSettings;
  onBookingSuccess: (newAppointment: Appointment) => void;
  onNavigateToMyBookings: () => void;
}

export const CustomerBooking: React.FC<CustomerBookingProps> = ({
  services,
  specialists,
  appointments,
  settings,
  onBookingSuccess,
  onNavigateToMyBookings,
}) => {
  const [step, setStep] = useState<number>(1);
  const [selectedService, setSelectedService] = useState<BarberService | null>(services[0] || null);
  const [selectedBarber, setSelectedBarber] = useState<BarberSpecialist | null>(specialists[0] || null);

  const daysList = getNextDays(14);
  const [selectedDateObj, setSelectedDateObj] = useState<JalaliDateObj>(daysList[0]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');

  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string>('');
  const [completedAppointment, setCompletedAppointment] = useState<Appointment | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter services by category
  const activeServices = services.filter(s => s.isActive);
  const filteredServices = selectedCategory === 'all' 
    ? activeServices 
    : activeServices.filter(s => s.category === selectedCategory);

  // Time slots for selected date
  const timeSlots = generateTimeSlots(
    settings.openingTime || '09:30',
    settings.closingTime || '21:30',
    settings.slotDuration || 30,
    settings.lunchBreakStart || '13:30',
    settings.lunchBreakEnd || '15:00'
  );

  // Check if a time slot is already booked for the selected barber & date
  const isSlotBooked = (slot: string): boolean => {
    if (!selectedBarber) return false;
    return appointments.some(
      a =>
        a.date === selectedDateObj.dateStr &&
        a.barberId === selectedBarber.id &&
        a.timeSlot === slot &&
        (a.status === 'pending' || a.status === 'approved')
    );
  };

  // Icon mapping helper
  const getServiceIcon = (name?: string, cat?: string) => {
    switch (cat) {
      case 'beard': return <Sparkles className="w-5 h-5 text-amber-400" />;
      case 'package': return <Crown className="w-5 h-5 text-amber-400" />;
      case 'skin': return <Smile className="w-5 h-5 text-amber-400" />;
      case 'vip': return <Star className="w-5 h-5 text-amber-400" />;
      default: return <Scissors className="w-5 h-5 text-amber-400" />;
    }
  };

  const handleNextStep = () => {
    setBookingError('');
    if (step === 1 && !selectedService) {
      setBookingError('لطفاً یک خدمت را انتخاب کنید.');
      return;
    }
    if (step === 2 && !selectedBarber) {
      setBookingError('لطفاً آرایشگر مورد نظر را انتخاب کنید.');
      return;
    }
    if (step === 3 && !selectedTimeSlot) {
      setBookingError('لطفاً یک ساعت برای نوبت خود انتخاب کنید.');
      return;
    }
    setStep(prev => prev + 1);
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError('');

    if (!customerName.trim()) {
      setBookingError('لطفاً نام و نام خانوادگی خود را وارد کنید.');
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setBookingError('لطفاً شماره موبایل معتبر (مثلاً ۰۹۱۲۳۴۵۶۷۸۹) وارد کنید.');
      return;
    }

    if (!selectedService || !selectedBarber || !selectedTimeSlot) {
      setBookingError('اطلاعات رزرو ناقص است. لطفاً مراحل قبل را چک کنید.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          serviceId: selectedService.id,
          barberId: selectedBarber.id,
          date: selectedDateObj.dateStr,
          jDate: selectedDateObj.jDateStr,
          jDayName: selectedDateObj.dayName,
          timeSlot: selectedTimeSlot
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'خطا در ثبت نوبت');
      }

      // Play audio chime
      soundEngine.playBookingChime();
      
      setCompletedAppointment(data);
      onBookingSuccess(data);
      setStep(5); // Success step
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در برقراری ارتباط با سرور';
      setBookingError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyTrackingCode = () => {
    if (completedAppointment) {
      navigator.clipboard.writeText(completedAppointment.trackingCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 3000);
    }
  };

  // SUCCESS STEP (Step 5)
  if (step === 5 && completedAppointment) {
    return (
      <div className="max-w-xl mx-auto py-6 px-4">
        <div className="bg-zinc-900/90 border border-amber-500/30 rounded-2xl p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden">
          {/* Background Glow */}
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-2xl mx-auto flex items-center justify-center mb-4 border border-amber-500/40 animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-bold text-amber-400 mb-2">نوبت شما با موفقیت ثبت شد!</h2>
          <p className="text-sm text-zinc-300 mb-6 leading-relaxed">
            درخواست رزرو شما ثبت گردید و پس از بررسی مدیریت، وضعیت آن تأیید خواهد شد.
          </p>

          {/* Alert Notice */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 mb-6 text-right flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200/90 leading-relaxed">
              <strong className="block text-amber-400 font-bold mb-0.5">نکته مهم:</strong>
              لطفاً <span className="font-bold underline">۵ دقیقه قبل از زمان مقرر</span> در پیرایش امیر حضور داشته باشید.
            </div>
          </div>

          {/* Details Card */}
          <div className="bg-zinc-950/80 rounded-xl p-4 border border-zinc-800 text-right space-y-3 mb-6">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-2.5">
              <span className="text-xs text-zinc-400">کد پیگیری اختصاصی:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-bold text-amber-400 dir-ltr">{completedAppointment.trackingCode}</span>
                <button
                  onClick={copyTrackingCode}
                  className="p-1 rounded bg-zinc-800 text-zinc-300 hover:text-amber-400 transition-colors"
                  title="کپی کد"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-zinc-400">خدمت درخواستی:</span>
              <span className="text-xs font-semibold text-zinc-200">{completedAppointment.serviceName}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-zinc-400">آرایشگر:</span>
              <span className="text-xs font-semibold text-zinc-200">{completedAppointment.barberName}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-zinc-400">تاریخ و ساعت:</span>
              <span className="text-xs font-semibold text-amber-300">
                {completedAppointment.jDayName} {completedAppointment.jDate} - ساعت {toPersianDigits(completedAppointment.timeSlot)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-zinc-400">مبلغ قابل پرداخت:</span>
              <span className="text-xs font-bold text-emerald-400">{formatPrice(completedAppointment.price)}</span>
            </div>

            <div className="flex justify-between items-center pt-1 border-t border-zinc-800/80">
              <span className="text-xs text-zinc-400">وضعیت رزرو:</span>
              <span className="text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
                در انتظار تأیید ادمین
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onNavigateToMyBookings}
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <Clock className="w-4 h-4" />
              <span>مشاهده و پیگیری نوبت‌های من</span>
            </button>

            <button
              onClick={() => {
                setStep(1);
                setCompletedAppointment(null);
                setCustomerName('');
                setCustomerPhone('');
              }}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium py-3 px-4 rounded-xl text-sm transition-colors"
            >
              رزرو نوبت جدید
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-4 px-3 sm:px-4">
      {/* Announcement banner if set */}
      {settings.announcement && (
        <div className="bg-gradient-to-r from-amber-500/15 via-zinc-900 to-amber-500/15 border border-amber-500/30 rounded-xl p-3 mb-5 text-center text-xs text-amber-300/90 leading-relaxed shadow-sm flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{settings.announcement}</span>
        </div>
      )}

      {/* Wizard Progress Bar */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-amber-400">
            مرحله {toPersianDigits(step)} از ۴: {
              step === 1 ? 'انتخاب خدمت' :
              step === 2 ? 'انتخاب آرایشگر' :
              step === 3 ? 'زمان و تاریخ' : 'مشخصات تماس'
            }
          </span>
          <span className="text-xs text-zinc-400">{toPersianDigits(Math.round((step / 4) * 100))}%</span>
        </div>
        <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-gradient-to-r from-amber-600 to-amber-400 h-full transition-all duration-300 rounded-full"
            style={{ width: `${(step / 4) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Error Alert if any */}
      {bookingError && (
        <div className="bg-red-500/15 border border-red-500/40 rounded-xl p-3.5 mb-5 text-xs text-red-300 flex items-start gap-2.5 animate-shake">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>{bookingError}</span>
        </div>
      )}

      {/* STEP 1: CHOOSE SERVICE */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <Scissors className="w-5 h-5 text-amber-400" />
                <span>۱. خدمت مورد نظر خود را انتخاب کنید</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-1">لیست خدمات و هزینه‌های آرایشگاه پیرایش امیر</p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-amber-500 text-zinc-950 font-bold'
                    : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                همه خدمات
              </button>
              <button
                onClick={() => setSelectedCategory('hair')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === 'hair'
                    ? 'bg-amber-500 text-zinc-950 font-bold'
                    : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                اصلاح سر
              </button>
              <button
                onClick={() => setSelectedCategory('beard')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === 'beard'
                    ? 'bg-amber-500 text-zinc-950 font-bold'
                    : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                اصلاح ریش
              </button>
              <button
                onClick={() => setSelectedCategory('skin')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === 'skin'
                    ? 'bg-amber-500 text-zinc-950 font-bold'
                    : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                فیشیال پوست
              </button>
              <button
                onClick={() => setSelectedCategory('package')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === 'package'
                    ? 'bg-amber-500 text-zinc-950 font-bold'
                    : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                پکیج‌ها
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {filteredServices.map(service => {
              const isSelected = selectedService?.id === service.id;
              return (
                <div
                  key={service.id}
                  onClick={() => setSelectedService(service)}
                  className={`cursor-pointer rounded-xl p-4 border transition-all relative ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500 text-zinc-100 shadow-lg shadow-amber-500/10'
                      : 'bg-zinc-900/80 border-zinc-800/90 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-amber-400'}`}>
                      {getServiceIcon(service.iconName, service.category)}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-sm text-zinc-100">{service.name}</h3>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-3">{service.description}</p>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-xs">
                        <span className="flex items-center gap-1 text-zinc-400">
                          <Clock className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{toPersianDigits(service.duration)} دقیقه</span>
                        </span>
                        <span className="font-bold text-amber-400">{formatPrice(service.price)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={handleNextStep}
              className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
            >
              <span>مرحله بعدی: انتخاب آرایشگر</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: CHOOSE BARBER */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-amber-400" />
              <span>۲. آرایشگر مورد نظر را انتخاب کنید</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1">استادکاران و متخصصین مجموعه پیرایش امیر</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {specialists.map(barber => {
              const isSelected = selectedBarber?.id === barber.id;
              return (
                <div
                  key={barber.id}
                  onClick={() => setSelectedBarber(barber)}
                  className={`cursor-pointer rounded-2xl p-5 border transition-all text-center ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500 text-zinc-100 shadow-xl shadow-amber-500/10'
                      : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 mx-auto mb-3 flex items-center justify-center text-zinc-950 font-bold text-xl border-2 border-amber-400 shadow-md">
                    {barber.name.substring(0, 1)}
                  </div>
                  <h3 className="font-bold text-base text-zinc-100 mb-0.5">{barber.name}</h3>
                  <p className="text-xs text-amber-400/90 mb-3">{barber.title}</p>
                  
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {barber.specialties.map((spec, i) => (
                      <span key={i} className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full border border-zinc-700">
                        {spec}
                      </span>
                    ))}
                  </div>

                  {isSelected && (
                    <div className="mt-4 text-xs font-bold text-amber-400 flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>انتخاب شده</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-4 flex items-center justify-between">
            <button
              onClick={() => setStep(1)}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium px-4 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-1.5"
            >
              <ChevronRight className="w-4 h-4" />
              <span>مرحله قبل</span>
            </button>

            <button
              onClick={handleNextStep}
              className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
            >
              <span>مرحله بعدی: تاریخ و ساعت</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: CHOOSE DATE & TIME */}
      {step === 3 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-amber-400" />
              <span>۳. تاریخ و ساعت نوبت را انتخاب کنید</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1">ساعت‌های رزرو شده یا تعطیل به صورت هوشمند قفل می‌باشند.</p>
          </div>

          {/* Jalali Date Selector Pills */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-2">انتخاب روز (تقویم شمسی):</label>
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {daysList.map((dObj) => {
                const isSelected = selectedDateObj.dateStr === dObj.dateStr;
                const isOffDay = settings.offDays?.includes(dObj.isFriday ? 5 : 0) || (dObj.isFriday && settings.offDays?.includes(5));

                return (
                  <button
                    key={dObj.dateStr}
                    onClick={() => {
                      setSelectedDateObj(dObj);
                      setSelectedTimeSlot('');
                    }}
                    className={`flex flex-col items-center justify-center min-w-[85px] py-3 px-2 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-amber-500 text-zinc-950 font-bold border-amber-400 shadow-md scale-105'
                        : isOffDay
                        ? 'bg-zinc-900/50 border-zinc-800/50 text-zinc-600'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-[11px] mb-0.5 opacity-80">{dObj.dayName}</span>
                    <span className="text-sm font-extrabold">{toPersianDigits(dObj.jd)}</span>
                    <span className="text-[10px] mt-0.5 opacity-80">{dObj.monthName}</span>
                    {dObj.isToday && (
                      <span className={`text-[9px] mt-1 px-1.5 py-0.2 rounded ${isSelected ? 'bg-zinc-950 text-amber-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        امروز
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Slots Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs font-semibold text-zinc-300">
                ساعت‌های آماده برای تاریخ {selectedDateObj.fullFormatted}:
              </label>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1 text-zinc-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> آزاد
                </span>
                <span className="flex items-center gap-1 text-zinc-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-800 border border-zinc-700 inline-block"></span> رزرو شده
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {timeSlots.map((slot) => {
                const booked = isSlotBooked(slot);
                const isSelected = selectedTimeSlot === slot;

                return (
                  <button
                    key={slot}
                    disabled={booked}
                    onClick={() => setSelectedTimeSlot(slot)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                      isSelected
                        ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-lg shadow-amber-500/20'
                        : booked
                        ? 'bg-zinc-900/60 border-zinc-800/60 text-zinc-600 cursor-not-allowed opacity-60'
                        : 'bg-zinc-900 text-zinc-200 border-zinc-800 hover:border-amber-500/50 hover:text-amber-400'
                    }`}
                  >
                    <span>{toPersianDigits(slot)}</span>
                    {booked ? (
                      <span className="text-[9px] font-normal text-red-400/80 flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" /> پر شده
                      </span>
                    ) : (
                      <span className="text-[9px] font-normal opacity-70">آزاد</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <button
              onClick={() => setStep(2)}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium px-4 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-1.5"
            >
              <ChevronRight className="w-4 h-4" />
              <span>مرحله قبل</span>
            </button>

            <button
              onClick={handleNextStep}
              className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
            >
              <span>مرحله بعدی: اطلاعات تماس</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: CONTACT INFO & CONFIRM */}
      {step === 4 && (
        <form onSubmit={handleSubmitBooking} className="space-y-5">
          <div>
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <User className="w-5 h-5 text-amber-400" />
              <span>۴. ورود مشخصات و نهایی‌سازی رزرو</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1">شماره موبایل شما جهت ارسال نوتیفیکیشن و پیامک تأیید استفاده می‌شود.</p>
          </div>

          {/* Booking Summary Box */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 text-xs space-y-2.5">
            <h3 className="font-bold text-amber-400 border-b border-zinc-800 pb-2">خلاصه پیش‌فاکتور نوبت شما:</h3>
            <div className="flex justify-between text-zinc-300">
              <span>نوع خدمت:</span>
              <span className="font-semibold text-zinc-100">{selectedService?.name}</span>
            </div>
            <div className="flex justify-between text-zinc-300">
              <span>آرایشگر انتخابی:</span>
              <span className="font-semibold text-zinc-100">{selectedBarber?.name}</span>
            </div>
            <div className="flex justify-between text-zinc-300">
              <span>تاریخ رزرو:</span>
              <span className="font-semibold text-amber-300">{selectedDateObj.fullFormatted}</span>
            </div>
            <div className="flex justify-between text-zinc-300">
              <span>ساعت حضور:</span>
              <span className="font-bold text-amber-300 dir-ltr">{toPersianDigits(selectedTimeSlot)}</span>
            </div>
            <div className="flex justify-between text-zinc-100 font-bold pt-2 border-t border-zinc-800 text-sm">
              <span>هزینه خدمت:</span>
              <span className="text-emerald-400">{selectedService ? formatPrice(selectedService.price) : '۰ تومان'}</span>
            </div>
          </div>

          {/* Form Inputs */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                نام و نام خانوادگی <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="مثال: علی محمدی"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-amber-500 transition-colors pr-10"
                />
                <User className="w-4 h-4 text-zinc-500 absolute right-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                شماره موبایل (جهت دریافت پیامک/نوتیفیکیشن) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  placeholder="09123456789"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-amber-500 transition-colors pr-10 dir-ltr text-right"
                />
                <Phone className="w-4 h-4 text-zinc-500 absolute right-3.5 top-3.5" />
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium px-4 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-1.5"
            >
              <ChevronRight className="w-4 h-4" />
              <span>مرحله قبل</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold px-7 py-3 rounded-xl text-sm transition-all shadow-xl shadow-amber-500/20 flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>در حال ثبت...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>ثبت نهایی و دریافت کد پیگیری</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
