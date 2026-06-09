import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REGISTRATIONS_FILE = path.resolve(__dirname, 'registrations.json');

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
}

// Ensure registrations JSON file exists
if (!fs.existsSync(REGISTRATIONS_FILE)) {
  fs.writeFileSync(REGISTRATIONS_FILE, JSON.stringify([], null, 2));
}

// Helper to read registrations
function readRegistrations(): Registration[] {
  try {
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
  
  const logFile = path.resolve(__dirname, 'sent_emails.log');
  fs.appendFileSync(logFile, logMsg, 'utf-8');
}

// Send Email core router
async function triggerEmail(to: string, subject: string, body: string) {
  const transporter = getTransporter();
  const fromEmail = process.env.SMTP_USER || "ignyt@ignyt.co.in";

  if (!transporter) {
    logEmailLocal(to, subject, body);
    return false;
  }

  try {
    await transporter.sendMail({
      from: `"IGNYT.CO" <${fromEmail}>`,
      to,
      subject,
      text: body,
      html: body.replace(/\n/g, '<br>')
    });
    console.log(`✅ Email sent successfully to ${to}`);
    return true;
  } catch (err) {
    console.error(`❌ Failed to send email to ${to}:`, err);
    // Log locally as well
    logEmailLocal(to, subject, body);
    return false;
  }
}

const app = express();
app.use(express.json());

export { app };

async function startServer() {
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
      ticket
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
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    };

    const currentList = readRegistrations();
    currentList.push(newRecord);
    saveRegistrations(currentList);

    // 📩 Trigger Email to User: Pending Verification
    const userSubject = `Registration Received — Summer Pool Party 🏊‍♂️ (IGNYT.CO)`;
    const userBody = `Hi ${firstName},\n\n` +
      `Your registration for the IGNYT.CO Summer Pool Party has been successfully submitted!\n\n` +
      `🎟️ TICKET DETAIL: ${ticket}\n` +
      `📍 VENUE: Villa Ruhaniyat Farms by Urban Oasis near cgc, Mohali\n` +
      `📅 DATE: 13 June\n` +
      `🕗 TIME: 8:00 PM — 2:00 AM\n` +
      `👔 DRESS CODE: All Black + Neon accessories\n` +
      `🍹 DRINKS & SNACKS: BYOB (1-2 welcome drinks and premium meals are included)\n\n` +
      `⚠️ IMPORTANT: NEXT STEPS\n` +
      `--------------------------------------------------\n` +
      `Since payments are handled via UPI, your ticket remains PENDING VERIFICATION.\n` +
      `Please make sure you have scanned our UPI QR and uploaded your screenshot proof using this Google Form:\n` +
      `https://docs.google.com/forms/d/e/1FAIpQLSexh4WDQR8D_hzRUELWFsGZnvMqwOkHCtb_sy269s7bk1LIug/viewform\n\n` +
      `Owner parthdua007@gmail.com and our review team (ignyt@ignyt.co.in) will verify your submission.\n` +
      `Once payment is confirmed, we will send you your official check-in ticket immediately.\n\n` +
      `See you soon!\n` +
      `— IGNYT Co. Team\n` +
      `ignyt.co.in`;

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
      `⏳ TIME: ${newRecord.timestamp}\n\n` +
      `Please check the Google Form sheets for ${email}'s uploaded screenshot of payment, verify the receipt, and log into the app admin panel to mark them as verified.`;

    // Fire emails
    await triggerEmail(email, userSubject, userBody);
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

    // 📩 Trigger Email to User: Admission Verified!
    const verifiedSubject = `🎟️ Verification Successful! Your Ticket is Confirmed! (IGNYT.CO)`;
    const verifiedBody = `Hi ${record.firstName},\n\n` +
      `EXCELLENT NEWS! Your payment screenshot has been verified by the IGNYT Co. organizers.\n\n` +
      `Your spot is officially CONFIRMED. Here is your admission ticket:\n` +
      `--------------------------------------------------\n` +
      `🎟️ ADMISSION TICKET: ${record.id}\n` +
      `👤 TICKET HOLDER: ${record.firstName} ${record.lastName}\n` +
      `⚡ TICKET TYPE: ${record.ticket}\n` +
      `📍 EVENT: Summer Pool Party\n` +
      `🗺️ VENUE: Villa Ruhaniyat Farms by Urban Oasis near cgc, Mohali\n` +
      `📅 DATE: Saturday, 13 June\n` +
      `🕗 TIME: 8:00 PM — 2:00 AM\n` +
      `👔 DRESS CODE: All Black + Neon accessories\n` +
      `--------------------------------------------------\n\n` +
      `⚠️ Note: Please keep this email safe. Show this official Ticket ID (${record.id}) at the gate along with a valid ID (18+ Mandatory) for seamless entry.\n\n` +
      `See you soon. Let's make it a night to remember!\n\n` +
      `— IGNYT Co. Team\n` +
      `ignyt.co.in`;

    await triggerEmail(record.email, verifiedSubject, verifiedBody);

    res.json({ success: true, registration: record });
  });

  // API: Admin Delete Registration
  app.delete('/api/admin/registration', (req, res) => {
    const { id } = req.body;
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
    // Development Mode
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
