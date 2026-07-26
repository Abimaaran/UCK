const supabase = require('../config/supabaseClient');

exports.getAll = async (req, res) => {
  try {
    const { data, error } = await supabase.from('achievements').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.status(200).json(data || []);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.create = async (req, res) => {
  try {
    const { data, error } = await supabase.from('achievements').insert([req.body]).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('achievements').update(req.body).eq('id', id).select().single();
    if (error) throw error;
    res.status(200).json(data);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('achievements').delete().eq('id', id);
    if (error) throw error;
    res.status(200).json({ message: 'Achievement deleted' });
  } catch (error) { res.status(500).json({ error: error.message }); }
};
