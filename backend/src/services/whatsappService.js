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
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-site-isolation-trials',
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
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
      webVersionCache: {
        type: 'none'
      },
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
  
  // 30-second timeout to prevent infinite hanging
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('WhatsApp message dispatch timed out (30s)')), 30000);
  });

  // Direct send — skip getNumberId() which triggers detached frame errors
  const sendPromise = client.sendMessage(chatId, message);

  await Promise.race([sendPromise, timeoutPromise]);
  console.log(`✅ WhatsApp: Reminder successfully sent to ${formattedNumber}`);
};

const logout = async () => {
  if (client) {
    try {
      // Use destroy() instead of logout() - logout() hangs on detached frames
      const destroyPromise = client.destroy();
      const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 10000));
      await Promise.race([destroyPromise, timeoutPromise]);
      console.log('🤖 WhatsApp: Session destroyed successfully.');
    } catch (e) {
      console.error('Logout/destroy error:', e.message);
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
