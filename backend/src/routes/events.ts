import { Router } from "express";
import pool from "../db";

const router = Router();

// List events (optional ?rotation_id=, ?from=, ?to=)
router.get("/", async (req, res) => {
  const { rotation_id, from, to } = req.query;
  try {
    let query = `
      SELECT ce.*, m.name as member_name, m.email as member_email,
             r.name as rotation_name, r.frequency
      FROM calendar_events ce
      LEFT JOIN members m ON m.id = ce.member_id
      LEFT JOIN rotations r ON r.id = ce.rotation_id
      WHERE 1=1
    `;
    const params: (string | undefined)[] = [];
    let idx = 1;
    if (rotation_id) {
      query += ` AND ce.rotation_id=$${idx++}`;
      params.push(rotation_id as string);
    }
    if (from) {
      query += ` AND ce.event_date >= $${idx++}`;
      params.push(from as string);
    }
    if (to) {
      query += ` AND ce.event_date <= $${idx++}`;
      params.push(to as string);
    }
    query += " ORDER BY ce.event_date ASC";
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// Get single event
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ce.*, m.name as member_name, m.email as member_email
       FROM calendar_events ce
       LEFT JOIN members m ON m.id = ce.member_id
       WHERE ce.id=$1`,
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch event" });
  }
});

// Manually edit an event (change member, title, notes)
router.put("/:id", async (req, res) => {
  const { member_id, title, notes } = req.body;
  try {
    const result = await pool.query(
      `UPDATE calendar_events
       SET member_id=$1, title=$2, notes=$3, manually_edited=TRUE
       WHERE id=$4 RETURNING *`,
      [member_id || null, title || null, notes || null, req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update event" });
  }
});

export default router;
