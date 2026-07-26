const supabase = require('../config/supabaseClient');

exports.getAll = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('coaches')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;

    const formatted = (data || []).map(c => ({
      id: c.id,
      name: c.name,
      title: c.title || '',
      fideRating: c.fide_rating || '',
      rating: c.fide_rating || '',
      experience: c.experience || '',
      bio: c.bio || '',
      specialization: c.specialization || '',
      achievements: typeof c.bio === 'string' && c.bio ? [c.bio] : [],
      imageUrl: c.image_url,
      photo: c.image_url,
      createdAt: c.created_at
    }));

    res.status(200).json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const body = req.body;
    const { data, error } = await supabase
      .from('coaches')
      .insert([{
        name: body.name,
        title: body.title,
        fide_rating: body.fideRating || body.fide_rating,
        experience: body.experience,
        bio: body.bio,
        image_url: body.imageUrl || body.image_url
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ id: data.id, ...body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const { data, error } = await supabase
      .from('coaches')
      .update({
        name: body.name,
        title: body.title,
        fide_rating: body.fideRating || body.fide_rating,
        experience: body.experience,
        bio: body.bio,
        image_url: body.imageUrl || body.image_url
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.status(200).json({ id: data.id, ...body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('coaches')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.status(200).json({ message: 'Coach deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
