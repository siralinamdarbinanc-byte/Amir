import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

interface BarberService {
  id: string;
  name: string;
  price: number;
  duration: number;
  description: string;
  category: 'hair' | 'beard' | 'package' | 'skin' | 'vip';
  isActive: boolean;
  iconName?: string;
}

interface BarberSpecialist {
  id: string;
  name: string;
  title: string;
  avatarUrl?: string;
  isAvailable: boolean;
  specialties: string[];
}

interface Appointment {
  id: string;
  trackingCode: string;
  customerName: string;
  customerPhone: string;
  serviceId: string;
  serviceName: string;
  price: number;
  barberId: string;
  barberName: string;
  date: string;
  jDate: string;
  jDayName: string;
  timeSlot: string;
  createdAt: string;
  updatedAt?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  adminNotes?: string;
  rejectionReason?: string;
  userNotified?: boolean;
}

interface ShopSettings {
  shopName: string;
  phone: string;
  instagram: string;
  address: string;
  adminPin: string;
  openingTime: string;
  closingTime: string;
  slotDuration: number;
  lunchBreakStart: string;
  lunchBreakEnd: string;
  offDays: number[];
  autoApprove: boolean;
  announcement?: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  googleSheetsWebhook?: string;
  googleSheetUrl?: string;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  forRole: 'customer' | 'admin' | 'all';
  appointmentId?: string;
}

interface DatabaseSchema {
  services: BarberService[];
  specialists: BarberSpecialist[];
  appointments: Appointment[];
  settings: ShopSettings;
  notifications: NotificationItem[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'store.json');

const DEFAULT_SERVICES: BarberService[] = [
  {
    id: 's1',
    name: 'اصلاح تخصصی سر و فید',
    price: 180000,
    duration: 45,
    description: 'اصلاح کامل سر، فید اختصاصی، خط‌زن دقیق، شستشو و سشوار حرفه‌ای',
    category: 'hair',
    isActive: true,
    iconName: 'Scissors'
  },
  {
    id: 's2',
    name: 'اصلاح و فرم‌دهی ریش',
    price: 100000,
    duration: 25,
    description: 'کاهش حجم ریش، فرم‌دهی چانه، خط ریش با تیغ و روغن تقویتی',
    category: 'beard',
    isActive: true,
    iconName: 'Sparkles'
  },
  {
    id: 's3',
    name: 'پکیج کامل (سر + ریش + شستشو)',
    price: 250000,
    duration: 60,
    description: 'اصلاح تخصصی سر و ریش به همراه دو مرحله شستشو، ماساژ سر و استایل',
    category: 'package',
    isActive: true,
    iconName: 'Crown'
  },
  {
    id: 's4',
    name: 'پاکسازی و فیشیال پوست',
    price: 220000,
    duration: 35,
    description: 'بخور گرم، ماسک ورقه، لایه‌برداری، تخلیه جوش‌های سرسیاه و ماساژ صورت',
    category: 'skin',
    isActive: true,
    iconName: 'Smile'
  },
  {
    id: 's5',
    name: 'رنگ مو و ویتامینه',
    price: 300000,
    duration: 50,
    description: 'رنگ موی تخصصی مردانه، پوشش موهای سفید، کراتینه و ویتامینه تقویت ریشه',
    category: 'hair',
    isActive: true,
    iconName: 'Palette'
  },
  {
    id: 's6',
    name: 'پکیج VIP داماد و گریم',
    price: 1500000,
    duration: 120,
    description: 'استایل VIP دامادی، پاکسازی کامل، گریم متعادلسازی صورت، اصلاح کامل و پذیرایی',
    category: 'vip',
    isActive: true,
    iconName: 'Star'
  }
];

const DEFAULT_SPECIALISTS: BarberSpecialist[] = [
  {
    id: 'b1',
    name: 'امیر حسین (مدیریت و استادکار)',
    title: 'استادکار فید و مدل‌های مدرن',
    isAvailable: true,
    specialties: ['اصلاح سر', 'فید سایه', 'پکیج VIP']
  },
  {
    id: 'b2',
    name: 'رضا (متخصص ریش و گریم)',
    title: 'متخصص طراحی ریش و پاکسازی پوست',
    isAvailable: true,
    specialties: ['اصلاح ریش', 'فیشیال پوست', 'رنگ مو']
  }
];

const DEFAULT_SETTINGS: ShopSettings = {
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
  offDays: [5], // Friday is off by default
  autoApprove: false,
  announcement: 'به پیرایش امیر خوش آمدید! لطفا ۵ دقیقه قبل از زمان رزرو شده در سالن حضور داشته باشید.',
  googleSheetUrl: 'https://docs.google.com/spreadsheets/d/1hSlUjER1fe7FzM3PWDUf5AQZ2ubm1K6WmpiPJNcZDRo/edit?usp=sharing',
  googleSheetsWebhook: 'https://script.google.com/macros/s/AKfycbx2RqPAsaO9kuXG-XwA4ik4P-nTvkOxkoeyBzZU-F21d4eB2FcLwZsV0QMq3NrRHUBl/exec'
};

function loadDatabase(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      const settings = { ...DEFAULT_SETTINGS, ...parsed.settings };
      if (!settings.googleSheetUrl) {
        settings.googleSheetUrl = DEFAULT_SETTINGS.googleSheetUrl;
      }
      if (!settings.googleSheetsWebhook) {
        settings.googleSheetsWebhook = DEFAULT_SETTINGS.googleSheetsWebhook;
      }
      return {
        services: parsed.services || DEFAULT_SERVICES,
        specialists: parsed.specialists || DEFAULT_SPECIALISTS,
        appointments: parsed.appointments || [],
        settings,
        notifications: parsed.notifications || []
      };
    }
  } catch (err) {
    console.error('Error loading DB file:', err);
  }

  const initial: DatabaseSchema = {
    services: DEFAULT_SERVICES,
    specialists: DEFAULT_SPECIALISTS,
    appointments: [],
    settings: DEFAULT_SETTINGS,
    notifications: []
  };
  saveDatabase(initial);
  return initial;
}

function saveDatabase(db: DatabaseSchema) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving DB file:', err);
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  let db = loadDatabase();

  // Helper function to generate tracking code
  const generateTrackingCode = (): string => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `PA-${randomNum}`;
  };

  // --- REST API ENDPOINTS ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', shop: db.settings.shopName });
  });

  // Services API
  app.get('/api/services', (req, res) => {
    res.json(db.services);
  });

  app.post('/api/services', (req, res) => {
    const { name, price, duration, description, category } = req.body;
    if (!name || !price || !duration) {
      return res.status(400).json({ error: 'اطلاعات خدمت کامل نیست' });
    }
    const newService: BarberService = {
      id: `s_${Date.now()}`,
      name,
      price: Number(price),
      duration: Number(duration),
      description: description || '',
      category: category || 'hair',
      isActive: true,
      iconName: 'Scissors'
    };
    db.services.push(newService);
    saveDatabase(db);
    res.status(201).json(newService);
  });

  app.put('/api/services/:id', (req, res) => {
    const { id } = req.params;
    const index = db.services.findIndex(s => s.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'خدمت مورد نظر یافت نشد' });
    }
    db.services[index] = { ...db.services[index], ...req.body };
    saveDatabase(db);
    res.json(db.services[index]);
  });

  app.delete('/api/services/:id', (req, res) => {
    const { id } = req.params;
    db.services = db.services.filter(s => s.id !== id);
    saveDatabase(db);
    res.json({ success: true, message: 'خدمت حذف شد' });
  });

  // Specialists API
  app.get('/api/specialists', (req, res) => {
    res.json(db.specialists);
  });

  // Settings API
  app.get('/api/settings', (req, res) => {
    res.json(db.settings);
  });

  app.post('/api/settings', (req, res) => {
    db.settings = { ...db.settings, ...req.body };
    saveDatabase(db);
    res.json(db.settings);
  });

  // Verify Google Sheet / Apps Script Password Proxy
  app.post('/api/verify-sheet-password', async (req, res) => {
    const { url, password } = req.body;
    const pwd = (password || '').toString().trim();
    const targetUrl = (url || db.settings.googleSheetsWebhook || db.settings.googleSheetUrl || '').trim();

    if (!pwd) {
      return res.status(400).json({ success: false, message: 'لطفاً رمز عبور را وارد کنید.' });
    }

    try {
      // 1. Check Google Apps Script Web App (script.google.com)
      const appsScriptUrl = targetUrl.includes('script.google.com') 
        ? targetUrl 
        : (db.settings.googleSheetsWebhook || '');

      if (appsScriptUrl && appsScriptUrl.includes('script.google.com')) {
        try {
          const scriptUrl = new URL(appsScriptUrl);
          scriptUrl.searchParams.set('action', 'auth');
          scriptUrl.searchParams.set('password', pwd);
          scriptUrl.searchParams.set('pin', pwd);

          const scriptRes = await fetch(scriptUrl.toString(), { method: 'GET' });
          if (scriptRes.ok) {
            const text = await scriptRes.text();
            let json: any = null;
            try {
              json = JSON.parse(text);
            } catch {
              const cleanText = text.toLowerCase().replace(/\s+/g, '');
              if (cleanText.includes('"success":true') || cleanText.includes('"authorized":true') || cleanText === 'true') {
                return res.json({ success: true, message: 'ورود موفقیت‌آمیز' });
              }
            }

            if (json) {
              if (json.success === true || json.authorized === true || json.valid === true) {
                return res.json({ success: true, message: 'ورود موفقیت‌آمیز' });
              } else {
                return res.json({ 
                  success: false, 
                  message: json.message || 'رمز عبور وارد شده با گوگل شیت مطابقت ندارد.' 
                });
              }
            }
          }
        } catch (e) {
          console.error('Apps Script check failed:', e);
        }
      }

      // 2. Direct Google Spreadsheet CSV check
      const sheetUrl = targetUrl.includes('docs.google.com/spreadsheets')
        ? targetUrl
        : (db.settings.googleSheetUrl || '');

      if (sheetUrl && sheetUrl.includes('docs.google.com/spreadsheets/d/')) {
        const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
        const sheetId = match ? match[1] : '1hSlUjER1fe7FzM3PWDUf5AQZ2ubm1K6WmpiPJNcZDRo';
        
        const csvUrls = [
          `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`,
          `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`
        ];

        for (const csvUrl of csvUrls) {
          try {
            const csvRes = await fetch(csvUrl);
            if (csvRes.ok) {
              const csvText = await csvRes.text();
              // Prevent matching HTML error pages
              if (csvText.includes('<!DOCTYPE html>') || csvText.includes('<html')) {
                continue;
              }

              const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);
              
              // Check top 5 rows for exact cell match
              for (let i = 0; i < Math.min(5, lines.length); i++) {
                const rowCells = lines[i].split(',').map(c => c.replace(/^"|"$/g, '').trim());
                for (const cell of rowCells) {
                  if (cell && cell === pwd) {
                    return res.json({ success: true, message: 'ورود موفقیت‌آمیز' });
                  }
                }
              }
            }
          } catch (e) {
            console.error('CSV fetch check failed:', e);
          }
        }
      }

      return res.json({ 
        success: false, 
        message: 'رمز عبور با اطلاعات گوگل شیت مطابقت ندارد یا دسترسی شیت عمومی (Public) نیست.' 
      });
    } catch (err: any) {
      console.error('Verify sheet password error:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'خطا در ارتباط با سرور گوگل: ' + (err.message || err) 
      });
    }
  });

  // Appointments API
  app.get('/api/appointments', (req, res) => {
    const { date, phone, barberId, status } = req.query;
    let list = [...db.appointments];

    if (date) {
      list = list.filter(a => a.date === date);
    }
    if (phone) {
      const cleanPhone = String(phone).trim();
      list = list.filter(a => a.customerPhone.includes(cleanPhone));
    }
    if (barberId) {
      list = list.filter(a => a.barberId === barberId);
    }
    if (status) {
      list = list.filter(a => a.status === status);
    }

    // Sort by date & timeSlot
    list.sort((a, b) => {
      const dCompare = b.date.localeCompare(a.date);
      if (dCompare !== 0) return dCompare;
      return a.timeSlot.localeCompare(b.timeSlot);
    });

    res.json(list);
  });

  // Create Appointment Endpoint with CONFLICT GUARD & AUTO NOTIFICATION
  app.post('/api/appointments', (req, res) => {
    const {
      customerName,
      customerPhone,
      serviceId,
      barberId,
      date,
      jDate,
      jDayName,
      timeSlot
    } = req.body;

    if (!customerName || !customerPhone || !serviceId || !barberId || !date || !timeSlot) {
      return res.status(400).json({ error: 'لطفاً تمام اطلاعات رزرو را وارد کنید.' });
    }

    // 1. Check for time conflict (pending or approved on same date, timeSlot & barber)
    const existingConflict = db.appointments.find(
      a =>
        a.date === date &&
        a.timeSlot === timeSlot &&
        a.barberId === barberId &&
        (a.status === 'pending' || a.status === 'approved')
    );

    if (existingConflict) {
      return res.status(409).json({
        error: `ساعت ${timeSlot} در تاریخ ${jDate || date} قبلاً رزرو شده است. لطفاً ساعت دیگری را انتخاب کنید.`
      });
    }

    const service = db.services.find(s => s.id === serviceId);
    const barber = db.specialists.find(b => b.id === barberId);

    const initialStatus = db.settings.autoApprove ? 'approved' : 'pending';

    const newAppointment: Appointment = {
      id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      trackingCode: generateTrackingCode(),
      customerName: String(customerName).trim(),
      customerPhone: String(customerPhone).trim(),
      serviceId,
      serviceName: service ? service.name : 'اصلاح سر',
      price: service ? service.price : 180000,
      barberId,
      barberName: barber ? barber.name : 'امیر حسین',
      date,
      jDate: jDate || date,
      jDayName: jDayName || 'روز انتخاب شده',
      timeSlot,
      createdAt: new Date().toISOString(),
      status: initialStatus,
      userNotified: true
    };

    db.appointments.push(newAppointment);

    // Create Notification for Admin
    const adminNotification: NotificationItem = {
      id: `notif_${Date.now()}`,
      title: '🔊 نوبت جدید ثبت شد!',
      message: `مشتری ${newAppointment.customerName} (${newAppointment.customerPhone}) برای ${newAppointment.jDate} ساعت ${newAppointment.timeSlot} نوبت ثبت کرد.`,
      type: 'info',
      timestamp: new Date().toISOString(),
      read: false,
      forRole: 'admin',
      appointmentId: newAppointment.id
    };

    db.notifications.unshift(adminNotification);

    saveDatabase(db);

    // Send Telegram Notification if configured
    if (db.settings.telegramBotToken && db.settings.telegramChatId) {
      try {
        const text = `💈 *نوبت جدید در پیرایش امیر!*\n\n👤 *مشتری:* ${newAppointment.customerName}\n📞 *شماره:* ${newAppointment.customerPhone}\n✂️ *خدمت:* ${newAppointment.serviceName}\n📅 *تاریخ:* ${newAppointment.jDayName} ${newAppointment.jDate}\n⏰ *ساعت:* ${newAppointment.timeSlot}\n🔑 *کد پیگیری:* ${newAppointment.trackingCode}`;
        fetch(`https://api.telegram.org/bot${db.settings.telegramBotToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: db.settings.telegramChatId,
            text,
            parse_mode: 'Markdown'
          })
        }).catch(() => {});
      } catch {
        // Ignore telegram network errors
      }
    }

    // Send Google Sheets Webhook if configured
    if (db.settings.googleSheetsWebhook) {
      try {
        fetch(db.settings.googleSheetsWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newAppointment)
        }).catch(() => {});
      } catch {
        // Ignore webhook errors
      }
    }

    res.status(201).json(newAppointment);
  });

  // Update Appointment Status (Approve / Reject / Complete / Cancel)
  app.patch('/api/appointments/:id/status', (req, res) => {
    const { id } = req.params;
    const { status, adminNotes, rejectionReason } = req.body;

    const appointment = db.appointments.find(a => a.id === id);
    if (!appointment) {
      return res.status(404).json({ error: 'نوبت مورد نظر پیدا نشد.' });
    }

    appointment.status = status;
    appointment.updatedAt = new Date().toISOString();
    if (adminNotes !== undefined) appointment.adminNotes = adminNotes;
    if (rejectionReason !== undefined) appointment.rejectionReason = rejectionReason;

    // Create Notification for Customer
    let notifTitle = '';
    let notifMsg = '';
    let notifType: 'info' | 'success' | 'warning' | 'error' = 'info';

    if (status === 'approved') {
      notifTitle = '✅ نوبت شما تأیید شد';
      notifMsg = `نوبت شما برای ${appointment.serviceName} در تاریخ ${appointment.jDate} ساعت ${appointment.timeSlot} تأیید شد. لطفاً ۵ دقیقه قبل از زمان مقرر در سالن حضور داشته باشید.`;
      notifType = 'success';
    } else if (status === 'rejected') {
      notifTitle = '❌ نوبت شما تأیید نشد';
      notifMsg = `متأسفانه نوبت ${appointment.jDate} ساعت ${appointment.timeSlot} تأیید نشد. ${rejectionReason ? `علت: ${rejectionReason}` : 'لطفاً زمان دیگری را انتخاب کنید.'}`;
      notifType = 'error';
    } else if (status === 'completed') {
      notifTitle = '🌟 خدمات با موفقیت انجام شد';
      notifMsg = `از اینکه پیرایش امیر را انتخاب کردید متشکریم. منتظر دیدار مجدد شما هستیم!`;
      notifType = 'success';
    } else if (status === 'cancelled') {
      notifTitle = '⚠️ نوبت لغو شد';
      notifMsg = `نوبت کد ${appointment.trackingCode} لغو شد.`;
      notifType = 'warning';
    }

    if (notifTitle) {
      db.notifications.unshift({
        id: `notif_${Date.now()}`,
        title: notifTitle,
        message: notifMsg,
        type: notifType,
        timestamp: new Date().toISOString(),
        read: false,
        forRole: 'customer',
        appointmentId: appointment.id
      });
    }

    saveDatabase(db);
    res.json(appointment);
  });

  // Delete Appointment
  app.delete('/api/appointments/:id', (req, res) => {
    const { id } = req.params;
    db.appointments = db.appointments.filter(a => a.id !== id);
    saveDatabase(db);
    res.json({ success: true, message: 'نوبت با موفقیت حذف شد' });
  });

  // Notifications API
  app.get('/api/notifications', (req, res) => {
    const { role } = req.query;
    let list = [...db.notifications];
    if (role) {
      list = list.filter(n => n.forRole === role || n.forRole === 'all');
    }
    res.json(list.slice(0, 30));
  });

  app.post('/api/notifications/read', (req, res) => {
    db.notifications.forEach(n => { n.read = true; });
    saveDatabase(db);
    res.json({ success: true });
  });

  // Export CSV for Google Sheets & Excel
  app.get('/api/export/csv', (req, res) => {
    const headers = ['کد پیگیری', 'نام مشتری', 'شماره تماس', 'خدمت', 'مبلغ (تومان)', 'آرایشگر', 'تاریخ شمسی', 'ساعت', 'وضعیت', 'تاریخ ثبت'];
    const rows = db.appointments.map(a => [
      a.trackingCode,
      `"${a.customerName}"`,
      a.customerPhone,
      `"${a.serviceName}"`,
      a.price,
      `"${a.barberName}"`,
      a.jDate,
      a.timeSlot,
      a.status === 'approved' ? 'تأیید شده' : a.status === 'pending' ? 'در انتظار' : a.status === 'completed' ? 'انجام شده' : 'لغو/رد شده',
      a.createdAt
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="amir_barber_appointments.csv"');
    res.send(csvContent);
  });

  // Vite Integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`💈 Amir Barber Server running on http://localhost:${PORT}`);
  });
}

startServer();
