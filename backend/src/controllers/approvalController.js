const supabase = require('../config/supabaseClient');

exports.approveStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const studentData = req.body;

    const { data: updated, error } = await supabase
      .from('students')
      .update({
        student_id: studentId,
        status: 'Approved',
        approved_date: new Date().toISOString()
      })
      .eq('id', studentData.id || studentId)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({ message: 'Student approved successfully', student: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.declineStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    const { data: updated, error } = await supabase
      .from('students')
      .update({ status: 'Declined' })
      .eq('id', studentId)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({ message: 'Student registration declined', student: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
