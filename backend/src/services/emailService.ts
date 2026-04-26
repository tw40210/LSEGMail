import { google } from "googleapis";
import pool from "../db";

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
  );
}

export async function getAuthUrl(): Promise<string> {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/userinfo.email",
      "openid",
    ],
  });
}

export async function exchangeCodeForTokens(code: string): Promise<void> {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.refresh_token) {
    throw new Error(
      "No refresh token received. Revoke app access in Google account and try again."
    );
  }

  // Get authorized email from token info (avoids needing Gmail read scopes)
  const tokenInfo = await oauth2Client.getTokenInfo(tokens.access_token!);

  await pool.query(
    `UPDATE gmail_config SET
       access_token=$1, refresh_token=$2, token_expiry=$3, authorized_email=$4
     WHERE id=1`,
    [
      tokens.access_token,
      tokens.refresh_token,
      tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      tokenInfo.email,
    ]
  );
}

export async function getGmailConfig() {
  const result = await pool.query("SELECT * FROM gmail_config WHERE id=1");
  return result.rows[0];
}

async function getAuthorizedClient() {
  const config = await getGmailConfig();
  if (!config.refresh_token) {
    throw new Error("Gmail not authorized. Please connect your Gmail account.");
  }
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    refresh_token: config.refresh_token,
    access_token: config.access_token,
    expiry_date: config.token_expiry ? new Date(config.token_expiry).getTime() : undefined,
  });
  return oauth2Client;
}

function formatTemplate(
  template: string,
  vars: Record<string, string>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] || "");
}

function buildRawEmail(
  to: string,
  subject: string,
  body: string,
  from: string
): string {
  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "",
    body,
  ].join("\r\n");

  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function sendEmail(
  memberName: string,
  memberEmail: string,
  eventDate: string,
): Promise<void> {
  const config = await getGmailConfig();
  const auth = await getAuthorizedClient();
  const gmail = google.gmail({ version: "v1", auth });

  const vars = {
    name: memberName,
    email: memberEmail,
    date: new Date(eventDate).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  };

  const subject = formatTemplate(config.email_subject_template, vars);
  const body = formatTemplate(config.email_body_template, vars);
  const raw = buildRawEmail(memberEmail, subject, body, config.authorized_email);

  await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw },
  });
}

export async function sendEventEmail(
  memberName: string,
  memberEmail: string,
  eventDate: string,
  eventId: string
): Promise<void> {
  await sendEmail(memberName, memberEmail, eventDate);
  await pool.query(
    "UPDATE calendar_events SET email_sent=TRUE, email_sent_at=NOW() WHERE id=$1",
    [eventId]
  );
}

export async function sendTestEmailToMember(
  memberName: string,
  memberEmail: string,
): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  await sendEmail(memberName, memberEmail, today);
}
