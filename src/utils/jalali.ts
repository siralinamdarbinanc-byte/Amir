import * as jalaali from 'jalaali-js';

// Convert English numbers to Persian digits
export function toPersianDigits(num: number | string): string {
  if (num === null || num === undefined) return '';
  const str = String(num);
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/\d/g, (x) => persianDigits[parseInt(x, 10)]);
}

// Format price in Tomans with commas and Persian digits
export function formatPrice(amount: number): string {
  if (isNaN(amount)) return '۰ تومان';
  const formatted = amount.toLocaleString('fa-IR');
  return `${formatted} تومان`;
}

const WEEKDAYS_FA = [
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
  'جمعه',
  'شنبه'
];

const MONTHS_FA = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند'
];

export interface JalaliDateObj {
  gy: number;
  gm: number;
  gd: number;
  jy: number;
  jm: number;
  jd: number;
  dateStr: string; // YYYY-MM-DD
  jDateStr: string; // ۱۴۰۵/۰۵/۱۰
  dayName: string; // جمعه
  monthName: string; // مرداد
  fullFormatted: string; // جمعه ۱۰ مرداد ۱۴۰۵
  isToday: boolean;
  isFriday: boolean;
}

// Convert Date object to Jalali helper object
export function getJalaliDateDetails(date: Date): JalaliDateObj {
  const gy = date.getFullYear();
  const gm = date.getMonth() + 1;
  const gd = date.getDate();

  const jObj = jalaali.toJalaali(gy, gm, gd);
  const dayOfWeek = date.getDay(); // 0 is Sunday, 6 is Saturday

  const pad = (n: number) => String(n).padStart(2, '0');
  const dateStr = `${gy}-${pad(gm)}-${pad(gd)}`;
  const jDateStr = `${toPersianDigits(jObj.jy)}/${toPersianDigits(pad(jObj.jm))}/${toPersianDigits(pad(jObj.jd))}`;

  const dayName = WEEKDAYS_FA[dayOfWeek];
  const monthName = MONTHS_FA[jObj.jm - 1];
  const fullFormatted = `${dayName} ${toPersianDigits(jObj.jd)} ${monthName} ${toPersianDigits(jObj.jy)}`;

  const today = new Date();
  const isToday =
    today.getFullYear() === gy &&
    today.getMonth() === date.getMonth() &&
    today.getDate() === gd;

  return {
    gy,
    gm,
    gd,
    jy: jObj.jy,
    jm: jObj.jm,
    jd: jObj.jd,
    dateStr,
    jDateStr,
    dayName,
    monthName,
    fullFormatted,
    isToday,
    isFriday: dayOfWeek === 5,
  };
}

// Generate next N days in Jalali
export function getNextDays(count = 14): JalaliDateObj[] {
  const list: JalaliDateObj[] = [];
  const start = new Date();

  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    list.push(getJalaliDateDetails(d));
  }

  return list;
}

// Generate time slots array between opening and closing time
export function generateTimeSlots(
  opening = "09:30",
  closing = "21:30",
  intervalMinutes = 30,
  lunchStart = "13:30",
  lunchEnd = "15:00"
): string[] {
  const parseTime = (str: string) => {
    const [h, m] = str.split(':').map(Number);
    return h * 60 + m;
  };

  const formatTime = (totalMins: number) => {
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const startMins = parseTime(opening);
  const endMins = parseTime(closing);
  const lStart = parseTime(lunchStart);
  const lEnd = parseTime(lunchEnd);

  const slots: string[] = [];

  for (let curr = startMins; curr + intervalMinutes <= endMins; curr += intervalMinutes) {
    // Skip if slot overlaps with lunch break
    if (curr >= lStart && curr < lEnd) {
      continue;
    }
    slots.push(formatTime(curr));
  }

  return slots;
}
