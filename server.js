const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const app = express();
// ✅ Changed port to 5000 to match frontend proxy
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ----- JSON "database" -----
const DATA_DIR = path.join(__dirname, "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, "[]", "utf-8");
}
ensureDataFile();

function readUsers() {
  try {
    const raw = fs.readFileSync(USERS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Health check
app.get("/", (_req, res) => {
  res.send("Register API is running ✅");
});

// Register route
app.post("/api/register", async (req, res) => {
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

  const users = readUsers();
  const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(409).json({ message: "Email already registered." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const nextId = users.length ? users[users.length - 1].id + 1 : 1;

  const newUser = {
    id: nextId,
    name,
    email,
    passwordHash,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  writeUsers(users);

  const { passwordHash: _ph, ...safeUser } = newUser;
  res.status(201).json({ message: "Registered successfully!", user: safeUser });
});

// List users (without password hash)
app.get("/api/users", (_req, res) => {
  const safe = readUsers().map(({ passwordHash, ...u }) => u);
  res.json(safe);
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ API ready on http://localhost:${PORT}`);
});
