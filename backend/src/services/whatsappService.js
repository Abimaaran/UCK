const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

let client = null;
let qrCodeData = null; // Stores the base64 QR code image URI
let connectionStatus = 'DISCONNECTED'; // 'DISCONNECTED' | 'INITIALIZING' | 'QR_READY' | 'CONNECTED'

const initialize = () => {
  if (client) return;

  connectionStatus = 'INITIALIZING';
  console.log('\n🤖 WhatsApp: Starting client initialization...');

  const puppeteerOpts = {
    headless: true,
    protocolTimeout: 180000,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-extensions',
      '--no-zygote',
      '--single-process',
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      '--js-flags=--max-old-space-size=150'
    ]
  };

  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    puppeteerOpts.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: './.wwebjs_auth'
    }),
    puppeteer: puppeteerOpts
  });

  client.on('qr', async (qr) => {
    console.log('🤖 WhatsApp: QR Code generated. Ready for scanning.');
    connectionStatus = 'QR_READY';
    try {
      qrCodeData = await QRCode.toDataURL(qr);
    } catch (err) {
      console.error('❌ WhatsApp: QR Code generation error:', err);
    }
  });

  client.on('ready', () => {
    connectionStatus = 'CONNECTED';
    qrCodeData = null;
    console.log('🤖 WhatsApp: Connection established! Client is READY.');
  });

  client.on('authenticated', () => {
    console.log('🤖 WhatsApp: Authenticated successfully.');
  });

  client.on('auth_failure', (msg) => {
    console.error('❌ WhatsApp: Authentication failure:', msg);
    connectionStatus = 'DISCONNECTED';
  });

  client.on('disconnected', (reason) => {
    console.error('⚠️ WhatsApp: Client was disconnected. Reason:', reason);
    connectionStatus = 'DISCONNECTED';
    qrCodeData = null;
    
    // Auto-reinitialize on disconnect to get a new QR
    console.log('🤖 WhatsApp: Re-initializing client in 5 seconds...');
    setTimeout(initialize, 5000);
  });

  client.initialize().catch(err => {
    console.error('❌ WhatsApp: Initialization crash:', err.message);
    connectionStatus = 'DISCONNECTED';
  });
};

const getStatus = () => connectionStatus;
const getQR = () => qrCodeData;

const sendReminder = async (phone, message) => {
  if (connectionStatus !== 'CONNECTED' || !client) {
    throw new Error('WhatsApp client is not connected');
  }

  // Clean and format number to digits
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '94' + cleaned.substring(1);
  } else if (cleaned.length === 9) {
    cleaned = '94' + cleaned;
  }

  if (cleaned.length < 11) {
    throw new Error(`Invalid phone number format: "${phone}". Must be a valid Sri Lankan mobile number.`);
  }

  console.log(`🤖 WhatsApp: Verifying WhatsApp registration for ${cleaned}...`);
  const numberId = await client.getNumberId(cleaned);
  
  if (!numberId) {
    throw new Error(`The phone number ${phone} (${cleaned}) is not registered on WhatsApp.`);
  }

  const formatted = numberId._serialized;
  console.log(`🤖 WhatsApp: Sending message to registered ID: ${formatted}...`);
  await client.sendMessage(formatted, message);
  console.log(`🤖 WhatsApp: Message sent successfully to ${formatted}`);
};

const logout = async () => {
  console.log('🤖 WhatsApp: Force logging out active session...');
  
  if (client) {
    try {
      await client.destroy();
    } catch (e) {
      console.error('🤖 WhatsApp: Error destroying client:', e.message);
    }
    client = null;
  }

  connectionStatus = 'DISCONNECTED';
  qrCodeData = null;

  try {
    const sessionPath = path.join(process.cwd(), '.wwebjs_auth');
    if (fs.existsSync(sessionPath)) {
      console.log('🤖 WhatsApp: Deleting session directory:', sessionPath);
      fs.rmSync(sessionPath, { recursive: true, force: true });
      console.log('🤖 WhatsApp: Session directory deleted successfully.');
    }
  } catch (err) {
    console.error('❌ WhatsApp: Failed to delete session directory:', err.message);
  }

  // Reinitialize clean client
  initialize();
};

module.exports = {
  initialize,
  getStatus,
  getQR,
  sendReminder,
  logout
};
