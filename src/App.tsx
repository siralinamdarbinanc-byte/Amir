import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { CustomerBooking } from './components/CustomerBooking';
import { MyBookings } from './components/MyBookings';
import { ServicesList } from './components/ServicesList';
import { AdminPanel } from './components/AdminPanel';
import { PwaInstallModal } from './components/PwaInstallModal';
import { QrCodeModal } from './components/QrCodeModal';
import { NotificationToast, ToastMessage } from './components/NotificationToast';
import { Appointment, BarberService, BarberSpecialist, ShopSettings } from './types';
import { soundEngine } from './utils/audio';

export default function App() {
  const [activeTab, setActiveTab] = useState<'book' | 'my-bookings' | 'services' | 'admin'>('book');
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<BarberService[]>([]);
  const [specialists, setSpecialists] = useState<BarberSpecialist[]>([]);
  const [settings, setSettings] = useState<ShopSettings>({
    shopName: 'پیرایش امیر',
    phone: '09123456789',
    instagram: '@amir_barber_official',
    address: 'تهران، خیابان ولیعصر، نرسیده به میدان ونک، پلاک ۱۲۴',
    adminPin: '1234',
    openingTime: '09:30',
    closingTime: '21:30',
    slotDuration: 30,
    lunchBreakStart: '13:30',
    lunchBreakEnd: '15:00',
    offDays: [5],
    autoApprove: false,
    announcement: 'به پیرایش امیر خوش آمدید! لطفا ۵ دقیقه قبل از زمان رزرو شده در سالن حضور داشته باشید.'
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Ref to track prior appointments state to trigger real-time sound/toast alerts
  const prevAppointmentsRef = useRef<Appointment[]>([]);
  const isFirstLoad = useRef<boolean>(true);

  const addToast = (title: string, message: string, type: ToastMessage['type'] = 'info') => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 6000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Fetch initial data and setup live polling
  const fetchData = useCallback(async () => {
    try {
      const [appRes, servRes, specRes, settRes] = await Promise.all([
        fetch('/api/appointments'),
        fetch('/api/services'),
        fetch('/api/specialists'),
        fetch('/api/settings')
      ]);

      if (appRes.ok) {
        const fetchedApps: Appointment[] = await appRes.json();
        
        // Detect real-time updates for notifications
        if (!isFirstLoad.current && prevAppointmentsRef.current.length > 0) {
          // Check for new pending appointment (Notify Admin)
          const newPending = fetchedApps.filter(
            fa => fa.status === 'pending' && !prevAppointmentsRef.current.some(pa => pa.id === fa.id)
          );

          if (newPending.length > 0) {
            soundEngine.playAdminAlertSound();
            const latest = newPending[0];
            addToast(
              '🔊 نوبت جدید ثبت شد!',
              `مشتری ${latest.customerName} برای تاریخ ${latest.jDate} ساعت ${latest.timeSlot} نوبت جدید ثبت کرد.`,
              'info'
            );
          }

          // Check for status changes on customer appointments
          fetchedApps.forEach(fa => {
            const oldApp = prevAppointmentsRef.current.find(pa => pa.id === fa.id);
            if (oldApp && oldApp.status !== fa.status) {
              if (fa.status === 'approved') {
                soundEngine.playApprovalSound();
                addToast(
                  '✅ نوبت شما تأیید شد',
                  `نوبت کد ${fa.trackingCode} برای ${fa.jDate} ساعت ${fa.timeSlot} تأیید شد. لطفاً ۵ دقیقه قبل در سالن حضور داشته باشید.`,
                  'success'
                );
              } else if (fa.status === 'rejected') {
                soundEngine.playRejectTone();
                addToast(
                  '❌ عدم تأیید نوبت',
                  `درخواست رزرو ${fa.jDate} ساعت ${fa.timeSlot} تأیید نشد. ${fa.rejectionReason ? `علت: ${fa.rejectionReason}` : ''}`,
                  'error'
                );
              }
            }
          });
        }

        prevAppointmentsRef.current = fetchedApps;
        setAppointments(fetchedApps);
        isFirstLoad.current = false;
      }

      if (servRes.ok) {
        const servs = await servRes.json();
        setServices(servs);
      }
      if (specRes.ok) {
        const specs = await specRes.json();
        setSpecialists(specs);
      }
      if (settRes.ok) {
        const setts = await settRes.json();
        setSettings(setts);
      }
    } catch {
      // Server poll fallback
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Live polling every 3 seconds for real-time status updates across devices
    const interval = setInterval(() => {
      fetchData();
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Handle appointment status updates from Admin or Customer cancel
  const handleUpdateAppointmentStatus = async (
    id: string,
    status: Appointment['status'],
    rejectionReason?: string
  ) => {
    try {
      const res = await fetch(`/api/appointments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rejectionReason })
      });

      if (res.ok) {
        const updated = await res.json();
        setAppointments(prev => prev.map(a => a.id === id ? updated : a));
        if (status === 'approved') {
          addToast('نوبت تأیید شد', `نوبت کد ${updated.trackingCode} با موفقیت تأیید گردید.`, 'success');
        } else if (status === 'rejected') {
          addToast('نوبت رد شد', `نوبت کد ${updated.trackingCode} رد گردید.`, 'error');
        } else if (status === 'cancelled') {
          addToast('نوبت لغو شد', `نوبت با موفقیت لغو شد.`, 'warning');
        }
      }
    } catch {
      alert('خطا در تغییر وضعیت نوبت');
    }
  };

  // Service Save handler
  const handleSaveService = async (serviceData: Partial<BarberService>) => {
    try {
      let res;
      if (serviceData.id) {
        res = await fetch(`/api/services/${serviceData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(serviceData)
        });
      } else {
        res = await fetch('/api/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(serviceData)
        });
      }

      if (res.ok) {
        fetchData();
        addToast('خدمات بروز شد', 'اطلاعات خدمت با موفقیت ذخیره گردید.', 'success');
      }
    } catch {
      alert('خطا در ذخیره خدمت');
    }
  };

  // Service Delete handler
  const handleDeleteService = async (id: string) => {
    try {
      const res = await fetch(`/api/services/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
        addToast('حذف خدمت', 'خدمت مورد نظر با موفقیت حذف شد.', 'info');
      }
    } catch {
      alert('خطا در حذف خدمت');
    }
  };

  // Settings Save handler
  const handleSaveSettings = async (newSettings: Partial<ShopSettings>) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      if (res.ok) {
        const saved = await res.json();
        setSettings(saved);
        addToast('تنظیمات ذخیره شد', 'تنظیمات سالن با موفقیت بروز شد.', 'success');
      }
    } catch {
      alert('خطا در ذخیره تنظیمات');
    }
  };

  const pendingCount = appointments.filter(a => a.status === 'pending').length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans pb-16 md:pb-6">
      {/* Toast Notifications */}
      <NotificationToast toasts={toasts} onDismiss={removeToast} />

      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingCount={pendingCount}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        onOpenQrModal={() => setIsQrModalOpen(true)}
        shopPhone={settings.phone}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-2 sm:px-4 py-4">
        {activeTab === 'book' && (
          <CustomerBooking
            services={services}
            specialists={specialists}
            appointments={appointments}
            settings={settings}
            onBookingSuccess={(newApp) => {
              setAppointments(prev => [newApp, ...prev]);
            }}
            onNavigateToMyBookings={() => setActiveTab('my-bookings')}
          />
        )}

        {activeTab === 'my-bookings' && (
          <MyBookings
            appointments={appointments}
            settings={settings}
            onRefreshAppointments={fetchData}
            onCancelAppointment={(id) => handleUpdateAppointmentStatus(id, 'cancelled')}
          />
        )}

        {activeTab === 'services' && (
          <ServicesList
            services={services}
            onSelectServiceToBook={() => {
              setActiveTab('book');
            }}
          />
        )}

        {activeTab === 'admin' && (
          <AdminPanel
            appointments={appointments}
            services={services}
            settings={settings}
            onUpdateStatus={handleUpdateAppointmentStatus}
            onRefresh={fetchData}
            onSaveService={handleSaveService}
            onDeleteService={handleDeleteService}
            onSaveSettings={handleSaveSettings}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-900 bg-zinc-950 py-6 px-4 text-center text-xs text-zinc-500">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="font-bold text-amber-400">پیرایش امیر</span>
            <span> — سامانه رزرو آنلاین نوبت و مدیریت هوشمند سالن</span>
          </div>
          <div className="flex items-center gap-4 text-zinc-400">
            <span>ساعات کاری: {settings.openingTime} الی {settings.closingTime}</span>
            <span>|</span>
            <a href={`tel:${settings.phone}`} className="hover:text-amber-400 transition-colors">
              پشتیبانی: {settings.phone}
            </a>
          </div>
        </div>
      </footer>

      {/* PWA Installation Modal */}
      <PwaInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

      {/* QR Code & GitHub Publishing Modal */}
      <QrCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
      />
    </div>
  );
}
