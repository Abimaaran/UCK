const { db } = require('../config/firebaseAdmin');
const collectionName = 'user_reviews';

exports.getAll = async (req, res) => {
  try {
    const snapshot = await db.collection(collectionName).orderBy('createdAt', 'desc').get();
    res.status(200).json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const data = {
      ...req.body,
      createdAt: new Date().toISOString()
    };
    const docRef = await db.collection(collectionName).add(data);
    res.status(201).json({ id: docRef.id, ...data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection(collectionName).doc(id).delete();
    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
