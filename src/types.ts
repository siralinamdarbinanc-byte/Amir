export interface BarberService {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  description: string;
  category: 'haircut' | 'beard' | 'vip' | 'facial' | 'color';
  icon: string;
  popular?: boolean;
}

export interface BarberSpecialist {
  id: string;
  name: string;
  role: string;
  avatar: string;
  experienceYears: number;
  rating: number;
  bio: string;
}

export interface Appointment {
  id: string;
  trackingCode: string;
  customerName: string;
  customerPhone: string;
  serviceId: string;
  serviceName: string;
  specialistId: string;
  specialistName: string;
  price: number;
  durationMinutes: number;
  gDate: string; // YYYY-MM-DD
  jDate: string; // 1403/05/10
  jDayName: string; // پنج‌شنبه
  timeSlot: string; // "14:30"
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  createdAt: string;
  notes?: string;
  rejectionReason?: string;
}

export interface TimeSlotOption {
  time: string;
  isAvailable: boolean;
  reason?: string;
}

export interface ShopSettings {
  shopName: string;
  phone: string;
  instagram: string;
  address: string;
  adminPin: string;
  adminPinHash?: string;
  hideAdminButton?: boolean;
  authMode?: 'local' | 'remote';
  authWebhookUrl?: string;
  openingTime: string; // "09:30"
  closingTime: string; // "21:30"
  slotDuration: number; // 30 mins
  lunchBreakStart: string; // "13:30"
  lunchBreakEnd: string; // "15:00"
  offDays: number[]; // [5] for Fridays
  autoApprove: boolean;
  announcement: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  googleSheetsWebhook?: string;
  googleSheetUrl?: string;
}
