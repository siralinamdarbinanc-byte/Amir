export interface NotificationPayload {
  trackingCode: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  price: number;
  barberName: string;
  jDate: string;
  jDayName: string;
  timeSlot: string;
}

export async function sendTelegramNotification(
  botToken: string,
  chatId: string,
  payload: NotificationPayload
): Promise<boolean> {
  if (!botToken || !chatId) return false;

  const text = `
💈 *نوبت جدید در پیرایش امیر!*

👤 *نام مشتری:* ${payload.customerName}
📞 *شماره تماس:* \`${payload.customerPhone}\`
✂️ *خدمت:* ${payload.serviceName}
👨‍🔲 *آرایشگر:* ${payload.barberName}
📅 *تاریخ:* ${payload.jDayName} ${payload.jDate}
⏰ *ساعت حضور:* \`${payload.timeSlot}\`
💰 *مبلغ:* ${payload.price.toLocaleString('fa-IR')} تومان
🔑 *کد پیگیری:* \`${payload.trackingCode}\`

⚠️ *لطفاً جهت تأیید یا رد نوبت وارد پنل مدیریت شوید.*
`.trim();

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown'
      })
    });
    return res.ok;
  } catch (err) {
    console.error('Error sending Telegram notification:', err);
    return false;
  }
}

export async function sendGoogleSheetsWebhook(
  webhookUrl: string,
  payload: NotificationPayload
): Promise<boolean> {
  if (!webhookUrl) return false;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return true;
  } catch (err) {
    console.error('Error posting to Google Sheets Webhook:', err);
    return false;
  }
}
