const supabase = require('../config/supabaseClient');

exports.registerUser = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const { data, error } = await supabase.from('users').insert([{ email, name }]).select().single();
    if (error) throw error;
    res.status(201).json({ message: "User registered successfully", id: data.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email } = req.body;
    const { data, error } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
    if (error || !data) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    res.status(200).json({ message: "Login successful", user: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;
    res.status(200).json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
