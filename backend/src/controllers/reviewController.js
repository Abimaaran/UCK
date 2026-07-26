const supabase = require('../config/supabaseClient');

exports.getAll = async (req, res) => {
  try {
    const { data, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.status(200).json(data || []);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { data, error } = await supabase.from('reviews').select('*').eq('student_id', studentId);
    if (error) throw error;
    res.status(200).json(data || []);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.create = async (req, res) => {
  try {
    const { studentId, text, date } = req.body;
    const { data, error } = await supabase.from('reviews').insert([{ student_id: studentId, text, date }]).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.update = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { text, date } = req.body;
    
    const { data: existing } = await supabase.from('reviews').select('*').eq('student_id', studentId).maybeSingle();
    if (existing) {
      const { data, error } = await supabase.from('reviews').update({ text, date }).eq('id', existing.id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    } else {
      const { data, error } = await supabase.from('reviews').insert([{ student_id: studentId, text, date }]).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
  } catch (error) { res.status(500).json({ error: error.message }); }
};
