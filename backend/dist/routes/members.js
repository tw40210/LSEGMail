"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const router = (0, express_1.Router)();
router.get("/", async (_req, res) => {
    try {
        const result = await db_1.default.query("SELECT * FROM members ORDER BY name ASC");
        res.json(result.rows);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch members" });
    }
});
router.post("/", async (req, res) => {
    const { name, email } = req.body;
    if (!name || !email) {
        return res.status(400).json({ error: "name and email are required" });
    }
    try {
        const result = await db_1.default.query("INSERT INTO members (name, email) VALUES ($1, $2) RETURNING *", [name, email]);
        res.status(201).json(result.rows[0]);
    }
    catch (err) {
        if (err.code === "23505") {
            return res.status(409).json({ error: "Email already exists" });
        }
        console.error(err);
        res.status(500).json({ error: "Failed to create member" });
    }
});
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { name, email } = req.body;
    if (!name || !email) {
        return res.status(400).json({ error: "name and email are required" });
    }
    try {
        const result = await db_1.default.query("UPDATE members SET name=$1, email=$2 WHERE id=$3 RETURNING *", [name, email, id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Member not found" });
        }
        res.json(result.rows[0]);
    }
    catch (err) {
        if (err.code === "23505") {
            return res.status(409).json({ error: "Email already exists" });
        }
        console.error(err);
        res.status(500).json({ error: "Failed to update member" });
    }
});
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db_1.default.query("DELETE FROM members WHERE id=$1 RETURNING id", [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Member not found" });
        }
        res.json({ deleted: true });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete member" });
    }
});
exports.default = router;
