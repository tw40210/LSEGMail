import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { rotationsApi, membersApi } from "../api/client";
import type { Member, Rotation, RotationWithMembers } from "../types";
import RotationCard from "../components/RotationCard";
import RotationFormModal from "../components/RotationFormModal";

export default function RotationsPage() {
  const [rotations, setRotations] = useState<Rotation[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRotation, setEditingRotation] = useState<Rotation | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [rotRes, memRes] = await Promise.all([
        rotationsApi.list(),
        membersApi.list(),
      ]);
      setRotations(rotRes.data);
      setMembers(memRes.data);
    } catch {
      toast.error("Failed to load rotations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleCreate = async (data: {
    name: string;
    description: string;
    frequency: "daily" | "weekly";
    start_date: string;
    end_date: string;
  }) => {
    try {
      await rotationsApi.create(data);
      toast.success("Rotation created");
      setShowForm(false);
      fetchAll();
    } catch {
      toast.error("Failed to create rotation");
    }
  };

  const handleEdit = async (
    id: string,
    data: {
      name: string;
      description: string;
      frequency: "daily" | "weekly";
      start_date: string;
      end_date: string;
      is_active: boolean;
    }
  ) => {
    try {
      await rotationsApi.update(id, data);
      toast.success("Rotation updated");
      setEditingRotation(null);
      fetchAll();
    } catch {
      toast.error("Failed to update rotation");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this rotation and all its events?")) return;
    try {
      await rotationsApi.delete(id);
      toast.success("Rotation deleted");
      fetchAll();
    } catch {
      toast.error("Failed to delete rotation");
    }
  };

  const handleRecalculate = async (id: string) => {
    try {
      await rotationsApi.recalculate(id);
      toast.success("Events recalculated");
    } catch {
      toast.error("Failed to recalculate");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading rotations…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Rotations</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          <span>+</span> New Rotation
        </button>
      </div>

      {rotations.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🔄</p>
          <p className="text-lg font-medium">No rotations yet</p>
          <p className="text-sm mt-1">Create your first rotation to get started.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {rotations.map((rotation) => (
            <RotationCard
              key={rotation.id}
              rotation={rotation}
              allMembers={members}
              onEdit={() => setEditingRotation(rotation)}
              onDelete={() => handleDelete(rotation.id)}
              onRecalculate={() => handleRecalculate(rotation.id)}
              onRefresh={fetchAll}
            />
          ))}
        </div>
      )}

      {(showForm || editingRotation) && (
        <RotationFormModal
          rotation={editingRotation}
          onSubmit={editingRotation ? (data) => handleEdit(editingRotation.id, data as any) : handleCreate}
          onClose={() => {
            setShowForm(false);
            setEditingRotation(null);
          }}
        />
      )}
    </div>
  );
}
