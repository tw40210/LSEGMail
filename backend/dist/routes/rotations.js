"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const rotationService_1 = require("../services/rotationService");
const emailService_1 = require("../services/emailService");
const router = (0, express_1.Router)();
// List all rotations
router.get("/", async (_req, res) => {
    try {
        const result = await db_1.default.query("SELECT * FROM rotations ORDER BY created_at DESC");
        res.json(result.rows);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch rotations" });
    }
});
// Get single rotation with its members
router.get("/:id", async (req, res) => {
    try {
        const rot = await db_1.default.query("SELECT * FROM rotations WHERE id=$1", [
            req.params.id,
        ]);
        if (rot.rows.length === 0)
            return res.status(404).json({ error: "Not found" });
        const members = await db_1.default.query(`SELECT rm.id, rm.position, m.id as member_id, m.name, m.email
       FROM rotation_members rm
       JOIN members m ON m.id = rm.member_id
       WHERE rm.rotation_id=$1
       ORDER BY rm.position ASC`, [req.params.id]);
        res.json({ ...rot.rows[0], members: members.rows });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch rotation" });
    }
});
// Create rotation
router.post("/", async (req, res) => {
    const { name, description, frequency, start_date, end_date } = req.body;
    if (!name || !frequency || !start_date) {
        return res
            .status(400)
            .json({ error: "name, frequency and start_date are required" });
    }
    if (!["daily", "weekly"].includes(frequency)) {
        return res.status(400).json({ error: "frequency must be daily or weekly" });
    }
    try {
        const result = await db_1.default.query(`INSERT INTO rotations (name, description, frequency, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`, [name, description || null, frequency, start_date, end_date || null]);
        res.status(201).json(result.rows[0]);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create rotation" });
    }
});
// Update rotation metadata
router.put("/:id", async (req, res) => {
    const { name, description, frequency, start_date, end_date, is_active } = req.body;
    try {
        const result = await db_1.default.query(`UPDATE rotations
       SET name=$1, description=$2, frequency=$3, start_date=$4, end_date=$5, is_active=$6
       WHERE id=$7 RETURNING *`, [
            name,
            description || null,
            frequency,
            start_date,
            end_date || null,
            is_active !== undefined ? is_active : true,
            req.params.id,
        ]);
        if (result.rows.length === 0)
            return res.status(404).json({ error: "Not found" });
        res.json(result.rows[0]);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update rotation" });
    }
});
// Delete rotation
router.delete("/:id", async (req, res) => {
    try {
        const result = await db_1.default.query("DELETE FROM rotations WHERE id=$1 RETURNING id", [req.params.id]);
        if (result.rows.length === 0)
            return res.status(404).json({ error: "Not found" });
        res.json({ deleted: true });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete rotation" });
    }
});
// Add member to rotation
router.post("/:id/members", async (req, res) => {
    const { member_id } = req.body;
    if (!member_id)
        return res.status(400).json({ error: "member_id is required" });
    try {
        const maxPos = await db_1.default.query("SELECT COALESCE(MAX(position), 0) as max FROM rotation_members WHERE rotation_id=$1", [req.params.id]);
        const newPos = parseInt(maxPos.rows[0].max) + 1;
        const result = await db_1.default.query(`INSERT INTO rotation_members (rotation_id, member_id, position)
       VALUES ($1, $2, $3) RETURNING *`, [req.params.id, member_id, newPos]);
        await (0, rotationService_1.generateEvents)(req.params.id);
        res.status(201).json(result.rows[0]);
    }
    catch (err) {
        if (err.code === "23505") {
            return res.status(409).json({ error: "Member already in rotation" });
        }
        console.error(err);
        res.status(500).json({ error: "Failed to add member" });
    }
});
// Remove member from rotation
router.delete("/:id/members/:memberId", async (req, res) => {
    try {
        await db_1.default.query("DELETE FROM rotation_members WHERE rotation_id=$1 AND member_id=$2", [req.params.id, req.params.memberId]);
        // Re-number positions
        const remaining = await db_1.default.query("SELECT id FROM rotation_members WHERE rotation_id=$1 ORDER BY position ASC", [req.params.id]);
        for (let i = 0; i < remaining.rows.length; i++) {
            await db_1.default.query("UPDATE rotation_members SET position=$1 WHERE id=$2", [
                i + 1,
                remaining.rows[i].id,
            ]);
        }
        await (0, rotationService_1.generateEvents)(req.params.id);
        res.json({ deleted: true });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to remove member" });
    }
});
// Reorder rotation members (drag-and-drop)
router.put("/:id/members/reorder", async (req, res) => {
    const { ordered_member_ids } = req.body;
    if (!Array.isArray(ordered_member_ids)) {
        return res.status(400).json({ error: "ordered_member_ids must be an array" });
    }
    try {
        await (0, rotationService_1.reorderRotationMembers)(req.params.id, ordered_member_ids);
        res.json({ success: true });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to reorder members" });
    }
});
// Swap two members in rotation
router.post("/:id/members/swap", async (req, res) => {
    const { member_id_a, member_id_b } = req.body;
    if (!member_id_a || !member_id_b) {
        return res
            .status(400)
            .json({ error: "member_id_a and member_id_b are required" });
    }
    try {
        await (0, rotationService_1.swapRotationMembers)(req.params.id, member_id_a, member_id_b);
        res.json({ success: true });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to swap members" });
    }
});
// Recalculate / regenerate events for a rotation
router.post("/:id/recalculate", async (req, res) => {
    try {
        await (0, rotationService_1.generateEvents)(req.params.id);
        res.json({ success: true });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to recalculate events" });
    }
});
// Send a test email to every member in this rotation
router.post("/:id/send-test", async (req, res) => {
    try {
        const members = await db_1.default.query(`SELECT m.name, m.email
       FROM rotation_members rm
       JOIN members m ON m.id = rm.member_id
       WHERE rm.rotation_id = $1
       ORDER BY rm.position ASC`, [req.params.id]);
        if (members.rows.length === 0) {
            return res.status(400).json({ error: "No members in this rotation" });
        }
        let sent = 0;
        const failures = [];
        for (const member of members.rows) {
            try {
                await (0, emailService_1.sendTestEmailToMember)(member.name, member.email);
                sent++;
            }
            catch (err) {
                failures.push(`${member.email}: ${err.message}`);
                console.error(`[TEST EMAIL] Failed for ${member.email}:`, err);
            }
        }
        res.json({ sent, total: members.rows.length, failures });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to send test emails" });
    }
});
exports.default = router;
