const supabase = require('../config/supabaseClient');

exports.getAll = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('timetable')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.status(200).json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('timetable')
      .insert([req.body])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('timetable')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('timetable')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.status(200).json({ message: 'Timetable entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
