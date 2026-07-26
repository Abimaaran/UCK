const supabase = require('../config/supabaseClient');

exports.getAll = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select('*');

    if (error) throw error;

    const formatted = (data || []).map(r => ({
      id: r.id,
      studentId: r.student_id,
      date: r.date,
      status: r.status,
      createdAt: r.created_at
    }));

    res.status(200).json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', studentId);

    if (error) throw error;

    const formatted = (data || []).map(r => ({
      id: r.id,
      studentId: r.student_id,
      date: r.date,
      status: r.status,
      createdAt: r.created_at
    }));

    res.status(200).json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { studentId, date, status } = req.body;
    const { data, error } = await supabase
      .from('attendance')
      .insert([{ student_id: studentId, date, status }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ id: data.id, studentId: data.student_id, date: data.date, status: data.status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { date, status } = req.body;

    const { data: existing } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', studentId)
      .eq('date', date)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabase
        .from('attendance')
        .update({ status })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json({ id: data.id, studentId: data.student_id, date: data.date, status: data.status });
    } else {
      const { data, error } = await supabase
        .from('attendance')
        .insert([{ student_id: studentId, date, status }])
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json({ id: data.id, studentId: data.student_id, date: data.date, status: data.status });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
