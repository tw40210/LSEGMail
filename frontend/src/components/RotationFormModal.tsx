import { useState } from "react";
import type { Rotation } from "../types";

interface FormData {
  name: string;
  description: string;
  frequency: "daily" | "weekly";
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface Props {
  rotation: Rotation | null;
  onSubmit: (data: FormData) => void;
  onClose: () => void;
}

export default function RotationFormModal({ rotation, onSubmit, onClose }: Props) {
  const [form, setForm] = useState<FormData>({
    name: rotation?.name || "",
    description: rotation?.description || "",
    frequency: rotation?.frequency || "weekly",
    start_date: rotation?.start_date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    end_date: rotation?.end_date?.slice(0, 10) || "",
    is_active: rotation?.is_active ?? true,
  });

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {rotation ? "Edit Rotation" : "Create Rotation"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="text"
              value={form.name}
              onChange={set("name")}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="e.g. Weekly Meeting Host"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={set("description")}
              rows={2}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
              placeholder="Optional description…"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frequency <span className="text-red-500">*</span>
              </label>
              <select
                value={form.frequency}
                onChange={set("frequency")}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="date"
                value={form.start_date}
                onChange={set("start_date")}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date{" "}
              <span className="text-gray-400 font-normal">
                (leave blank for 1 year)
              </span>
            </label>
            <input
              type="date"
              value={form.end_date}
              onChange={set("end_date")}
              min={form.start_date}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          {rotation && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={form.is_active}
                onChange={set("is_active")}
                className="rounded"
              />
              <label htmlFor="is_active" className="text-sm text-gray-700">
                Active (emails will be sent for active rotations)
              </label>
            </div>
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
              className="px-4 py-2 text-sm rounded-lg bg-brand-600 text-white hover:bg-brand-700"
            >
              {rotation ? "Save Changes" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
