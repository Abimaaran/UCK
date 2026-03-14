const { db } = require('../config/firebaseAdmin');
const collectionName = 'timetable';

exports.getAll = async (req, res) => {
  try {
    const snapshot = await db.collection(collectionName).get();
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
    await db.collection(collectionName).doc(req.params.id).update(req.body);
    res.status(200).json({ message: 'Updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await db.collection(collectionName).doc(req.params.id).delete();
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
