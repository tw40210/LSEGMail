import pool from "../db";

export interface RotationMember {
  member_id: string;
  position: number;
}

/**
 * Generates calendar_events rows for a rotation from today (or start_date)
 * up to end_date (or 1 year ahead if no end_date).
 * Only non-manually-edited events that don't yet exist are inserted.
 */
export async function generateEvents(rotationId: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const rotResult = await client.query(
      "SELECT * FROM rotations WHERE id=$1",
      [rotationId]
    );
    if (rotResult.rows.length === 0) throw new Error("Rotation not found");
    const rotation = rotResult.rows[0];

    const membersResult = await client.query(
      "SELECT rm.member_id, rm.position FROM rotation_members rm WHERE rm.rotation_id=$1 ORDER BY rm.position ASC",
      [rotationId]
    );
    const members: RotationMember[] = membersResult.rows;
    if (members.length === 0) {
      await client.query("COMMIT");
      return;
    }

    const startDate = new Date(rotation.start_date);
    const endDate = rotation.end_date
      ? new Date(rotation.end_date)
      : new Date(startDate.getFullYear() + 1, startDate.getMonth(), startDate.getDate());

    const frequency: "daily" | "weekly" = rotation.frequency;

    // Delete existing auto-generated events (not manually edited) in range
    await client.query(
      `DELETE FROM calendar_events
       WHERE rotation_id=$1 AND manually_edited=FALSE
         AND event_date >= $2 AND event_date <= $3`,
      [rotationId, startDate.toISOString().slice(0, 10), endDate.toISOString().slice(0, 10)]
    );

    const events: { date: string; memberId: string }[] = [];
    let current = new Date(startDate);
    let idx = 0;

    while (current <= endDate) {
      const member = members[idx % members.length];
      events.push({
        date: current.toISOString().slice(0, 10),
        memberId: member.member_id,
      });

      if (frequency === "daily") {
        current.setDate(current.getDate() + 1);
      } else {
        current.setDate(current.getDate() + 7);
      }
      idx++;
    }

    for (const ev of events) {
      await client.query(
        `INSERT INTO calendar_events (rotation_id, member_id, event_date)
         VALUES ($1, $2, $3)
         ON CONFLICT (rotation_id, event_date) DO NOTHING`,
        [rotationId, ev.memberId, ev.date]
      );
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Swaps the positions of two members in a rotation and regenerates events.
 */
export async function swapRotationMembers(
  rotationId: string,
  memberIdA: string,
  memberIdB: string
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const aRes = await client.query(
      "SELECT position FROM rotation_members WHERE rotation_id=$1 AND member_id=$2",
      [rotationId, memberIdA]
    );
    const bRes = await client.query(
      "SELECT position FROM rotation_members WHERE rotation_id=$1 AND member_id=$2",
      [rotationId, memberIdB]
    );

    if (aRes.rows.length === 0 || bRes.rows.length === 0) {
      throw new Error("One or both members not in rotation");
    }

    const posA = aRes.rows[0].position;
    const posB = bRes.rows[0].position;

    // Use a temp position to avoid unique constraint violation
    await client.query(
      "UPDATE rotation_members SET position=-1 WHERE rotation_id=$1 AND member_id=$2",
      [rotationId, memberIdA]
    );
    await client.query(
      "UPDATE rotation_members SET position=$1 WHERE rotation_id=$2 AND member_id=$3",
      [posA, rotationId, memberIdB]
    );
    await client.query(
      "UPDATE rotation_members SET position=$1 WHERE rotation_id=$2 AND member_id=$3",
      [posB, rotationId, memberIdA]
    );

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  await generateEvents(rotationId);
}

/**
 * Reorders all rotation members by providing a new ordered array of member IDs.
 */
export async function reorderRotationMembers(
  rotationId: string,
  orderedMemberIds: string[]
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // First pass: set all positions to negative temps to avoid unique constraint
    // collisions when positions are shuffled across members.
    for (let i = 0; i < orderedMemberIds.length; i++) {
      await client.query(
        "UPDATE rotation_members SET position=$1 WHERE rotation_id=$2 AND member_id=$3",
        [-(i + 1), rotationId, orderedMemberIds[i]]
      );
    }
    // Second pass: set final positions
    for (let i = 0; i < orderedMemberIds.length; i++) {
      await client.query(
        "UPDATE rotation_members SET position=$1 WHERE rotation_id=$2 AND member_id=$3",
        [i + 1, rotationId, orderedMemberIds[i]]
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  await generateEvents(rotationId);
}
