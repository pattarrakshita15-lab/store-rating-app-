const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const pool = require("./db");

const app = express();
const PORT = 5000;
const SECRET = "mysecretkey";

// Middlewares
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

/* =========================
   AUTH MIDDLEWARE
========================= */
const auth = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

/* =========================
   REGISTER
========================= */
app.post("/register", async (req, res) => {
  const { name, email, password, address } = req.body;

  if (!name || !email || !password || !address) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const existing = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (name, email, password, address, role) VALUES ($1,$2,$3,$4,$5)",
      [name, email, hashedPassword, address, "user"]
    );

    res.json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   LOGIN
========================= */
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const user = result.rows[0];

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   GET STORES (FIXED)
========================= */
app.get("/stores", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT 
        s.id,
        s.name,
        s.address,
        ROUND(AVG(r.rating)::numeric, 1) AS overall_rating,
        MAX(CASE WHEN r.user_id = $1 THEN r.rating END) AS my_rating
      FROM stores s
      LEFT JOIN ratings r ON s.id = r.store_id
      GROUP BY s.id
      `,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   RATE STORE (UPSERT)
========================= */
app.post("/rate", auth, async (req, res) => {
  const { store_id, rating } = req.body;

  if (!store_id || rating === undefined) {
    return res.status(400).json({ message: "Store ID and rating required" });
  }

  try {
    await pool.query(
      `INSERT INTO ratings (user_id, store_id, rating)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, store_id)
       DO UPDATE SET rating = EXCLUDED.rating`,
      [req.user.id, store_id, rating]
    );

    res.json({ message: "Rating submitted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   OWNER DASHBOARD
========================= */
app.get("/owner/dashboard", auth, async (req, res) => {
  if (req.user.role !== "store_owner") {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const result = await pool.query(
      `SELECT ROUND(AVG(r.rating)::numeric, 1) AS average_rating
       FROM ratings r
       JOIN stores s ON r.store_id = s.id
       WHERE s.owner_id = $1`,
      [req.user.id]
    );

    res.json({
      averageRating: result.rows[0].average_rating || 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   START SERVER
========================= */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});