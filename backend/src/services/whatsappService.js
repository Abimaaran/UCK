const wppconnect = require('@wppconnect-team/wppconnect');

let client = null;
let qrCodeData = null;
let connectionStatus = 'DISCONNECTED';

const initialize = () => {
  if (client) return;

  connectionStatus = 'INITIALIZING';
  console.log('\n🤖 WhatsApp: Starting client initialization with WPPConnect...');

  wppconnect
    .create({
      session: 'uck-session',
      catchQR: (base64Qr, asciiQR) => {
        console.log('🤖 WhatsApp: QR Code generated. Ready for scanning.');
        connectionStatus = 'QR_READY';
        qrCodeData = base64Qr; // This is already a base64 string Data URI
      },
      statusFind: (statusSession, session) => {
        console.log('🤖 WhatsApp Status:', statusSession);
        if (statusSession === 'isLogged' || statusSession === 'inChat' || statusSession === 'successChat') {
            connectionStatus = 'CONNECTED';
            qrCodeData = null;
        }
        if (statusSession === 'notLogged' || statusSession === 'browserClose' || statusSession === 'desconnectedMobile') {
            connectionStatus = 'DISCONNECTED';
            qrCodeData = null;
        }
      },
      headless: true,
      puppeteerOptions: {
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
      connectionStatus = 'DISCONNECTED';
      qrCodeData = null;
      client = null;
    });
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

  const sendPromise = client.sendText(chatId, message);

  await Promise.race([sendPromise, timeoutPromise]);
  console.log(`✅ WhatsApp: Reminder successfully sent to ${formattedNumber}`);
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
  sendReminder,
  logout
};
