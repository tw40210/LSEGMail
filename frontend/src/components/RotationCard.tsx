import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import toast from "react-hot-toast";
import { rotationsApi } from "../api/client";
import type { Member, Rotation, RotationMember } from "../types";
import { devMode } from "../buildFlags";

interface SortableItemProps {
  rm: RotationMember;
  index: number;
  onRemove: () => void;
}

function SortableItem({ rm, index, onRemove }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: rm.member_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 bg-white border rounded-lg px-3 py-2.5 group hover:border-brand-300 transition-colors"
    >
      <span
        {...attributes}
        {...listeners}
        className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing select-none"
        title="Drag to reorder"
      >
        ⠿
      </span>
      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-brand-100 text-brand-700 text-xs font-bold shrink-0">
        {index + 1}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{rm.name}</p>
        <p className="text-xs text-gray-500 truncate">{rm.email}</p>
      </div>
      <button
        onClick={onRemove}
        className="text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-lg leading-none"
        title="Remove from rotation"
      >
        ×
      </button>
    </div>
  );
}

interface Props {
  rotation: Rotation;
  allMembers: Member[];
  onEdit: () => void;
  onDelete: () => void;
  onRecalculate: () => void;
  onRefresh: () => void;
}

export default function RotationCard({
  rotation,
  allMembers,
  onEdit,
  onDelete,
  onRecalculate,
  onRefresh,
}: Props) {
  const [rotationMembers, setRotationMembers] = useState<RotationMember[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const sensors = useSensors(useSensor(PointerSensor));

  const fetchMembers = async () => {
    try {
      const res = await rotationsApi.get(rotation.id);
      setRotationMembers(res.data.members || []);
    } catch {
      toast.error("Failed to load rotation members");
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [rotation.id]);

  const availableMembers = allMembers.filter(
    (m) => !rotationMembers.some((rm) => rm.member_id === m.id)
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = rotationMembers.findIndex((rm) => rm.member_id === active.id);
    const newIndex = rotationMembers.findIndex((rm) => rm.member_id === over.id);
    const reordered = arrayMove(rotationMembers, oldIndex, newIndex);
    setRotationMembers(reordered);

    try {
      await rotationsApi.reorderMembers(
        rotation.id,
        reordered.map((rm) => rm.member_id)
      );
      toast.success("Order saved & events recalculated");
    } catch {
      toast.error("Failed to save order");
      fetchMembers();
    }
  };

  const handleAddMember = async () => {
    if (!selectedMemberId) return;
    setSaving(true);
    try {
      await rotationsApi.addMember(rotation.id, selectedMemberId);
      setSelectedMemberId("");
      await fetchMembers();
      toast.success("Member added");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to add member");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await rotationsApi.removeMember(rotation.id, memberId);
      await fetchMembers();
      toast.success("Member removed");
    } catch {
      toast.error("Failed to remove member");
    }
  };

  const handleRecalculate = async () => {
    try {
      await rotationsApi.recalculate(rotation.id);
      toast.success("Events recalculated");
    } catch {
      toast.error("Failed to recalculate");
    }
  };

  const handleSendTest = async () => {
    if (rotationMembers.length === 0) {
      toast.error("Add members to this rotation before sending a test");
      return;
    }
    if (
      !confirm(
        `Send a test email to all ${rotationMembers.length} member(s) in "${rotation.name}"?`
      )
    )
      return;
    setSendingTest(true);
    try {
      const res = await rotationsApi.sendTest(rotation.id);
      const { sent, total, failures } = res.data as {
        sent: number;
        total: number;
        failures: string[];
      };
      if (failures.length === 0) {
        toast.success(`Test email sent to ${sent}/${total} member(s)`);
      } else {
        toast.error(`Sent ${sent}/${total}. Failures: ${failures.join(", ")}`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to send test emails");
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b bg-gray-50">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-gray-400 hover:text-gray-600 transition-colors text-sm"
            title={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? "▾" : "▸"}
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 truncate">{rotation.name}</h3>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  rotation.is_active
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {rotation.is_active ? "Active" : "Inactive"}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 font-medium capitalize">
                {rotation.frequency}
              </span>
            </div>
            {rotation.description && (
              <p className="text-xs text-gray-500 truncate mt-0.5">
                {rotation.description}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-0.5">
              {rotation.start_date?.slice(0, 10)}
              {rotation.end_date ? ` → ${rotation.end_date.slice(0, 10)}` : " → 1 year"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {devMode && (
            <button
              onClick={handleSendTest}
              disabled={sendingTest}
              className="text-xs px-3 py-1.5 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-400 disabled:opacity-50 transition-colors"
              title="Send a test email to all members in this rotation"
            >
              {sendingTest ? "Sending…" : "✉ Test Mail"}
            </button>
          )}
          <button
            onClick={handleRecalculate}
            className="text-xs px-3 py-1.5 rounded-lg border hover:bg-brand-50 hover:border-brand-300 text-gray-600 hover:text-brand-700 transition-colors"
            title="Recalculate events"
          >
            ↺ Recalculate
          </button>
          <button
            onClick={onEdit}
            className="text-xs px-3 py-1.5 rounded-lg border hover:bg-gray-50 text-gray-600 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div className="px-5 py-4 space-y-4">
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-blue-50 rounded-lg px-3 py-2">
            <span>💡</span>
            <span>Drag members to reorder the rotation. Changes auto-recalculate events.</span>
          </div>

          {rotationMembers.length === 0 ? (
            <p className="text-sm text-gray-400 italic py-2">
              No members yet. Add members below.
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={rotationMembers.map((rm) => rm.member_id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {rotationMembers.map((rm, i) => (
                    <SortableItem
                      key={rm.member_id}
                      rm={rm}
                      index={i}
                      onRemove={() => handleRemoveMember(rm.member_id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {/* Add member */}
          {availableMembers.length > 0 && (
            <div className="flex gap-2 pt-1">
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                <option value="">Add a member to this rotation…</option>
                {availableMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.email})
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddMember}
                disabled={!selectedMemberId || saving}
                className="px-4 py-2 text-sm rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                {saving ? "Adding…" : "Add"}
              </button>
            </div>
          )}
          {availableMembers.length === 0 && allMembers.length > 0 && (
            <p className="text-xs text-gray-400 italic">
              All members are already in this rotation.
            </p>
          )}
          {allMembers.length === 0 && (
            <p className="text-xs text-orange-500">
              No members found. Go to the Members page to add some first.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
