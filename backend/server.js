require('dotenv').config();
const { admin } = require('./src/config/firebaseAdmin');

console.log("\n" + "=".repeat(40));
console.log("🚀 SCK BACKEND SYSTEM STARTUP");
console.log("=".repeat(40));

// 1. Firebase Initialization Verification
if (admin.apps.length > 0) {
  console.log("✅ DATABASE: Firebase Connection Successful");
} else {
  console.error("❌ DATABASE: Connection Failed!");
  process.exit(1);
}

const app = require('./app');
const PORT = process.env.PORT || 5000;

// 2. Server Performance & Port Binding
const server = app.listen(PORT, () => {
  console.log(`✅ NETWORK: Server listening on PORT ${PORT}`);
  console.log(`✅ STATUS: System Online (http://localhost:${PORT})`);
  console.log("=".repeat(40) + "\n");
});

// Explicitly handle server startup errors (like Port in Use)
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error("\n" + "!".repeat(50));
    console.error(`🔴 CRITICAL ERROR: PORT ${PORT} IS ALREADY IN USE`);
    console.error(`   Message: Another project or server is already using port ${PORT}.`);
    console.error(`   Fix: Please stop the other server or change the PORT in your .env file.`);
    console.error("!".repeat(50) + "\n");
  } else {
    console.error("\n🔴 SERVER ERROR:", err.message);
  }
  process.exit(1);
});

// 3. Global Crash Monitoring
process.on('uncaughtException', (err) => {
  console.error("\n" + "🔥".repeat(25));
  console.error("CRITICAL CRASH: Uncaught Exception Detected");
  console.error("- Error Name:", err.name);
  console.error("- Error Msg: ", err.message);
  console.error("- Stack Trace:\n", err.stack);
  console.error("🔥".repeat(25) + "\n");
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error("\n" + "📛".repeat(25));
  console.error("CRITICAL CRASH: Unhandled Mission Rejection");
  console.error("- Reason:", reason);
  console.error("📛".repeat(25) + "\n");
  process.exit(1);
});
