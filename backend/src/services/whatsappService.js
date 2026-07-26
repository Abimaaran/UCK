const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');

let client = null;
let qrCodeData = null;
let connectionStatus = 'DISCONNECTED';

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
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    ]
  };

  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    puppeteerOpts.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  try {
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
      qrCodeData = null;
    });

    client.on('disconnected', (reason) => {
      console.error('⚠️ WhatsApp: Client was disconnected. Reason:', reason);
      connectionStatus = 'DISCONNECTED';
      qrCodeData = null;
    });

    client.initialize().catch(err => {
      console.error('❌ WhatsApp: Initialization error:', err.message);
      connectionStatus = 'DISCONNECTED';
    });
  } catch (err) {
    console.error('❌ WhatsApp setup error:', err.message);
    connectionStatus = 'DISCONNECTED';
  }
};

const getStatus = () => connectionStatus;
const getQR = () => qrCodeData;

const sendReminder = async (phone, message) => {
  if (connectionStatus !== 'CONNECTED' || !client) {
    throw new Error('WhatsApp client is not connected');
  }

  let formattedNumber = phone.replace(/\D/g, '');
  
  // Handle Sri Lanka phone numbers (e.g. 0771234567 -> 94771234567, or 771234567 -> 94771234567)
  if (formattedNumber.startsWith('0') && formattedNumber.length === 10) {
    formattedNumber = '94' + formattedNumber.slice(1);
  } else if (formattedNumber.length === 9) {
    formattedNumber = '94' + formattedNumber;
  }
  
  const chatId = `${formattedNumber}@c.us`;
  await client.sendMessage(chatId, message);
};

const logout = async () => {
  if (client) {
    try {
      await client.logout();
    } catch (e) {
      console.error('Logout error:', e.message);
    }
  }
  connectionStatus = 'DISCONNECTED';
  qrCodeData = null;
  client = null;
};

module.exports = {
  initialize,
  getStatus,
  getQR,
  sendReminder,
  logout
};
