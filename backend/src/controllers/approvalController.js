const { db } = require('../config/firebaseAdmin');

exports.approveStudent = async (req, res) => {
  try {
    const pendingRef = db.collection('pendingStudents').doc(req.params.id);
    const doc = await pendingRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Pending student not found' });
    }
    
    const studentData = doc.data();
    
    // Move to confirmed students collection
    const newStudentRef = await db.collection('students').add({
      ...studentData,
      status: 'approved',
      approvedAt: new Date().toISOString()
    });
    
    // Remove from pending
    await pendingRef.delete();
    
    res.status(200).json({ message: 'Student approved successfully', studentId: newStudentRef.id });
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
