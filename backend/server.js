require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const pool = require("./db");

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET = process.env.JWT_SECRET;

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
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

/* =========================
   ROLE AUTHORIZATION
========================= */
const authorize = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};

/* =========================
   REGISTER
========================= */
app.post("/register", async (req, res) => {
  const { name, email, password, address } = req.body;

  if (!name || !email || !password || !address) {
    return res.status(400).json({ message: "All fields required" });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  try {
    const existing = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (name,email,password,address,role) VALUES ($1,$2,$3,$4,$5)",
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

    res.json({ token, role: user.role });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   ADMIN - ADD STORE
========================= */
app.post("/admin/add-store", auth, authorize(["admin"]), async (req, res) => {
  const { name, address, owner_id } = req.body;

  if (!name || !address) {
    return res.status(400).json({ message: "Name and address required" });
  }

  try {
    await pool.query(
      "INSERT INTO stores (name,address,owner_id) VALUES ($1,$2,$3)",
      [name, address, owner_id || null]
    );

    res.json({ message: "Store added successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   GET STORES + SEARCH
========================= */
app.get("/stores", auth, async (req, res) => {
  const search = req.query.search || "";
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `
      SELECT 
        s.id,
        s.name,
        s.address,
        ROUND(AVG(r.rating)::numeric,1) AS overall_rating,
        MAX(CASE WHEN r.user_id=$1 THEN r.rating END) AS my_rating
      FROM stores s
      LEFT JOIN ratings r ON s.id=r.store_id
      WHERE s.name ILIKE $2
      GROUP BY s.id
      `,
      [userId, `%${search}%`]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   RATE STORE
========================= */
app.post("/rate", auth, async (req, res) => {
  const { store_id, rating } = req.body;

  if (!store_id || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Valid store_id and rating (1-5) required" });
  }

  try {
    await pool.query(
      `INSERT INTO ratings (user_id,store_id,rating)
       VALUES ($1,$2,$3)
       ON CONFLICT (user_id,store_id)
       DO UPDATE SET rating=EXCLUDED.rating`,
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
app.get(
  "/owner/dashboard",
  auth,
  authorize(["store_owner"]),
  async (req, res) => {
    try {
      const result = await pool.query(
        `
        SELECT 
          s.name,
          ROUND(AVG(r.rating)::numeric,1) AS avg_rating,
          COUNT(r.id) AS total_ratings
        FROM stores s
        LEFT JOIN ratings r ON s.id=r.store_id
        WHERE s.owner_id=$1
        GROUP BY s.id
        `,
        [req.user.id]
      );

      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});