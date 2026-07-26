const supabase = require('../config/supabaseClient');
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

exports.getAll = async (req, res) => {
  try {
    const { data, error } = await supabase.from('fees').select('*');
    if (error) throw error;
    
    const formatted = (data || []).map(f => ({
      id: f.id,
      studentId: f.student_id,
      month: f.month,
      status: f.status,
      createdAt: f.created_at
    }));

    res.status(200).json(formatted);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { data, error } = await supabase.from('fees').select('*').eq('student_id', studentId);
    if (error) throw error;

    const formatted = (data || []).map(f => ({
      id: f.id,
      studentId: f.student_id,
      month: f.month,
      status: f.status,
      createdAt: f.created_at
    }));

    res.status(200).json(formatted);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.create = async (req, res) => {
  try {
    const { studentId, month, status } = req.body;
    const { data, error } = await supabase.from('fees').insert([{ student_id: studentId, month, status }]).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.update = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { month, status } = req.body;

    const { data: existing } = await supabase
      .from('fees')
      .select('*')
      .eq('student_id', studentId)
      .eq('month', month)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabase
        .from('fees')
        .update({ status })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    } else {
      const { data, error } = await supabase
        .from('fees')
        .insert([{ student_id: studentId, month, status }])
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }
  } catch (error) { res.status(500).json({ error: error.message }); }
};

const processRemindersInBackground = async (unpaidStudents, month, runType = 'Manual') => {
  console.log(`\n🤖 WhatsApp: Starting background reminders for ${unpaidStudents.length} students for month ${month} (${runType})`);
  let successCount = 0;
  let failCount = 0;
  const successList = [];
  const failList = [];
  let logId = null;

  try {
    const { data: logRef } = await supabase.from('reminder_logs').insert([{
      month,
      status: 'PROCESSING',
      total_recipients: unpaidStudents.length,
      success_count: 0,
      fail_count: 0,
      success_list: [],
      fail_list: [],
      run_type: runType
    }]).select().single();

    if (logRef) logId = logRef.id;
  } catch (logErr) {
    console.error('⚠️ WhatsApp Log: Failed to create initial run log:', logErr.message);
  }

  for (let i = 0; i < unpaidStudents.length; i++) {
    const student = unpaidStudents[i];
    const phone = student.phone_number || student.phone;
    const name = student.student_name || student.name || 'Student';
    const studentId = student.student_id || 'N/A';

    if (!phone) {
      failCount++;
      failList.push({ studentId, name, phone: 'N/A', error: 'No phone number' });
      continue;
    }

    try {
      if (i > 0) {
        // Random safe delay between 12 to 16 seconds to prevent WhatsApp spam block
        const safeDelay = Math.floor(Math.random() * 4000) + 12000;
        await new Promise(resolve => setTimeout(resolve, safeDelay));
      }
      const formattedMonth = getMonthName(month);
      const reminderMsg = `♟️ *UCK Chess Academy*\n\nDear Parent/Student *${name}*,\nThis is a gentle reminder regarding the academy fee for *${formattedMonth}*.\n\n_Please ignore this message if you have already paid._\n\nThank you!\n*UCK Chess Academy Management*`;
      await whatsappService.sendReminder(phone, reminderMsg);
      successCount++;
      successList.push({ studentId, name, phone });
    } catch (err) {
      failCount++;
      failList.push({ studentId, name, phone, error: err.message });
    }

    if (logId) {
      await supabase.from('reminder_logs').update({
        success_count: successCount,
        fail_count: failCount,
        success_list: successList,
        fail_list: failList
      }).eq('id', logId);
    }
  }

  if (logId) {
    await supabase.from('reminder_logs').update({
      status: 'COMPLETED',
      finished_at: new Date().toISOString()
    }).eq('id', logId);
  }
};

exports.sendWhatsAppReminders = async (req, res) => {
  try {
    const { month } = req.body;
    if (!month) return res.status(400).json({ error: 'Month parameter is required' });

    const { data: approvedStudents } = await supabase.from('students').select('*').eq('status', 'Approved').eq('is_paused', false);
    const { data: paidFees } = await supabase.from('fees').select('student_id').eq('month', month).eq('status', 'Paid');

    const paidSet = new Set((paidFees || []).map(f => f.student_id));
    const unpaidStudents = (approvedStudents || []).filter(s => !paidSet.has(s.student_id));

    if (unpaidStudents.length === 0) {
      return res.status(200).json({ success: true, message: 'All approved students have paid!', count: 0 });
    }

    processRemindersInBackground(unpaidStudents, month, 'Manual');
    res.status(200).json({ success: true, message: `Reminders started for ${unpaidStudents.length} students.`, count: unpaidStudents.length });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.cronSendWhatsAppReminders = async (req, res) => {
  res.status(200).json({ message: 'Cron job endpoint' });
};

exports.getReminderStatus = async (req, res) => {
  try {
    const { month } = req.query;
    const { data, error } = await supabase
      .from('reminder_logs')
      .select('*')
      .eq('month', month)
      .order('started_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) return res.status(200).json(null);
    res.status(200).json(data[0]);
  } catch (error) { res.status(500).json({ error: error.message }); }
};
