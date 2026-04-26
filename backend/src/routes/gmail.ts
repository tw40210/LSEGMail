import { Router } from "express";
import {
  getAuthUrl,
  exchangeCodeForTokens,
  getGmailConfig,
} from "../services/emailService";
import pool from "../db";
import { sendTodaysEmails } from "../services/cronService";

const router = Router();

// Get current Gmail config status
router.get("/status", async (_req, res) => {
  try {
    const config = await getGmailConfig();
    res.json({
      authorized: !!config.refresh_token,
      authorized_email: config.authorized_email || null,
      email_subject_template: config.email_subject_template,
      email_body_template: config.email_body_template,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get Gmail status" });
  }
});

// Get OAuth2 authorization URL
router.get("/auth-url", async (_req, res) => {
  try {
    const url = await getAuthUrl();
    res.json({ url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate auth URL" });
  }
});

// OAuth2 callback
router.get("/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send("Missing code parameter");
  }
  try {
    await exchangeCodeForTokens(code as string);
    // Send user to Gmail page (not "/": index <Navigate> to /calendar drops ?query)
    res.redirect("/gmail?gmail=connected");
  } catch (err: any) {
    console.error(err);
    res.redirect(
      `/gmail?gmail=error&message=${encodeURIComponent(err.message)}`
    );
  }
});

// Revoke Gmail access
router.post("/revoke", async (_req, res) => {
  try {
    await pool.query(
      "UPDATE gmail_config SET access_token=NULL, refresh_token=NULL, token_expiry=NULL, authorized_email=NULL WHERE id=1"
    );
    res.json({ revoked: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to revoke access" });
  }
});

// Update email templates
router.put("/templates", async (req, res) => {
  const { email_subject_template, email_body_template } = req.body;
  if (!email_subject_template || !email_body_template) {
    return res.status(400).json({ error: "Both templates are required" });
  }
  try {
    await pool.query(
      "UPDATE gmail_config SET email_subject_template=$1, email_body_template=$2 WHERE id=1",
      [email_subject_template, email_body_template]
    );
    res.json({ updated: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update templates" });
  }
});

// Manually trigger today's emails
router.post("/send-today", async (_req, res) => {
  try {
    const result = await sendTodaysEmails();
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send emails" });
  }
});

export default router;
