import { getDb } from '@/lib/db';

const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const SENDER_NAME = '=?UTF-8?B?7ISx6rOk66y07JetKOyjvCk=?=';

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getEmailSettings() {
  const db = getDb();
  const rows = db.prepare('SELECT key, value FROM settings WHERE key IN (?, ?)').all(
    'smtp_from', 'contact_recipients'
  ) as { key: string; value: string }[];

  const settings: Record<string, string> = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  return settings;
}

interface ContactEmailParams {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  productName?: string;
  lang?: 'en' | 'ko';
}

export async function sendContactEmail(params: ContactEmailParams) {
  const { name, email, phone, company, message, productName, lang = 'en' } = params;
  const isKo = lang === 'ko';
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safePhone = phone ? escapeHtml(phone) : undefined;
  const safeCompany = company ? escapeHtml(company) : undefined;
  const safeProductName = productName ? escapeHtml(productName) : undefined;
  const safeMessage = escapeHtml(message).replace(/\r\n|\r|\n/g, '<br />');

  const settings = getEmailSettings();
  const senderEmail = settings.smtp_from || 'noreply@seongkohn.com';
  const recipients = settings.contact_recipients;

  if (!recipients) {
    console.error('Email not configured: missing contact recipients');
    return false;
  }

  const subject = productName
    ? (isKo ? `견적 문의: ${productName}` : `Quote Request: ${productName}`)
    : (isKo ? `신규 문의: ${name}` : `New Contact from ${name}`);

  const titleText = isKo ? '접수 정보' : 'Submission Info';
  const nameLabel = isKo ? '이름' : 'Name';
  const emailLabel = isKo ? '이메일' : 'Email';
  const phoneLabel = isKo ? '전화번호' : 'Phone';
  const companyLabel = isKo ? '소속' : 'Organization';
  const productLabel = isKo ? '제품' : 'Product';
  const messageLabel = isKo ? '문의 내용' : 'Message';

  const html = `
    <div style="font-size:11pt;line-height:1.5">
      <h2 style="font-size:11pt;margin:0 0 8px 0">${titleText}</h2>
      <table style="border-collapse:collapse;width:100%;max-width:600px;font-size:11pt">
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;font-size:11pt">${nameLabel}</td><td style="padding:8px;border:1px solid #ddd;font-size:11pt">${safeName}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;font-size:11pt">${emailLabel}</td><td style="padding:8px;border:1px solid #ddd;font-size:11pt">${safeEmail}</td></tr>
        ${safePhone ? `<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;font-size:11pt">${phoneLabel}</td><td style="padding:8px;border:1px solid #ddd;font-size:11pt">${safePhone}</td></tr>` : ''}
        ${safeCompany ? `<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;font-size:11pt">${companyLabel}</td><td style="padding:8px;border:1px solid #ddd;font-size:11pt">${safeCompany}</td></tr>` : ''}
        ${safeProductName ? `<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;font-size:11pt">${productLabel}</td><td style="padding:8px;border:1px solid #ddd;font-size:11pt">${safeProductName}</td></tr>` : ''}
      </table>
      <h3 style="font-size:11pt;margin:12px 0 6px 0">${messageLabel}</h3>
      <p style="font-size:11pt;margin:0">${safeMessage}</p>
    </div>
  `;

  const recipientList = recipients.split(',').map((r) => r.trim()).filter(Boolean);

  try {
    const payload = {
      sender: { name: SENDER_NAME, email: senderEmail },
      to: recipientList.map((r) => ({ email: r })),
      subject,
      htmlContent: html,
      replyTo: { email, name },
    };

    console.log('Sending email via Brevo:', {
      to: recipientList,
      subject,
      senderEmail,
    });

    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Brevo API error:', {
        status: response.status,
        statusText: response.statusText,
        error: responseData,
      });
      return false;
    }

    console.log('Email sent successfully:', responseData);
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}
