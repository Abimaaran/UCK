const wppconnect = require('@wppconnect-team/wppconnect');
const QRCode = require('qrcode');

let client = null;
let qrCodeData = null;
let connectionStatus = 'DISCONNECTED';
let initTimeout = null;
let lastError = null;

const initialize = (force = false) => {
  if (client && !force) return;

  if (force) {
    client = null;
    qrCodeData = null;
    lastError = null;
  }

  connectionStatus = 'INITIALIZING';
  lastError = null;
  console.log('\n🤖 WhatsApp: Starting client initialization with WPPConnect...');

  if (initTimeout) clearTimeout(initTimeout);
  initTimeout = setTimeout(() => {
    if (connectionStatus === 'INITIALIZING') {
      console.warn('⚠️ WhatsApp initialization timed out after 30s. Resetting status to DISCONNECTED.');
      connectionStatus = 'DISCONNECTED';
      lastError = 'Initialization timed out (30s). Please click Connect again.';
      client = null;
      qrCodeData = null;
    }
  }, 30000);

  wppconnect
    .create({
      session: 'uck-session',
      logQR: false,
      catchQR: async (base64Qr, asciiQR, attempts, urlCode) => {
        console.log('🤖 WhatsApp: QR Code generated. Ready for scanning. Attempt:', attempts);
        connectionStatus = 'QR_READY';
        lastError = null;
        if (base64Qr && base64Qr.length > 50) {
          qrCodeData = base64Qr.startsWith('data:') ? base64Qr : `data:image/png;base64,${base64Qr}`;
        } else if (urlCode || asciiQR) {
          try {
            qrCodeData = await QRCode.toDataURL(urlCode || asciiQR);
          } catch (err) {
            console.error('QRCode conversion error:', err);
          }
        }
      },
      statusFind: (statusSession, session) => {
        console.log('🤖 WhatsApp Status:', statusSession);
        if (statusSession === 'isLogged' || statusSession === 'inChat' || statusSession === 'successChat') {
            connectionStatus = 'CONNECTED';
            qrCodeData = null;
            lastError = null;
        }
        if (statusSession === 'notLogged' || statusSession === 'browserClose' || statusSession === 'desconnectedMobile' || statusSession === 'autocloseCalled') {
            connectionStatus = 'DISCONNECTED';
            qrCodeData = null;
        }
      },
      headless: true,
      autoClose: 0,
      puppeteerOptions: {
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        userDataDir: './.wppconnect_auth',
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
      }
    })
    .then((createdClient) => {
      client = createdClient;
      connectionStatus = 'CONNECTED';
      qrCodeData = null;
      lastError = null;
      console.log('🤖 WhatsApp: Connection established! WPPConnect is READY.');
      
      createdClient.onStateChange((state) => {
        console.log('🤖 WhatsApp State Change:', state);
        if (state === 'CONNECTED') {
           connectionStatus = 'CONNECTED';
        } else if (state === 'CONFLICT' || state === 'UNPAIRED' || state === 'UNLAUNCHED') {
           connectionStatus = 'DISCONNECTED';
           qrCodeData = null;
        }
      });
    })
    .catch((error) => {
      console.error('❌ WhatsApp setup error:', error.message);
      lastError = error.message;
      connectionStatus = 'DISCONNECTED';
      qrCodeData = null;
      client = null;
    });
};

const getStatus = () => connectionStatus;
const getQR = () => qrCodeData;
const getError = () => lastError;

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

  const sendPromise = async () => {
    try {
      console.log(`🤖 WhatsApp: Attempting to send message to ${chatId}...`);
      const result = await client.sendText(chatId, message);
      console.log(`✅ WhatsApp: WPPConnect sendText result for ${chatId}:`, result.id || 'Success');
      return result;
    } catch (sendErr) {
      console.error(`❌ WhatsApp: WPPConnect sendText failed for ${chatId}:`, sendErr);
      throw sendErr;
    }
  };

  await Promise.race([sendPromise(), timeoutPromise]);
};

const logout = async () => {
  if (client) {
    try {
      const logoutPromise = client.logout();
      const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 10000));
      await Promise.race([logoutPromise, timeoutPromise]);
      await client.close(); // Also close the browser instance
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
  getError,
  sendReminder,
  logout
};
