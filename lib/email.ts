import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface ContactEmailParams {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  productName?: string;
}

export async function sendContactEmail(params: ContactEmailParams) {
  const { name, email, phone, company, message, productName } = params;

  const subject = productName
    ? `[Seongkohn] Quote Request: ${productName}`
    : `[Seongkohn] New Contact from ${name}`;

  const html = `
    <h2>New Contact Form Submission</h2>
    <table style="border-collapse:collapse;width:100%;max-width:600px">
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Name</td><td style="padding:8px;border:1px solid #ddd">${name}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Email</td><td style="padding:8px;border:1px solid #ddd">${email}</td></tr>
      ${phone ? `<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Phone</td><td style="padding:8px;border:1px solid #ddd">${phone}</td></tr>` : ''}
      ${company ? `<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Company</td><td style="padding:8px;border:1px solid #ddd">${company}</td></tr>` : ''}
      ${productName ? `<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Product</td><td style="padding:8px;border:1px solid #ddd">${productName}</td></tr>` : ''}
    </table>
    <h3>Message</h3>
    <p style="white-space:pre-wrap">${message}</p>
  `;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@seongkohn.com',
      to: process.env.CONTACT_EMAIL || 'info@seongkohn.com',
      subject,
      html,
      replyTo: email,
    });
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}
