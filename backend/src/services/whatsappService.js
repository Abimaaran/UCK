let connectionStatus = 'DISCONNECTED';
let qrCodeData = null;

const initialize = () => {
  console.log('🤖 WhatsApp: Service running in safe mode.');
};

const getStatus = () => connectionStatus;
const getQR = () => qrCodeData;

const sendReminder = async (phone, message) => {
  throw new Error('WhatsApp reminder service is currently offline on cloud hosting.');
};

const logout = async () => {
  connectionStatus = 'DISCONNECTED';
  qrCodeData = null;
};

module.exports = {
  initialize,
  getStatus,
  getQR,
  sendReminder,
  logout
};
