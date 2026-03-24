const { db } = require('../config/firebaseAdmin');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
  try {
    const data = req.body;
    
    // Hash password if provided
    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      data.password = await bcrypt.hash(data.password, salt);
      if (data.confirmPassword) delete data.confirmPassword; // Don't store confirmation
    }

    // Add student to general collection with Pending status
    const docRef = await db.collection('students').add({
      ...data,
      status: data.status || 'Pending',
      createdAt: new Date().toISOString()
    });
    res.status(201).json({ message: 'Registration successful', id: docRef.id, ...data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const [studentsSnapshot, pendingSnapshot] = await Promise.all([
      db.collection('students').get(),
      db.collection('pendingStudents').get()
    ]);

    const students = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const pending = pendingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Combine and deduplicate by document ID
    const studentMap = {};
    [...students, ...pending].forEach(s => {
      studentMap[s.id] = s;
    });

    const allStudents = Object.values(studentMap).map(s => {
      let status = 'Pending';
      if (s.status) {
        const lower = s.status.toLowerCase();
        if (lower === 'approved' || lower === 'active') status = 'Approved';
        else if (lower === 'declined' || lower === 'rejected') status = 'Declined';
      }
      return { ...s, status };
    });

    res.status(200).json(allStudents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPending = async (req, res) => {
  try {
    const snapshot = await db.collection('students').where('status', '==', 'Pending').get();
    const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('students').doc(id).update(req.body);
    res.status(200).json({ id, ...req.body });
  } catch (error) {
    // try pendingStudents if not found in students
    try {
      const { id } = req.params;
      await db.collection('pendingStudents').doc(id).update(req.body);
      res.status(200).json({ id, ...req.body });
    } catch(e) {
      res.status(500).json({ error: error.message });
    }
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('students').doc(id).delete();
    // also try delete from pendingStudents to be safe
    await db.collection('pendingStudents').doc(id).delete();
    res.status(200).json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { studentId, password, dob } = req.body;
    const loginSecret = password || dob;
    
    // 1. Find the student by studentId
    let snapshot = await db.collection('students')
      .where('studentId', '==', studentId)
      .where('status', '==', 'Approved')
      .get();
      
    if (snapshot.empty) {
      // Try legacy pendingStudents collection
      snapshot = await db.collection('pendingStudents')
        .where('studentId', '==', studentId)
        .where('status', '==', 'Approved')
        .get();
        
      if (snapshot.empty) {
        return res.status(401).json({ error: 'Invalid credentials or account not approved yet.' });
      }
    }
    
    const studentData = snapshot.docs[0].data();
    const docId = snapshot.docs[0].id;

    // 2. Verify password/dob
    // Use bcrypt search for password field if it looks hashed or if specifically matched
    let isMatch = false;
    if (studentData.password) {
      // If it's a hashed password, use bcrypt.compare
      if (studentData.password.startsWith('$2')) {
        isMatch = await bcrypt.compare(loginSecret, studentData.password);
      } else {
        // Fallback for plain text password
        isMatch = (studentData.password === loginSecret);
      }
    }
    
    // 3. Fallback to DOB if password didn't match or doesn't exist
    if (!isMatch && studentData.dob) {
      isMatch = (studentData.dob === loginSecret);
    }

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    
    const student = { id: docId, ...studentData };
    res.status(200).json({ message: 'Login successful', student });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const { studentId } = req.params;
    // Try students collection
    let snapshot = await db.collection('students')
      .where('studentId', '==', studentId)
      .get();

    if (snapshot.empty) {
      // Try pendingStudents collection
      snapshot = await db.collection('pendingStudents')
        .where('studentId', '==', studentId)
        .get();
    }

    if (snapshot.empty) {
        // Finally try direct ID fetch if studentId might be a document ID
        const doc = await db.collection('students').doc(studentId).get();
        if (doc.exists) {
            return res.status(200).json({ id: doc.id, ...doc.data() });
        }
        const pendingDoc = await db.collection('pendingStudents').doc(studentId).get();
        if (pendingDoc.exists) {
            return res.status(200).json({ id: pendingDoc.id, ...pendingDoc.data() });
        }
        return res.status(404).json({ error: 'Student not found' });
    }

    const doc = snapshot.docs[0];
    res.status(200).json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
