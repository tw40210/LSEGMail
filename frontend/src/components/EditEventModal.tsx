import { useState } from "react";
import type { CalendarEvent, Member } from "../types";

interface Props {
  event: CalendarEvent;
  members: Member[];
  onSave: (
    eventId: string,
    memberId: string | null,
    title: string,
    notes: string
  ) => void;
  onClose: () => void;
}

export default function EditEventModal({ event, members, onSave, onClose }: Props) {
  const [memberId, setMemberId] = useState(event.member_id || "");
  const [title, setTitle] = useState(event.title || "");
  const [notes, setNotes] = useState(event.notes || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave(event.id, memberId || null, title, notes);
    setSaving(false);
  };

  const dateLabel = new Date(event.event_date + "T00:00:00").toLocaleDateString(
    "en-US",
    { weekday: "long", year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Edit Event</h2>
            <p className="text-sm text-gray-500">{dateLabel}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rotation
            </label>
            <p className="text-sm text-gray-500">{event.rotation_name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assigned Member
            </label>
            <select
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              <option value="">— Unassigned —</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Custom Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Leave blank to use member name"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
              placeholder="Optional notes for this event…"
            />
          </div>
          {event.email_sent && (
            <p className="text-xs text-green-600 bg-green-50 rounded px-3 py-2">
              Email was sent to {event.member_email} on{" "}
              {event.email_sent_at
                ? new Date(event.email_sent_at).toLocaleString()
                : "unknown"}
            </p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
