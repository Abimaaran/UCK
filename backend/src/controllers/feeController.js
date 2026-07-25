const { db } = require('../config/firebaseAdmin');
const collectionName = 'fees';

exports.getAll = async (req, res) => {
  try {
    const snapshot = await db.collection(collectionName).get();
    res.status(200).json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getByStudent = async (req, res) => {
  try {
    const snapshot = await db.collection(collectionName).where('studentId', '==', req.params.studentId).get();
    res.status(200).json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const docRef = await db.collection(collectionName).add(req.body);
    res.status(201).json({ id: docRef.id, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { month, status } = req.body;

    const snapshot = await db.collection(collectionName)
      .where('studentId', '==', studentId)
      .where('month', '==', month)
      .get();

    if (snapshot.empty) {
      const docRef = await db.collection(collectionName).add({ studentId, month, status });
      return res.status(201).json({ id: docRef.id, studentId, month, status });
    }

    const docId = snapshot.docs[0].id;
    await db.collection(collectionName).doc(docId).update({ status });
    res.status(200).json({ id: docId, studentId, month, status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const whatsappService = require('../services/whatsappService');

const getMonthName = (monthStr) => {
  try {
    const [year, month] = monthStr.split('-');
    const date = new Date(year, parseInt(month) - 1, 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  } catch (e) {
    return monthStr;
  }
};

// Internal function to process sending reminders in the background
const processRemindersInBackground = async (unpaidStudents, month, runType = 'Manual') => {
  console.log(`\n🤖 WhatsApp: Starting background reminders for ${unpaidStudents.length} students for month ${month} (${runType})`);
  const monthName = getMonthName(month);
  
  let successCount = 0;
  let failCount = 0;
  const successList = [];
  const failList = [];
  let logId = null;

  try {
    const logRef = await db.collection('reminderLogs').add({
      month,
      status: 'PROCESSING',
      totalRecipients: unpaidStudents.length,
      successCount: 0,
      failCount: 0,
      successList: [],
      failList: [],
      startedAt: new Date().toISOString(),
      runType
    });
    logId = logRef.id;
  } catch (logErr) {
    console.error('⚠️ WhatsApp Log: Failed to create initial reminder run log:', logErr.message);
  }

  // Wait 15 seconds to ensure WhatsApp Web is fully synchronized and idle
  console.log('🤖 WhatsApp: Waiting 15s for client warmup/sync...');
  await new Promise(resolve => setTimeout(resolve, 15000));
  
  for (let i = 0; i < unpaidStudents.length; i++) {
    const student = unpaidStudents[i];
    const phone = student.phoneNumber || student.phone || student.whatsappNo;
    const name = student.studentName || student.name || 'Student';
    const studentId = student.studentId || 'N/A';

    if (!phone) {
      const errorMsg = 'No phone number configured';
      console.log(`⚠️ WhatsApp: Skipping ${name} - ${errorMsg}`);
      failCount++;
      failList.push({ studentId, name, phone: 'N/A', error: errorMsg });
      
      if (logId) {
        try {
          await db.collection('reminderLogs').doc(logId).update({ failCount, failList });
        } catch (e) {}
      }
      continue;
    }

    const message = `Hi ${name}, this is a friendly reminder from UCK Chess Academy to pay the fees for ${monthName}. Please ignore if already paid. Thank you!`;

    try {
      // Add a 10-second delay between messages to avoid WhatsApp spam filters (except for the first one)
      if (i > 0) {
        const delay = 10000 + Math.random() * 3000; // 10-13 seconds random delay
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      await whatsappService.sendReminder(phone, message);
      console.log(`✅ WhatsApp: Reminder sent to ${name} (${phone})`);
      successCount++;
      successList.push({ studentId, name, phone });
    } catch (err) {
      console.error(`❌ WhatsApp: Failed to send reminder to ${name} (${phone}):`, err.message);
      failCount++;
      failList.push({ studentId, name, phone, error: err.message });
    }

    // Update progress in database in real time
    if (logId) {
      try {
        await db.collection('reminderLogs').doc(logId).update({
          successCount,
          failCount,
          successList,
          failList
        });
      } catch (dbErr) {
        console.error('⚠️ WhatsApp Log: Progress update failed:', dbErr.message);
      }
    }
  }

  // Finalize log
  if (logId) {
    try {
      await db.collection('reminderLogs').doc(logId).update({
        status: 'COMPLETED',
        successCount,
        failCount,
        successList,
        failList,
        finishedAt: new Date().toISOString()
      });
    } catch (dbErr) {
      console.error('⚠️ WhatsApp Log: Final log update failed:', dbErr.message);
    }
  }

  console.log('🤖 WhatsApp: Background reminders processing finished.\n');
};

// Handler for manual admin trigger via dashboard (Protected by verifyAdmin)
exports.sendWhatsAppReminders = async (req, res) => {
  try {
    const { month } = req.body;
    if (!month) {
      return res.status(400).json({ error: 'Month parameter (YYYY-MM) is required' });
    }

    if (whatsappService.getStatus() !== 'CONNECTED') {
      return res.status(400).json({ error: 'WhatsApp client is not connected. Please scan the QR code first.' });
    }

    // 1. Fetch all approved/active students
    const studentsSnapshot = await db.collection('students').get();
    const approvedStudents = studentsSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(s => {
        const status = (s.status || 'Pending').toLowerCase();
        return (status === 'approved' || status === 'active') && !s.isPaused;
      });

    // 2. Fetch all paid fee records for this month
    const feesSnapshot = await db.collection(collectionName)
      .where('month', '==', month)
      .where('status', '==', 'Paid')
      .get();
    
    const paidStudentIds = new Set(feesSnapshot.docs.map(doc => doc.data().studentId));

    // 3. Filter for unpaid students
    const unpaidStudents = approvedStudents.filter(s => !paidStudentIds.has(s.studentId));

    if (unpaidStudents.length === 0) {
      return res.status(200).json({ success: true, message: 'All approved students have paid their fees for this month!', count: 0 });
    }

    // 4. Start processing in background to avoid API timeout
    processRemindersInBackground(unpaidStudents, month, 'Manual');

    res.status(200).json({
      success: true,
      message: `Reminders started in background for ${unpaidStudents.length} unpaid students.`,
      count: unpaidStudents.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Handler for Cron job trigger (Protected by x-api-key)
exports.cronSendWhatsAppReminders = async (req, res) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  const cronSecret = process.env.CRON_SECRET_KEY || 'uck_cron_secret_token_2025';

  if (!apiKey || apiKey !== cronSecret) {
    return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
  }

  try {
    const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"

    if (whatsappService.getStatus() !== 'CONNECTED') {
      console.error('❌ WhatsApp Cron: Aborted because WhatsApp client is not connected.');
      return res.status(503).json({ error: 'WhatsApp client is not connected' });
    }

    // 1. Fetch all approved/active students
    const studentsSnapshot = await db.collection('students').get();
    const approvedStudents = studentsSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(s => {
        const status = (s.status || 'Pending').toLowerCase();
        return (status === 'approved' || status === 'active') && !s.isPaused;
      });

    // 2. Fetch all paid fee records for this month
    const feesSnapshot = await db.collection(collectionName)
      .where('month', '==', currentMonth)
      .where('status', '==', 'Paid')
      .get();
    
    const paidStudentIds = new Set(feesSnapshot.docs.map(doc => doc.data().studentId));

    // 3. Filter for unpaid students
    const unpaidStudents = approvedStudents.filter(s => !paidStudentIds.has(s.studentId));

    if (unpaidStudents.length === 0) {
      return res.status(200).json({ success: true, message: 'All approved students have paid their fees.', count: 0 });
    }

    // 4. Start processing in background
    processRemindersInBackground(unpaidStudents, currentMonth, 'Cron');

    res.status(200).json({
      success: true,
      message: `Cron trigger successful. Reminders started in background for ${unpaidStudents.length} unpaid students.`,
      count: unpaidStudents.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET the latest reminder process logs/status for a month
exports.getReminderStatus = async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) {
      return res.status(400).json({ error: 'Month parameter YYYY-MM is required' });
    }

    const snapshot = await db.collection('reminderLogs')
      .where('month', '==', month)
      .get();
      
    if (snapshot.empty) {
      return res.status(200).json(null);
    }
    
    const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Sort in-memory to find the latest log by startedAt
    logs.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
    
    res.status(200).json(logs[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

