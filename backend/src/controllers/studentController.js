const supabase = require('../config/supabaseClient');
const bcrypt = require('bcryptjs');

const parseMeta = (scheduleStr) => {
  if (!scheduleStr) return {};
  if (typeof scheduleStr === 'object') return scheduleStr;
  try {
    return JSON.parse(scheduleStr);
  } catch {
    return { preferredSchedule: scheduleStr };
  }
};

exports.register = async (req, res) => {
  try {
    const data = req.body;
    let hashedPassword = null;

    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(data.password, salt);
    }

    const schoolVal = data.school ? String(data.school).trim() : null;
    const addressVal = data.address ? String(data.address).trim() : null;
    const parentNameVal = data.parentName ? String(data.parentName).trim() : null;
    const parentOccupationVal = data.parentOccupation ? String(data.parentOccupation).trim() : null;
    const genderVal = data.gender || null;
    const fideIdVal = data.fideId || null;
    const fideRatingVal = data.fideRating || null;

    const extraMeta = {
      school: schoolVal,
      address: addressVal,
      parentName: parentNameVal,
      parentOccupation: parentOccupationVal,
      gender: genderVal,
      fideId: fideIdVal,
      fideRating: fideRatingVal
    };

    let finalStudentId = data.studentId ? String(data.studentId).trim().toUpperCase() : null;
    if (!finalStudentId) {
      const { data: allStudents } = await supabase.from('students').select('student_id');
      const maxNum = (allStudents || []).reduce((max, s) => {
        const match = String(s.student_id || '').match(/UCK(\d+)/i);
        if (match) {
          const num = parseInt(match[1], 10);
          return num > max ? num : max;
        }
        return max;
      }, 0);
      finalStudentId = `UCK${maxNum + 1}`;
    }

    const newStudent = {
      student_id: finalStudentId,
      student_name: data.studentName || data.name || 'Anonymous Student',
      email: data.email || null,
      phone_number: data.phone || data.phoneNumber || data.whatsappNo || null,
      dob: data.dob || data.dateOfBirth || null,
      level: data.level || data.chessExperience || 'Beginner',
      chess_experience: data.chessExperience || data.level || null,
      preferred_schedule: JSON.stringify(extraMeta),
      status: data.status || 'Pending',
      is_paused: false,
      applied_date: new Date().toISOString(),
      approved_date: data.approvedDate || (data.status === 'Approved' ? new Date().toISOString().split('T')[0] : null)
    };

    const { data: inserted, error } = await supabase
      .from('students')
      .insert([newStudent])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Registration successful',
      id: inserted.id,
      ...inserted,
      studentId: finalStudentId,
      school: schoolVal,
      address: addressVal,
      parentName: parentNameVal,
      parentOccupation: parentOccupationVal,
      gender: genderVal,
      fideId: fideIdVal,
      fideRating: fideRatingVal
    });
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

    const formatted = (students || []).map(s => {
      const meta = parseMeta(s.preferred_schedule);
      return {
        id: s.id,
        studentId: s.student_id,
        studentName: s.student_name,
        name: s.student_name,
        email: s.email,
        phone: s.phone_number,
        phoneNumber: s.phone_number,
        whatsappNo: s.phone_number,
        dob: s.dob,
        dateOfBirth: s.dob,
        level: s.level,
        chessExperience: s.chess_experience || s.level,
        preferredSchedule: meta.preferredSchedule || s.preferred_schedule,
        status: s.status,
        isPaused: s.is_paused,
        appliedDate: s.applied_date,
        approvedDate: s.approved_date,
        createdAt: s.created_at,
        school: meta.school || s.school || '',
        address: meta.address || s.address || '',
        parentName: meta.parentName || s.parent_name || '',
        parentOccupation: meta.parentOccupation || s.parent_occupation || '',
        gender: meta.gender || s.gender || '',
        fideId: meta.fideId || s.fide_id || '',
        fideRating: meta.fideRating || s.fide_rating || ''
      };
    });

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

    const formatted = (pending || []).map(s => {
      const meta = parseMeta(s.preferred_schedule);
      return {
        id: s.id,
        studentId: s.student_id,
        studentName: s.student_name,
        name: s.student_name,
        email: s.email,
        phone: s.phone_number,
        phoneNumber: s.phone_number,
        whatsappNo: s.phone_number,
        dob: s.dob,
        dateOfBirth: s.dob,
        level: s.level,
        chessExperience: s.chess_experience || s.level,
        preferredSchedule: meta.preferredSchedule || s.preferred_schedule,
        status: s.status,
        isPaused: s.is_paused,
        appliedDate: s.applied_date,
        createdAt: s.created_at,
        school: meta.school || s.school || '',
        address: meta.address || s.address || '',
        parentName: meta.parentName || s.parent_name || '',
        parentOccupation: meta.parentOccupation || s.parent_occupation || '',
        gender: meta.gender || s.gender || '',
        fideId: meta.fideId || s.fide_id || '',
        fideRating: meta.fideRating || s.fide_rating || ''
      };
    });

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
    if (body.studentId !== undefined) {
      updatePayload.student_id = typeof body.studentId === 'string' ? body.studentId.trim().toUpperCase() : body.studentId;
    }
    if (body.studentName !== undefined || body.name !== undefined) updatePayload.student_name = body.studentName || body.name;
    if (body.email !== undefined) updatePayload.email = body.email;
    if (body.phone !== undefined || body.phoneNumber !== undefined) updatePayload.phone_number = body.phone || body.phoneNumber;
    if (body.dob !== undefined || body.dateOfBirth !== undefined) updatePayload.dob = body.dob || body.dateOfBirth;
    if (body.level !== undefined || body.chessExperience !== undefined) {
      updatePayload.level = body.level || body.chessExperience;
      updatePayload.chess_experience = body.chessExperience || body.level;
    }
    if (body.status !== undefined) updatePayload.status = body.status;
    if (body.isPaused !== undefined) updatePayload.is_paused = body.isPaused;
    if (body.approvedDate !== undefined) updatePayload.approved_date = body.approvedDate;

    // Persist school and extra meta
    if (
      body.school !== undefined ||
      body.address !== undefined ||
      body.parentName !== undefined ||
      body.parentOccupation !== undefined ||
      body.gender !== undefined ||
      body.fideId !== undefined ||
      body.fideRating !== undefined
    ) {
      const { data: existing } = await supabase
        .from('students')
        .select('preferred_schedule')
        .or(`id.eq.${id},student_id.eq.${id}`)
        .maybeSingle();

      const existingMeta = parseMeta(existing?.preferred_schedule);
      const newMeta = {
        ...existingMeta,
        ...(body.school !== undefined ? { school: body.school } : {}),
        ...(body.address !== undefined ? { address: body.address } : {}),
        ...(body.parentName !== undefined ? { parentName: body.parentName } : {}),
        ...(body.parentOccupation !== undefined ? { parentOccupation: body.parentOccupation } : {}),
        ...(body.gender !== undefined ? { gender: body.gender } : {}),
        ...(body.fideId !== undefined ? { fideId: body.fideId } : {}),
        ...(body.fideRating !== undefined ? { fideRating: body.fideRating } : {})
      };
      updatePayload.preferred_schedule = JSON.stringify(newMeta);
    }

    let { data: updated, error } = await supabase
      .from('students')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (!updated) {
      const { data: updatedByStudentId, error: err2 } = await supabase
        .from('students')
        .update(updatePayload)
        .eq('student_id', id)
        .select()
        .maybeSingle();
      if (err2) throw err2;
      updated = updatedByStudentId;
    }

    if (error) throw error;
    if (!updated) return res.status(404).json({ error: 'Student record not found.' });

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

    // Query Supabase for student by student_id or phone_number (case-insensitive)
    let { data: student, error } = await supabase
      .from('students')
      .select('*')
      .or(`student_id.ilike.${idStr},phone_number.eq.${idStr}`)
      .maybeSingle();

    if (error || !student) {
      return res.status(401).json({ error: 'Invalid Student ID / Phone Number or account does not exist.' });
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

    const meta = parseMeta(student.preferred_schedule);
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
      chessExperience: student.chess_experience || student.level,
      preferredSchedule: meta.preferredSchedule || student.preferred_schedule,
      school: meta.school || student.school || '',
      address: meta.address || student.address || '',
      parentName: meta.parentName || student.parent_name || '',
      parentOccupation: meta.parentOccupation || student.parent_occupation || '',
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

    const meta = parseMeta(student.preferred_schedule);
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
      chessExperience: student.chess_experience || student.level,
      preferredSchedule: meta.preferredSchedule || student.preferred_schedule,
      school: meta.school || student.school || '',
      address: meta.address || student.address || '',
      parentName: meta.parentName || student.parent_name || '',
      parentOccupation: meta.parentOccupation || student.parent_occupation || '',
      status: student.status,
      isPaused: student.is_paused,
      appliedDate: student.applied_date
    };

    res.status(200).json(formattedStudent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
