const { db } = require('../config/firebaseAdmin');

exports.approveStudent = async (req, res) => {
  try {
    const studentRef = db.collection('students').doc(req.params.id);
    const doc = await studentRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Student registration not found' });
    }
    
    // Update status in the same collection
    await studentRef.update({
      status: 'Approved',
      approvedAt: new Date().toISOString()
    });
    
    res.status(200).json({ message: 'Student approved successfully', studentId: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.rejectStudent = async (req, res) => {
  try {
    await db.collection('pendingStudents').doc(req.params.id).delete();
    res.status(200).json({ message: 'Student application rejected' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
