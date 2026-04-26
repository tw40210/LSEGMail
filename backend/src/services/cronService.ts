import cron from "node-cron";
import pool from "../db";
import { sendEventEmail } from "./emailService";

export function startCronJobs(): void {
  // Runs every day at 7:00 AM server time
  cron.schedule("0 7 * * *", async () => {
    console.log("[CRON] Running daily email send job...");
    await sendTodaysEmails();
  });

  console.log("[CRON] Daily email job scheduled at 07:00");
}

export async function sendTodaysEmails(): Promise<{
  sent: number;
  errors: number;
}> {
  const today = new Date().toISOString().slice(0, 10);
  let sent = 0;
  let errors = 0;

  try {
    // Find today's events where email not yet sent and there's a member assigned
    const result = await pool.query(
      `SELECT ce.id, ce.event_date, m.name as member_name, m.email as member_email
       FROM calendar_events ce
       JOIN members m ON m.id = ce.member_id
       JOIN rotations r ON r.id = ce.rotation_id
       WHERE ce.event_date = $1
         AND ce.email_sent = FALSE
         AND r.is_active = TRUE`,
      [today]
    );

    for (const row of result.rows) {
      try {
        await sendEventEmail(
          row.member_name,
          row.member_email,
          row.event_date,
          row.id
        );
        sent++;
        console.log(
          `[EMAIL] Sent to ${row.member_email} for event on ${row.event_date}`
        );
      } catch (emailErr) {
        errors++;
        console.error(
          `[EMAIL] Failed for ${row.member_email}:`,
          emailErr
        );
      }
    }
  } catch (err) {
    console.error("[CRON] Error fetching events:", err);
    errors++;
  }

  console.log(`[CRON] Done. Sent: ${sent}, Errors: ${errors}`);
  return { sent, errors };
}
