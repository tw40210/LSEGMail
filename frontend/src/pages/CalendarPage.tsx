import { useEffect, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg, EventInput } from "@fullcalendar/core";
import toast from "react-hot-toast";
import { eventsApi, membersApi, rotationsApi } from "../api/client";
import type { CalendarEvent, Member, Rotation } from "../types";
import EditEventModal from "../components/EditEventModal";

const ROTATION_COLORS = [
  "#4263eb",
  "#2f9e44",
  "#e67700",
  "#c92a2a",
  "#862e9c",
  "#1098ad",
];

export default function CalendarPage() {
  const calendarRef = useRef<FullCalendar>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [rotations, setRotations] = useState<Rotation[]>([]);
  const [selectedRotationId, setSelectedRotationId] = useState<string>("all");
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [evRes, memRes, rotRes] = await Promise.all([
        eventsApi.list(
          selectedRotationId !== "all"
            ? { rotation_id: selectedRotationId }
            : {}
        ),
        membersApi.list(),
        rotationsApi.list(),
      ]);
      setEvents(evRes.data);
      setMembers(memRes.data);
      setRotations(rotRes.data);
    } catch {
      toast.error("Failed to load calendar data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedRotationId]);

  const rotationColorMap = Object.fromEntries(
    rotations.map((r, i) => [r.id, ROTATION_COLORS[i % ROTATION_COLORS.length]])
  );

  const calendarEvents: EventInput[] = events.map((ev) => ({
    id: ev.id,
    title: ev.title || ev.member_name || "Unassigned",
    date: ev.event_date,
    backgroundColor: rotationColorMap[ev.rotation_id] || "#4263eb",
    borderColor: rotationColorMap[ev.rotation_id] || "#4263eb",
    extendedProps: { event: ev },
    classNames: [
      ev.manually_edited ? "opacity-90 ring-2 ring-white ring-offset-1" : "",
      ev.email_sent ? "after:content-['✓']" : "",
    ],
  }));

  const handleEventClick = (info: EventClickArg) => {
    const ev: CalendarEvent = info.event.extendedProps.event;
    setEditingEvent(ev);
  };

  const handleSaveEvent = async (
    eventId: string,
    memberId: string | null,
    title: string,
    notes: string
  ) => {
    try {
      await eventsApi.update(eventId, {
        member_id: memberId || undefined,
        title,
        notes,
      });
      toast.success("Event updated");
      setEditingEvent(null);
      fetchData();
    } catch {
      toast.error("Failed to update event");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Rotation Calendar</h1>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-600">
            Filter by Rotation:
          </label>
          <select
            value={selectedRotationId}
            onChange={(e) => setSelectedRotationId(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            <option value="all">All Rotations</option>
            {rotations.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {rotations.map((r, i) => (
          <div key={r.id} className="flex items-center gap-1.5 text-sm">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{
                backgroundColor: ROTATION_COLORS[i % ROTATION_COLORS.length],
              }}
            />
            <span className="text-gray-700">{r.name}</span>
            <span className="text-gray-400">({r.frequency})</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4">
        {loading ? (
          <div className="h-96 flex items-center justify-center text-gray-400">
            Loading calendar…
          </div>
        ) : (
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={calendarEvents}
            eventClick={handleEventClick}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,dayGridWeek",
            }}
            height="auto"
            eventDisplay="block"
            dayMaxEvents={4}
            eventTimeFormat={{ hour: undefined }}
            eventContent={(arg) => (
              <div className="px-1 py-0.5 truncate text-xs font-medium flex items-center gap-1">
                {arg.event.extendedProps.event.email_sent && (
                  <span title="Email sent">✓</span>
                )}
                {arg.event.extendedProps.event.manually_edited && (
                  <span title="Manually edited">✏️</span>
                )}
                <span className="truncate">{arg.event.title}</span>
              </div>
            )}
          />
        )}
      </div>

      <p className="text-xs text-gray-400">
        Click any event to manually edit the assigned member. ✏️ = manually
        edited, ✓ = email sent.
      </p>

      {editingEvent && (
        <EditEventModal
          event={editingEvent}
          members={members}
          onSave={handleSaveEvent}
          onClose={() => setEditingEvent(null)}
        />
      )}
    </div>
  );
}
