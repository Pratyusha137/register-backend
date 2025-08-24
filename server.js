const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const User = require('./models/User'); // ← Mongoose model import

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
const mongoURI = "mongodb+srv://Pratyusha:Pratyusha123@cluster0.zoibxg3.mongodb.net/registerDB?retryWrites=true&w=majority";

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("MongoDB Connected ✅"))
.catch(err => console.log("MongoDB connection error:", err));

// Health Check
app.get('/', (_req, res) => {
    res.send("Register API is running ✅");
});

// Register Route
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;

    // Basic validations
    if (!name || !email || !password) {
        return res.status(400).json({ message: "All fields are required." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email address." });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    try {
        // Check if email already exists
        const exists = await User.findOne({ email: email.toLowerCase() });
        if (exists) {
            return res.status(409).json({ message: "Email already registered." });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            email: email.toLowerCase(),
            password: passwordHash
        });

        await newUser.save();

        const { password: _p, ...safeUser } = newUser._doc; // remove password from response
        res.status(201).json({ message: "Registered successfully!", user: safeUser });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// List Users (without password)
app.get('/api/users', async (_req, res) => {
    try {
        const users = await User.find({}, { password: 0 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT} ✅`));
