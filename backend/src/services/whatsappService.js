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

  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: './.wwebjs_auth'
    }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    }
  });

  client.on('qr', async (qr) => {
    console.log('🤖 WhatsApp: QR Code generated. Ready for scanning.');
    connectionStatus = 'QR_READY';
    try {
      // Generate QR code data URL (PNG format)
      qrCodeData = await QRCode.toDataURL(qr);
    } catch (err) {
      console.error('❌ WhatsApp: QR Code generation error:', err);
    }
  });

  client.on('ready', () => {
    console.log('🤖 WhatsApp: Connection established! Client is READY.');
    connectionStatus = 'CONNECTED';
    qrCodeData = null;
  });

  client.on('authenticated', () => {
    console.log('🤖 WhatsApp: Authenticated successfully.');
  });

  client.on('auth_failure', (msg) => {
    console.error('❌ WhatsApp: Authentication failed:', msg);
    connectionStatus = 'DISCONNECTED';
    qrCodeData = null;
  });

  client.on('disconnected', (reason) => {
    console.warn('⚠️ WhatsApp: Client was disconnected. Reason:', reason);
    connectionStatus = 'DISCONNECTED';
    qrCodeData = null;
    try {
      client.destroy();
    } catch (e) {
      // ignore
    }
    client = null;
    // Auto-retry initialization after 5 seconds
    setTimeout(initialize, 5000);
  });

  client.initialize().catch(err => {
    console.error('❌ WhatsApp: Initialization crash:', err.message);
    connectionStatus = 'DISCONNECTED';
  });
};

const getStatus = () => connectionStatus;
const getQR = () => qrCodeData;

/**
 * Sanitizes and formats phone numbers to WhatsApp API format (+94 xxx xxx xxx -> 94xxxxxxxxxx@c.us)
 */
const formatNumber = (phone) => {
  if (!phone) return null;
  
  // Remove all non-numeric characters
  let cleaned = phone.replace(/[^0-9]/g, '');

  // Sri Lanka: Replace leading 0 with 94 (e.g. 0771234567 -> 94771234567)
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '94' + cleaned.substring(1);
  }
  // Sri Lanka: Prepend 94 if number is 9 digits (e.g. 771234567 -> 94771234567)
  else if (cleaned.length === 9) {
    cleaned = '94' + cleaned;
  }

  // Final validation (Sri Lankan mobile numbers have 11 digits when formatted with 94)
  if (cleaned.length >= 11) {
    return `${cleaned}@c.us`;
  }
  return null;
};

const sendReminder = async (phone, message) => {
  if (connectionStatus !== 'CONNECTED' || !client) {
    throw new Error('WhatsApp client is not connected');
  }

  const formatted = formatNumber(phone);
  if (!formatted) {
    throw new Error(`Invalid phone number format: "${phone}". Must be a valid Sri Lankan mobile number.`);
  }

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
