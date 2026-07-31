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
  if (!webhookUrl || !webhookUrl.trim()) {
    return { success: false, message: 'لینک اسکریپت یا گوگل شیت وارد نشده است.' };
  }

  const cleanUrl = webhookUrl.trim();
  const trimmedPassword = pinOrPassword.trim();

  try {
    // Case A: Direct Google Spreadsheet Link (e.g., https://docs.google.com/spreadsheets/d/1hSlUjER1fe7FzM3PWDUf5AQZ2ubm1K6WmpiPJNcZDRo/edit...)
    if (cleanUrl.includes('docs.google.com/spreadsheets/d/')) {
      const match = cleanUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      const sheetId = match ? match[1] : '1hSlUjER1fe7FzM3PWDUf5AQZ2ubm1K6WmpiPJNcZDRo';
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;

      const csvRes = await fetch(csvUrl);
      if (csvRes.ok) {
        const csvText = await csvRes.text();
        // Extract first cell value (removing quotes and whitespace)
        // CSV format: "Password", "1234", etc.
        const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length > 0) {
          // Check all values in first line or first cell
          const cells = lines[0].split(',').map(c => c.replace(/^"|"$/g, '').trim());
          const firstCell = cells[0];
          
          // If the first row has a header like "Password", check the second cell or second row
          let expectedPass = firstCell;
          if (firstCell.toLowerCase().includes('pass') || firstCell.toLowerCase().includes('رمز') || firstCell.toLowerCase().includes('pin')) {
            if (cells.length > 1 && cells[1]) {
              expectedPass = cells[1];
            } else if (lines.length > 1) {
              const row2Cells = lines[1].split(',').map(c => c.replace(/^"|"$/g, '').trim());
              expectedPass = row2Cells[0] || expectedPass;
            }
          }

          if (trimmedPassword === expectedPass) {
            return { success: true };
          } else {
            return { success: false, message: 'رمز عبور وارد شده با سلول A1 گوگل شیت مطابقت ندارد.' };
          }
        }
      }
    }

    // Case B: Google Apps Script Web App URL (script.google.com/macros/s/.../exec)
    const urlWithParams = new URL(cleanUrl);
    urlWithParams.searchParams.set('action', 'auth');
    urlWithParams.searchParams.set('password', trimmedPassword);
    urlWithParams.searchParams.set('pin', trimmedPassword);

    const res = await fetch(urlWithParams.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (res.ok) {
      const text = await res.text();
      let json: any = {};
      try {
        json = JSON.parse(text);
      } catch (e) {
        if (text.toLowerCase().includes('success') || text.toLowerCase().includes('true') || text.toLowerCase().includes('authorized')) {
          return { success: true };
        }
      }

      if (json.success === true || json.authorized === true || json.valid === true || json.status === 'success' || json.status === 200) {
        return { success: true };
      }
      return { success: false, message: json.message || 'رمز عبور وارد شده با اطلاعات گوگل شیت مطابقت ندارد.' };
    }

    // POST fallback if GET fails
    const postRes = await fetch(cleanUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'auth', password: trimmedPassword, pin: trimmedPassword }),
    });

    if (postRes.ok) {
      const json = await postRes.json();
      if (json.success === true || json.authorized === true || json.valid === true || json.status === 'success') {
        return { success: true };
      }
      return { success: false, message: json.message || 'رمز عبور نامعتبر است.' };
    }

    return { success: false, message: 'خطا در ارتباط با لینک گوگل شیت. وضعیت پاسخ: ' + res.status };
  } catch (err: any) {
    console.error('Remote auth error:', err);
    return { 
      success: false, 
      message: 'عدم امکان برقراری ارتباط با گوگل شیت. لطفاً دسترسی اینترنت و صحت لینک را بررسی کنید.' 
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
