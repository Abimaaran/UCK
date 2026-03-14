const { db } = require('../config/firebaseAdmin');
const collectionName = 'reviews';

exports.getAll = async (req, res) => {
  try {
    const snapshot = await db.collection(collectionName).get();
    res.status(200).json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getByStudent = async (req, res) => {
  try {
    const snapshot = await db.collection(collectionName).where('studentId', '==', req.params.studentId).get();
    res.status(200).json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const docRef = await db.collection(collectionName).add(req.body);
    res.status(201).json({ id: docRef.id, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { text, date } = req.body;

    const snapshot = await db.collection(collectionName)
      .where('studentId', '==', studentId)
      .get();

    if (snapshot.empty) {
      const docRef = await db.collection(collectionName).add({ studentId, text, date });
      return res.status(201).json({ id: docRef.id, studentId, text, date });
    }

    const docId = snapshot.docs[0].id;
    await db.collection(collectionName).doc(docId).update({ text, date });
    res.status(200).json({ id: docId, studentId, text, date });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
