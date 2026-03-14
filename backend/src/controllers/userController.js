const { db } = require("../config/firebaseAdmin");

// Register (Create user in Firestore)
exports.registerUser = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Add user document to 'users' collection
    const newUserRef = await db.collection("users").add({
      email,
      name,
      createdAt: new Date().toISOString()
    });

    res.status(201).json({ message: "User registered successfully", id: newUserRef.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Login 
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email in Firestore
    const snapshot = await db.collection("users").where("email", "==", email).get();
    
    if (snapshot.empty) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    res.status(200).json({ message: "Login successful", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fetch All Users
exports.getAllUsers = async (req, res) => {
  try {
    const snapshot = await db.collection("users").get();
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
