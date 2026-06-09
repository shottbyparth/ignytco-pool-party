import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REGISTRATIONS_FILE = path.resolve(process.cwd(), 'registrations.json');

// Interface for Ticket registration
interface Registration {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  city: string;
  instagram: string;
  heardFrom: string;
  dietary: string;
  ticket: string; // Ticket category details e.g. "Female — ₹899"
  status: 'Pending Verification' | 'Verified';
  timestamp: string;
  transactionId?: string;       // payment transaction ID (inline proof)
  screenshotImage?: string;     // base64 encoded user screenshot proof option
}

// Ensure registrations JSON file exists
try {
  if (!fs.existsSync(REGISTRATIONS_FILE)) {
    fs.writeFileSync(REGISTRATIONS_FILE, JSON.stringify([], null, 2));
  }
} catch (err) {
  console.error('Error ensuring registrations file exists:', err);
}

// Helper to read registrations
function readRegistrations(): Registration[] {
  try {
    if (!fs.existsSync(REGISTRATIONS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(REGISTRATIONS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading registration file:', err);
    return [];
  }
}

// Helper to save registrations
function saveRegistrations(data: Registration[]) {
  try {
    fs.writeFileSync(REGISTRATIONS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing registration file:', err);
  }
}

// Helper lazy SMTP Transporter
function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
}

// Logger helper for sent emails fallback
function logEmailLocal(to: string, subject: string, body: string) {
  const logMsg = `\n==================================================\n` +
                 `📨 EMAIL SENT [Fallback Log Mode]\n` +
                 `📅 Date: ${new Date().toISOString()}\n` +
                 `👤 To: ${to}\n` +
                 `📝 Subject: ${subject}\n` +
                 `📄 Content:\n${body}\n` +
                 `==================================================\n`;
  console.log(logMsg);
  
  try {
    const logFile = path.resolve(process.cwd(), 'sent_emails.log');
    fs.appendFileSync(logFile, logMsg, 'utf-8');
  } catch (err) {
    console.error('Error appending email logs back to file:', err);
  }
}

// HTML Email Template Wrapper
function buildHtmlEmail(title: string, preheader: string, contentHtml: string, origin: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #060606;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #F0EBE3;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #060606;
      padding: 40px 20px;
      box-sizing: border-box;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #0F0F0F;
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      overflow: hidden;
    }
    .header {
      padding: 32px 24px 20px 24px;
      text-align: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.03);
    }
    .logo {
      font-size: 24px;
      font-weight: 300;
      letter-spacing: 0.3em;
      color: #FFFFFF;
      text-decoration: none;
      display: inline-block;
    }
    .logo-dot {
      color: #C9A84C;
    }
    .subtitle {
      font-size: 8px;
      letter-spacing: 0.5em;
      color: #C9A84C;
      text-transform: uppercase;
      margin-top: 6px;
    }
    .content {
      padding: 32px 32px;
    }
    h1 {
      font-size: 20px;
      font-weight: 400;
      margin-top: 0;
      margin-bottom: 24px;
      color: #FFFFFF;
      letter-spacing: -0.01em;
    }
    p {
      font-size: 14px;
      line-height: 1.6;
      color: rgba(240, 235, 227, 0.8);
      margin-top: 0;
      margin-bottom: 20px;
    }
    .specs-grid {
      border: 1px solid rgba(255, 255, 255, 0.05);
      background-color: #0A0A0A;
      margin-bottom: 24px;
    }
    .spec-row {
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      padding: 14px 16px;
    }
    .spec-row:last-child {
      border-bottom: none;
    }
    .spec-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: #C9A84C;
      margin-bottom: 4px;
      font-weight: 600;
    }
    .spec-value {
      font-size: 14px;
      color: #FFFFFF;
      font-weight: 500;
    }
    .button-container {
      text-align: center;
      margin: 32px 0 16px 0;
    }
    .btn {
      display: inline-block;
      background-color: #C9A84C;
      color: #060606 !important;
      text-decoration: none;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      padding: 16px 36px;
      border-radius: 4px;
      font-weight: bold;
    }
    .footer {
      padding: 24px 32px 32px 32px;
      border-top: 1px solid rgba(255, 255, 255, 0.03);
      text-align: center;
      background-color: #0A0A0A;
    }
    .footer-text {
      font-size: 11px;
      color: rgba(240, 235, 227, 0.4);
      line-height: 1.5;
    }
    .footer-text a {
      color: #C9A84C;
      text-decoration: none;
    }
    .badge-pending {
      display: inline-block;
      background-color: rgba(201, 168, 76, 0.1);
      border: 1px solid rgba(201, 168, 76, 0.3);
      color: #C9A84C;
      font-size: 10px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      padding: 6px 12px;
      border-radius: 4px;
      font-weight: 600;
      margin-bottom: 20px;
    }
    .badge-verified {
      display: inline-block;
      background-color: rgba(76, 175, 80, 0.1);
      border: 1px solid rgba(76, 175, 80, 0.3);
      color: #4CAF50;
      font-size: 10px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      padding: 6px 12px;
      border-radius: 4px;
      font-weight: 600;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <a href="${origin}" class="logo" target="_blank">IGNYT<span class="logo-dot">.</span>CO</a>
        <div class="subtitle">Presents</div>
      </div>
      <div class="content">
        ${contentHtml}
      </div>
      <div class="footer">
        <div class="footer-text">
          Sent by <strong>IGNYT Co. Team</strong><br>
          Trouble or queries? Contact us at <a href="mailto:ignyt@ignyt.co.in">ignyt@ignyt.co.in</a> or Call <a href="tel:7496088484">7496088484</a><br>
          <a href="${origin}" target="_blank">Visit Official Pool Party Site</a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// Send Email core router
async function triggerEmail(to: string, subject: string, body: string, htmlBody?: string) {
  const transporter = getTransporter();
  const fromEmail = process.env.SMTP_USER || "ignyt@ignyt.co.in";

  if (!transporter) {
    logEmailLocal(to, subject, htmlBody || body);
    return false;
  }

  try {
    await transporter.sendMail({
      from: `"IGNYT.CO" <${fromEmail}>`,
      to,
      subject,
      text: body,
      html: htmlBody || body.replace(/\n/g, '<br>')
    });
    console.log(`✅ Email sent successfully to ${to}`);
    return true;
  } catch (err) {
    console.error(`❌ Failed to send email to ${to}:`, err);
    // Log locally as well
    logEmailLocal(to, subject, htmlBody || body);
    return false;
  }
}

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

export { app };

// API: Health / Ping
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

  // API: Add Registration
  app.post('/api/register', async (req, res) => {
    const {
      firstName,
      lastName,
      age,
      gender,
      phone,
      email,
      city,
      instagram,
      heardFrom,
      dietary,
      ticket,
      transactionId,
      screenshotImage
    } = req.body;

    if (!firstName || !lastName || !email || !phone || !ticket) {
      return res.status(400).json({ error: 'Missing mandatory fields' });
    }

    const newRecord: Registration = {
      id: 'reg_' + Math.random().toString(36).substr(2, 9),
      firstName,
      lastName,
      age: Number(age),
      gender,
      phone,
      email,
      city,
      instagram: instagram || 'Not shared',
      heardFrom,
      dietary: dietary || 'No restrictions',
      ticket,
      status: 'Pending Verification',
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      transactionId: transactionId || 'Not provided',
      screenshotImage: screenshotImage || ''
    };

    const currentList = readRegistrations();
    currentList.push(newRecord);
    saveRegistrations(currentList);

    // Dynamic origin calculation for correct link back redirecting
    let origin = req.get('origin') || '';
    if (!origin && req.get('host')) {
      const host = req.get('host') || '';
      const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
      const protocol = isLocal ? 'http' : 'https';
      origin = `${protocol}://${host}`;
    }
    if (!origin) {
      origin = 'https://ignyt.co.in';
    }

    // 📩 Trigger Email to User: Pending Verification
    const userSubject = `Registration Received — Summer Pool Party 🏊‍♂️ (IGNYT Co.)`;
    const userBody = `Hi ${firstName},\n\n` +
      `Your registration for the Summer Pool Party (IGNYT Co.) has been successfully submitted!\n\n` +
      `🎟️ TICKET DETAIL: ${ticket}\n` +
      `📍 VENUE: Villa Ruhaniyat Farms by Urban Oasis near cgc, Mohali\n` +
      `📅 DATE: Saturday, 13 June\n` +
      `🕗 TIME: 8:00 PM Onwards\n` +
      `👔 DRESS CODE: All Black + Neon accessories\n` +
      `🍹 INCLUSION: Complimentary food and drink included (BYOB welcome)\n\n` +
      `⚠️ IMPORTANT: NEXT STEPS\n` +
      `--------------------------------------------------\n` +
      `Since payments are handled via UPI, your ticket remains PENDING VERIFICATION.\n` +
      `We have secured your uploaded payment proof and UPI Sender Name/ID (${newRecord.transactionId}) in our records.\n\n` +
      `Our review team (email contact/owner: parthdua007@gmail.com or ignyt@ignyt.co.in) will verify your submission.\n` +
      `Once payment is confirmed, we will send you your official check-in ticket ID immediately.\n\n` +
      `See you soon!\n` +
      `— IGNYT Co. Team\n` +
      `${origin}`;

    const userHtml = buildHtmlEmail(
      'Registration Received — IGNYT Co.',
      'Your pool party registration is pending verification.',
      `
      <div class="badge-pending">Status: Pending Verification</div>
      <h1>Hi ${firstName},</h1>
      <p>Your registration for the legendary <a href="${origin}" style="color: #C9A84C; text-decoration: none; font-weight: 600;">IGNYT.CO</a> <strong>Summer Pool Party</strong> has been successfully received and is currently under review.</p>
      
      <div class="specs-grid">
        <div class="spec-row">
          <div class="spec-label">Ticket Choice</div>
          <div class="spec-value">${ticket}</div>
        </div>
        <div class="spec-row">
          <div class="spec-label">Venue Location</div>
          <div class="spec-value">Villa Ruhaniyat Farms by Urban Oasis near cgc, Mohali</div>
        </div>
        <div class="spec-row">
          <div class="spec-label">Date of Event</div>
          <div class="spec-value">Saturday, 13 June</div>
        </div>
        <div class="spec-row">
          <div class="spec-label">Time</div>
          <div class="spec-value">8:00 PM Onwards</div>
        </div>
        <div class="spec-row">
          <div class="spec-label">Dress Code</div>
          <div class="spec-value">All Black + Neon accessories</div>
        </div>
        <div class="spec-row">
          <div class="spec-label">Inclusions</div>
          <div class="spec-value">Complimentary food and drink included (BYOB welcome, welcome drink provided)</div>
        </div>
      </div>
      
      <h3 style="color: #C9A84C; font-weight: 500; font-size: 15px; margin-top: 24px; text-transform: uppercase; letter-spacing: 0.05em;">⚠️ Next Step: Payment Matching</h3>
      <p>Since checkout payment is validated via custom UPI receipt statement inspection, our review team will match your submitted UPI Sender Name/ID (<strong>${transactionId}</strong>) against our bank reference statements shortly.</p>
      <p>As soon as payment matches, your access ticket containing a secure check-in ID will be delivered directly to your inbox.</p>
      
      <div class="button-container">
        <a href="${origin}" class="btn" target="_blank">View Website</a>
      </div>
      `,
      origin
    );

    // 📩 Trigger Email to Organizer: New Pending Attendee Notification
    const orgSubject = `🚨 New Registration Pending: ${firstName} ${lastName}`;
    const orgBody = `Hey Organizer,\n\n` +
      `A new registrant has claimed payment for the Summer Pool Party:\n\n` +
      `👤 NAME: ${firstName} ${lastName}\n` +
      `📧 EMAIL: ${email}\n` +
      `📞 PHONE: ${phone}\n` +
      `🎟️ TICKET: ${ticket}\n` +
      `🏙️ CITY: ${city}\n` +
      `📸 INSTAGRAM: ${instagram || 'Not shared'}\n` +
      `💬 DIETARY: ${dietary}\n` +
      `⚡ HEARD FROM: ${heardFrom}\n` +
      `💳 TRANSACTION REF ID: ${newRecord.transactionId || 'Not provided'}\n` +
      `⏳ TIME: ${newRecord.timestamp}\n\n` +
      `Please check the Admin Dashboard or check the payment record against your UPI statement for ${email}'s transaction ID: ${newRecord.transactionId}.\n` +
      `Once verified, log in to the admin panel and confirm their registration.`;

    // Fire emails
    await triggerEmail(email, userSubject, userBody, userHtml);
    await triggerEmail('parthdua007@gmail.com', orgSubject, orgBody);
    await triggerEmail('ignyt@ignyt.co.in', orgSubject, orgBody);

    res.json({ success: true, registration: newRecord });
  });

  // API: Admin Fetch Registrations
  app.get('/api/admin/registrations', (req, res) => {
    const list = readRegistrations();
    res.json(list);
  });

  // API: Admin Verify Registration Status
  app.post('/api/admin/verify', async (req, res) => {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'Missing registration ID' });
    }

    const list = readRegistrations();
    const index = list.findIndex(r => r.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    list[index].status = 'Verified';
    saveRegistrations(list);

    const record = list[index];

    // Dynamic origin calculation for correct link back redirecting
    let origin = req.get('origin') || '';
    if (!origin && req.get('host')) {
      const host = req.get('host') || '';
      const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
      const protocol = isLocal ? 'http' : 'https';
      origin = `${protocol}://${host}`;
    }
    if (!origin) {
      origin = 'https://ignyt.co.in';
    }

    // 📩 Trigger Email to User: Admission Verified!
    const verifiedSubject = `🎟️ Verification Successful! Your Ticket is Confirmed! (IGNYT Co.)`;
    const verifiedBody = `Hi ${record.firstName},\n\n` +
      `EXCELLENT NEWS! Your payment has been verified by the IGNYT Co. organizers.\n\n` +
      `Your spot is officially CONFIRMED. Here is your admission ticket:\n` +
      `--------------------------------------------------\n` +
      `🎟️ ADMISSION TICKET: ${record.id}\n` +
      `👤 TICKET HOLDER: ${record.firstName} ${record.lastName}\n` +
      `⚡ TICKET TYPE: ${record.ticket}\n` +
      `📍 EVENT: Summer Pool Party\n` +
      `🗺️ VENUE: Villa Ruhaniyat Farms by Urban Oasis near cgc, Mohali\n` +
      `📅 DATE: Saturday, 13 June\n` +
      `🕗 TIME: 8:00 PM Onwards\n` +
      `👔 DRESS CODE: All Black + Neon accessories\n` +
      `🍹 INCLUSION: Complimentary food and drink included (BYOB welcome)\n` +
      `--------------------------------------------------\n\n` +
      `⚠️ Note: Please keep this email safe. Show this official Ticket ID (${record.id}) at the gate along with a valid ID (18+ Mandatory) for seamless entry.\n\n` +
      `See you soon. Let's make it a night to remember!\n\n` +
      `— IGNYT Co. Team\n` +
      `${origin}`;

    const verifiedHtml = buildHtmlEmail(
      'Admission Confirmed! — IGNYT Co.',
      'Your pool party admission ticket is ready.',
      `
      <div class="badge-verified">Status: Pass Confirmed</div>
      <h1>Congratulations ${record.firstName}!</h1>
      <p>Fantastic news! Our review team has verified your payment, and your spot at the <a href="${origin}" style="color: #C9A84C; text-decoration: none; font-weight: 600;">IGNYT.CO</a> <strong>Summer Pool Party</strong> is officially confirmed.</p>
      
      <div class="specs-grid" style="border: 2px solid #C9A84C;">
        <div class="spec-row" style="background-color: rgba(201, 168, 76, 0.05); border-bottom: 1px solid rgba(201,168,76,0.2);">
          <div class="spec-label">Official Ticket ID</div>
          <div class="spec-value" style="font-family: monospace; font-size: 16px; color: #C9A84C; letter-spacing: 0.05em; font-weight: bold; text-transform: uppercase;">${record.id}</div>
        </div>
        <div class="spec-row">
          <div class="spec-label">Ticket Holder</div>
          <div class="spec-value">${record.firstName} ${record.lastName}</div>
        </div>
        <div class="spec-row">
          <div class="spec-label">Ticket Type</div>
          <div class="spec-value">${record.ticket}</div>
        </div>
        <div class="spec-row">
          <div class="spec-label">Venue Location</div>
          <div class="spec-value">Villa Ruhaniyat Farms by Urban Oasis near cgc, Mohali</div>
        </div>
        <div class="spec-row">
          <div class="spec-label">Date of Event</div>
          <div class="spec-value">Saturday, 13 June</div>
        </div>
        <div class="spec-row">
          <div class="spec-label">Time</div>
          <div class="spec-value">8:00 PM Onwards</div>
        </div>
        <div class="spec-row">
          <div class="spec-label">Dress Code</div>
          <div class="spec-value">All Black + Neon accessories</div>
        </div>
        <div class="spec-row">
          <div class="spec-label">Inclusions</div>
          <div class="spec-value">Complimentary food and drink included (BYOB welcome, welcome drink provided)</div>
        </div>
      </div>
      
      <p>⚠️ <strong>Important Entry Note:</strong> Please keep this email accessible. You will need to present this Ticket ID (<strong>${record.id}</strong>) or this email layout at the gates alongside a physical copy/digital picture of your valid Government ID (18+ only) for seamless check-in.</p>
      <p>Prepare for incredible deep-house DJ sets, premium vibes, and a fabulous crowd.</p>
      
      <div class="button-container">
        <a href="${origin}" class="btn" target="_blank">Return to Site</a>
      </div>
      `,
      origin
    );

    await triggerEmail(record.email, verifiedSubject, verifiedBody, verifiedHtml);

    res.json({ success: true, registration: record });
  });

  // API: Admin Delete Registration
  app.delete('/api/admin/registration', (req, res) => {
    const id = (req.body?.id || req.query?.id) as string | undefined;
    if (!id) {
      return res.status(400).json({ error: 'Missing ID' });
    }

    let list = readRegistrations();
    const exists = list.some(r => r.id === id);
    if (!exists) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    list = list.filter(r => r.id !== id);
    saveRegistrations(list);
    res.json({ success: true });
  });

  // API: Contact Submission
  app.post('/api/contact', async (req, res) => {
    const { name, email, message } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Missing mandatory contact details' });
    }

    const contactSubject = `✉️ New Web Query Front IGNYT.CO: ${name}`;
    const contactBody = `Hey,\n\nYou received a new query on ignyt.co.in:\n\n` +
      `👤 NAME: ${name}\n` +
      `📧 EMAIL: ${email}\n` +
      `💬 MESSAGE:\n${message || 'No message entered.'}\n\n` +
      `Please respond promptly to retain client interest.\n`;

    await triggerEmail('ignyt@ignyt.co.in', contactSubject, contactBody);
    await triggerEmail('parthdua007@gmail.com', contactSubject, contactBody);

    res.json({ success: true });
  });

async function startServer() {
  if (process.env.VERCEL) {
    return;
  }

  // Integrate Vite for Web Rendering
  if (process.env.NODE_ENV === 'production') {
    // Serve production static assets from dist
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    // Development Mode with lazy dynamic import of vite to prevent bundling failures in Vercel
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    
    app.use(vite.middlewares);

    app.get('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (err) {
        vite.ssrFixStacktrace(err as Error);
        next(err);
      }
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`==================================================`);
    console.log(`🚀 Unified Node.js Server ready on Port ${PORT}`);
    console.log(`🌐 Live Dev Application: http://localhost:${PORT}`);
    console.log(`==================================================`);
  });
}

startServer().catch(err => {
  console.error("Fatal server error:", err);
});

// Trigger comment for clean Git sync and automatic Vercel deployment activation

