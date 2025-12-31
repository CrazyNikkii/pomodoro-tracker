import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";

const app = express();
app.use(cors());
app.use(express.json());

// Initialize SQLite database
const db = new sqlite3.Database("./db.sqlite", (err) => {
  if (err) {
    console.error("Could not connect to database", err);
  } else {
    console.log("Connected to SQLite database");
  }
});

// Create table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS study_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at TEXT,
    ended_at TEXT,
    duration_minutes INTEGER
  )
`);

// Test endpoint
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// Save a completed focus session
app.post("/sessions", (req, res) => {
  const { startedAt, endedAt, durationMinutes } = req.body;

  if (!startedAt || !endedAt || !durationMinutes) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  db.run(
    `INSERT INTO study_sessions (started_at, ended_at, duration_minutes) VALUES (?, ?, ?)`,
    [startedAt, endedAt, durationMinutes],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to save session" });
      }
      return res.status(201).json({ id: this.lastID });
    }
  );
});

const PORT = 5000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
