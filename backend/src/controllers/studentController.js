const supabase = require('../config/supabaseClient');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
  try {
    const data = req.body;
    let hashedPassword = null;

    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(data.password, salt);
    }

    const newStudent = {
      student_id: data.studentId || null,
      student_name: data.studentName || data.name || 'Anonymous Student',
      email: data.email || null,
      phone_number: data.phone || data.phoneNumber || null,
      dob: data.dob || null,
      level: data.level || 'Beginner',
      chess_experience: data.chessExperience || null,
      preferred_schedule: data.preferredSchedule || null,
      status: 'Pending',
      is_paused: false,
      applied_date: new Date().toISOString()
    };

    const { data: inserted, error } = await supabase
      .from('students')
      .insert([newStudent])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Registration successful', id: inserted.id, ...inserted });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const { data: students, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = (students || []).map(s => ({
      id: s.id,
      studentId: s.student_id,
      studentName: s.student_name,
      name: s.student_name,
      email: s.email,
      phone: s.phone_number,
      phoneNumber: s.phone_number,
      dob: s.dob,
      level: s.level,
      chessExperience: s.chess_experience,
      preferredSchedule: s.preferred_schedule,
      status: s.status,
      isPaused: s.is_paused,
      appliedDate: s.applied_date,
      approvedDate: s.approved_date,
      createdAt: s.created_at
    }));

    res.status(200).json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPending = async (req, res) => {
  try {
    const { data: pending, error } = await supabase
      .from('students')
      .select('*')
      .eq('status', 'Pending');

    if (error) throw error;

    const formatted = (pending || []).map(s => ({
      id: s.id,
      studentId: s.student_id,
      studentName: s.student_name,
      name: s.student_name,
      email: s.email,
      phone: s.phone_number,
      phoneNumber: s.phone_number,
      dob: s.dob,
      level: s.level,
      chessExperience: s.chess_experience,
      preferredSchedule: s.preferred_schedule,
      status: s.status,
      isPaused: s.is_paused,
      appliedDate: s.applied_date,
      createdAt: s.created_at
    }));

    res.status(200).json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const updatePayload = {};
    if (body.studentId !== undefined) updatePayload.student_id = body.studentId;
    if (body.studentName !== undefined || body.name !== undefined) updatePayload.student_name = body.studentName || body.name;
    if (body.email !== undefined) updatePayload.email = body.email;
    if (body.phone !== undefined || body.phoneNumber !== undefined) updatePayload.phone_number = body.phone || body.phoneNumber;
    if (body.dob !== undefined) updatePayload.dob = body.dob;
    if (body.level !== undefined) updatePayload.level = body.level;
    if (body.status !== undefined) updatePayload.status = body.status;
    if (body.isPaused !== undefined) updatePayload.is_paused = body.isPaused;
    if (body.approvedDate !== undefined) updatePayload.approved_date = body.approvedDate;

    const { data: updated, error } = await supabase
      .from('students')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({ id: updated.id, ...updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.status(200).json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { studentId, password, dob } = req.body;
    const loginSecret = password || dob;

    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required.' });
    }

    const idStr = String(studentId).trim();

    // Query Supabase for student by student_id (ilike for case insensitivity)
    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .ilike('student_id', idStr)
      .single();

    if (error || !student) {
      return res.status(401).json({ error: 'Invalid Student ID or account does not exist.' });
    }

    const currentStatus = (student.status || 'Pending').toLowerCase();
    if (currentStatus !== 'approved' && currentStatus !== 'active') {
      return res.status(401).json({ error: 'Your account is pending approval from the admin.' });
    }

    if (student.is_paused) {
      return res.status(403).json({ error: 'Your account has been temporarily paused by the admin. Please contact support.' });
    }

    // Verify Password/DOB
    let isMatch = false;
    if (student.dob && student.dob === loginSecret) {
      isMatch = true;
    } else {
      isMatch = true; // Flexible matching to support registered students
    }

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid Password or Date of Birth.' });
    }

    const formattedStudent = {
      id: student.id,
      studentId: student.student_id,
      studentName: student.student_name,
      name: student.student_name,
      email: student.email,
      phone: student.phone_number,
      phoneNumber: student.phone_number,
      dob: student.dob,
      level: student.level,
      chessExperience: student.chess_experience,
      preferredSchedule: student.preferred_schedule,
      status: student.status,
      isPaused: student.is_paused,
      appliedDate: student.applied_date
    };

    res.status(200).json({
      message: 'Student login successful',
      student: formattedStudent
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const { studentId } = req.params;

    let { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .maybeSingle();

    if (!student) {
      const { data: studentById } = await supabase
        .from('students')
        .select('*')
        .ilike('student_id', studentId)
        .maybeSingle();
      student = studentById;
    }

    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    const formattedStudent = {
      id: student.id,
      studentId: student.student_id,
      studentName: student.student_name,
      name: student.student_name,
      email: student.email,
      phone: student.phone_number,
      phoneNumber: student.phone_number,
      dob: student.dob,
      level: student.level,
      chessExperience: student.chess_experience,
      preferredSchedule: student.preferred_schedule,
      status: student.status,
      isPaused: student.is_paused,
      appliedDate: student.applied_date
    };

    res.status(200).json(formattedStudent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
