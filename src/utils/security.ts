// Browser-native SHA-256 Cryptographic Hashing for Client-Side Security

export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Default hash for '1234'
export const DEFAULT_PIN_HASH = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4';

// Verify input pin against stored pin or stored hash
export async function verifyPin(inputPin: string, storedPinOrHash: string): Promise<boolean> {
  if (!inputPin) return false;
  
  const trimmedInput = inputPin.trim();
  const trimmedStored = (storedPinOrHash || '').trim();

  // If stored is already a 64-character SHA-256 hex hash
  if (trimmedStored.length === 64 && /^[0-9a-fA-F]{64}$/.test(trimmedStored)) {
    const inputHash = await hashPin(trimmedInput);
    return inputHash.toLowerCase() === trimmedStored.toLowerCase();
  }

  // Fallback for legacy plain-text pin check
  if (trimmedInput === trimmedStored) {
    return true;
  }

  // Check against default 1234 hash
  const inputHash = await hashPin(trimmedInput);
  return inputHash === DEFAULT_PIN_HASH && (trimmedStored === '1234' || !trimmedStored);
}

// Lockout / Rate-limiting helper
const LOCKOUT_TIME_MS = 15 * 60 * 1000; // 15 minutes
const MAX_FAILED_ATTEMPTS = 5;

export interface SecurityState {
  failedAttempts: number;
  lockoutUntil: number | null;
}

export function getSecurityState(): SecurityState {
  try {
    const data = localStorage.getItem('amir_barber_admin_sec');
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed.lockoutUntil && Date.now() > parsed.lockoutUntil) {
        // Lockout expired
        const resetState = { failedAttempts: 0, lockoutUntil: null };
        localStorage.setItem('amir_barber_admin_sec', JSON.stringify(resetState));
        return resetState;
      }
      return parsed;
    }
  } catch (e) {
    console.error(e);
  }
  return { failedAttempts: 0, lockoutUntil: null };
}

export function recordFailedAttempt(): SecurityState {
  const state = getSecurityState();
  const newCount = state.failedAttempts + 1;
  let lockoutUntil = state.lockoutUntil;
  if (newCount >= MAX_FAILED_ATTEMPTS) {
    lockoutUntil = Date.now() + LOCKOUT_TIME_MS;
  }
  const newState = { failedAttempts: newCount, lockoutUntil };
  localStorage.setItem('amir_barber_admin_sec', JSON.stringify(newState));
  return newState;
}

export function resetFailedAttempts(): void {
  localStorage.removeItem('amir_barber_admin_sec');
}

// Remote Google Apps Script / Webhook / Direct Google Sheet CSV Authentication
export async function verifyRemotePinOrPassword(webhookUrl: string, pinOrPassword: string): Promise<{ success: boolean; message?: string }> {
  const trimmedPassword = pinOrPassword.trim();
  const cleanUrl = (webhookUrl || '').trim();

  // 1. Try server proxy endpoint first (/api/verify-sheet-password)
  try {
    const apiRes = await fetch('/api/verify-sheet-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: cleanUrl, password: trimmedPassword })
    });

    if (apiRes.ok) {
      const data = await apiRes.json();
      return data;
    }
  } catch (err) {
    console.warn('Backend proxy auth failed, falling back to client fetch:', err);
  }

  // 2. Client-side Fallback (if backend endpoint is not available e.g., static hosting)
  if (!cleanUrl) {
    return { success: false, message: 'لینک اسکریپت یا گوگل شیت وارد نشده است.' };
  }

  try {
    // Case A: Direct Google Spreadsheet Link
    if (cleanUrl.includes('docs.google.com/spreadsheets/d/')) {
      const match = cleanUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      const sheetId = match ? match[1] : '1hSlUjER1fe7FzM3PWDUf5AQZ2ubm1K6WmpiPJNcZDRo';
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;

      const csvRes = await fetch(csvUrl);
      if (csvRes.ok) {
        const csvText = await csvRes.text();
        if (!csvText.includes('<!DOCTYPE html>') && !csvText.includes('<html')) {
          const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);
          for (let i = 0; i < Math.min(5, lines.length); i++) {
            const cells = lines[i].split(',').map(c => c.replace(/^"|"$/g, '').trim());
            for (const cell of cells) {
              if (cell && cell === trimmedPassword) {
                return { success: true };
              }
            }
          }
        }
      }
    }

    // Case B: Google Apps Script Web App URL (script.google.com)
    if (cleanUrl.includes('script.google.com')) {
      const urlWithParams = new URL(cleanUrl);
      urlWithParams.searchParams.set('action', 'auth');
      urlWithParams.searchParams.set('password', trimmedPassword);
      urlWithParams.searchParams.set('pin', trimmedPassword);

      const res = await fetch(urlWithParams.toString(), { method: 'GET' });

      if (res.ok) {
        const text = await res.text();
        let json: any = null;
        try {
          json = JSON.parse(text);
        } catch {
          const cleanText = text.toLowerCase().replace(/\s+/g, '');
          if (cleanText.includes('"success":true') || cleanText.includes('"authorized":true') || cleanText === 'true') {
            return { success: true };
          }
        }

        if (json) {
          if (json.success === true || json.authorized === true || json.valid === true) {
            return { success: true };
          }
          return { success: false, message: json.message || 'رمز عبور وارد شده با اطلاعات گوگل شیت مطابقت ندارد.' };
        }
      }
    }

    return { success: false, message: 'عدم امکان برقراری ارتباط مستقیم با گوگل شیت.' };
  } catch (err: any) {
    console.error('Remote auth fallback error:', err);
    return { 
      success: false, 
      message: 'عدم امکان برقراری ارتباط با گوگل شیت. لطفاً دسترسی اینترنت و عمومی بودن شیت را بررسی کنید.' 
    };
  }
}

export const GOOGLE_APPS_SCRIPT_AUTH_TEMPLATE = `// -------------------------------------------------------------
// کد اختصاصی گوگل شیت (Google Apps Script) جهت احراز هویت امن مدیر
// متصل به شیت شما (ID: 1hSlUjER1fe7FzM3PWDUf5AQZ2ubm1K6WmpiPJNcZDRo)
// -------------------------------------------------------------

function doGet(e) {
  var userPass = e.parameter.password || e.parameter.pin || "";
  
  // لینک شناسه شیت اختصاصی شما
  var SPREADSHEET_ID = "1hSlUjER1fe7FzM3PWDUf5AQZ2ubm1K6WmpiPJNcZDRo";
  
  // 🔑 خواندن رمز عبور از خانه A1 جدول گوگل شیت شما
  var SECRET_ADMIN_PASSWORD = "";
  try {
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
    SECRET_ADMIN_PASSWORD = sheet.getRange("A1").getValue().toString().trim();
  } catch(err) {
    // اگر نتوانست شیت را باز کند، از این رمز پشتیبان استفاده می‌کند:
    SECRET_ADMIN_PASSWORD = "1234";
  }

  if (userPass.toString().trim() === SECRET_ADMIN_PASSWORD) {
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      authorized: true,
      message: "ورود موفقیت‌آمیز مدیر سالن"
    })).setMimeType(ContentService.MimeType.JSON);
  } else {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      authorized: false,
      message: "رمز عبور اشتباه است"
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  var data = {};
  try {
    data = JSON.parse(e.postData.contents);
  } catch(err) {}
  var userPass = data.password || data.pin || e.parameter.password || "";
  
  var SPREADSHEET_ID = "1hSlUjER1fe7FzM3PWDUf5AQZ2ubm1K6WmpiPJNcZDRo";
  var SECRET_ADMIN_PASSWORD = "";
  try {
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
    SECRET_ADMIN_PASSWORD = sheet.getRange("A1").getValue().toString().trim();
  } catch(err) {
    SECRET_ADMIN_PASSWORD = "1234";
  }

  if (userPass.toString().trim() === SECRET_ADMIN_PASSWORD) {
    return ContentService.createTextOutput(JSON.stringify({ success: true, authorized: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } else {
    return ContentService.createTextOutput(JSON.stringify({ success: false, authorized: false }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;
