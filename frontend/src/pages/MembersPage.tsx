import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { membersApi } from "../api/client";
import type { Member } from "../types";

interface MemberForm {
  name: string;
  email: string;
}

function maskEmail(email: string): string {
  const [localPart, domain = ""] = email.split("@");
  if (!localPart || !domain) return "******";

  const localVisible = localPart.slice(0, 2);
  const localMasked = `${localVisible}${"*".repeat(Math.max(localPart.length - 2, 2))}`;

  const domainParts = domain.split(".");
  const domainName = domainParts[0] || "";
  const tld = domainParts.slice(1).join(".");
  const domainVisible = domainName.slice(0, 1);
  const domainMasked = `${domainVisible}${"*".repeat(Math.max(domainName.length - 1, 2))}`;

  return `${localMasked}@${tld ? `${domainMasked}.${tld}` : domainMasked}`;
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MemberForm>({ name: "", email: "" });
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await membersApi.list();
      setMembers(res.data);
    } catch {
      toast.error("Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await membersApi.create(form);
      toast.success("Member added");
      setForm({ name: "", email: "" });
      setShowAddForm(false);
      fetchMembers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to add member");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    if (!editingId) return;
    setSaving(true);
    try {
      await membersApi.update(editingId, form);
      toast.success("Member updated");
      setEditingId(null);
      setForm({ name: "", email: "" });
      fetchMembers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update member");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this member? They will be removed from all rotations.")) return;
    try {
      await membersApi.delete(id);
      toast.success("Member deleted");
      fetchMembers();
    } catch {
      toast.error("Failed to delete member");
    }
  };

  const startEdit = (m: Member) => {
    setEditingId(m.id);
    setForm({ name: m.name, email: m.email });
    setShowAddForm(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ name: "", email: "" });
  };

  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Members</h1>
        <button
          onClick={() => {
            setShowAddForm(true);
            setEditingId(null);
            setForm({ name: "", email: "" });
          }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          + Add Member
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="bg-white border rounded-xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4">New Member</h2>
          <form onSubmit={handleAdd} className="flex gap-3 flex-wrap">
            <input
              required
              type="text"
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="flex-1 min-w-[180px] border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            <input
              required
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="flex-1 min-w-[220px] border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {saving ? "Adding…" : "Add"}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
          🔍
        </span>
        <input
          type="text"
          placeholder="Search by name or email…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-8 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-40 text-gray-400">
          Loading members…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">👥</p>
          <p className="text-lg font-medium">
            {searchTerm ? "No members match your search" : "No members yet"}
          </p>
          {!searchTerm && (
            <p className="text-sm mt-1">Click "Add Member" to get started.</p>
          )}
        </div>
      ) : (
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-left">
                <th className="px-4 py-3 font-semibold text-gray-600">#</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Name</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Email</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Added</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => (
                <tr key={m.id} className="border-b last:border-0 hover:bg-gray-50">
                  {editingId === m.id ? (
                    <>
                      <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, name: e.target.value }))
                          }
                          className="w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, email: e.target.value }))
                          }
                          className="w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                        />
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {new Date(m.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={handleUpdate}
                            disabled={saving}
                            className="px-3 py-1 rounded bg-brand-600 text-white text-xs hover:bg-brand-700 disabled:opacity-60"
                          >
                            {saving ? "…" : "Save"}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-3 py-1 rounded border text-xs hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {m.name}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{maskEmail(m.email)}</td>
                      <td className="px-4 py-3 text-gray-400">
                        {new Date(m.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(m)}
                            className="px-3 py-1 rounded border text-xs hover:bg-gray-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(m.id)}
                            className="px-3 py-1 rounded border border-red-200 text-red-500 text-xs hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2 bg-gray-50 border-t text-xs text-gray-400">
            {filtered.length} member{filtered.length !== 1 ? "s" : ""}
            {searchTerm ? ` matching "${searchTerm}"` : " total"}
          </div>
        </div>
      )}
    </div>
  );
}
