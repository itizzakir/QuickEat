"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Edit, Trash2, Loader2, ShieldOff, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import Modal from "../components/Modal";
import { adminApi, apiErrorMessage } from "../services/api";
import { useConfirm } from "./ConfirmDialog";
import { useAuth } from "../contexts/AuthContext";

const ROLES = ["ROLE_CUSTOMER", "ROLE_RESTAURANT", "ROLE_DELIVERY", "ROLE_ADMIN"];

const ROLE_BADGES = {
  ROLE_CUSTOMER: { label: "Customer", classes: "bg-blue-100 text-blue-800" },
  ROLE_RESTAURANT: { label: "Restaurant", classes: "bg-green-100 text-green-800" },
  ROLE_DELIVERY: { label: "Delivery", classes: "bg-orange-100 text-orange-800" },
  ROLE_ADMIN: { label: "Admin", classes: "bg-purple-100 text-purple-800" },
};

const PAGE_SIZE = 10;

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const confirm = useConfirm();

  const [page, setPage] = useState(null);
  const [pageNumber, setPageNumber] = useState(0);
  const [roleFilter, setRoleFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  // Search is server-side now, so debounce to avoid a request per keystroke.
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setPageNumber(0);
    }, 350);
    return () => clearTimeout(id);
  }, [searchTerm]);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await adminApi.users({
        role: roleFilter || undefined,
        search: debouncedSearch || undefined,
        page: pageNumber,
        size: PAGE_SIZE,
      });
      setPage(data);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not load users"));
    } finally {
      setIsLoading(false);
    }
  }, [roleFilter, debouncedSearch, pageNumber]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleEdit = (user) => {
    setSelectedUser({ ...user, password: "" });
    setIsModalOpen(true);
  };

  const handleDelete = async (target) => {
    const ok = await confirm({
      title: "Delete this user?",
      message: `${target.fullName} (${target.email}) will be permanently removed.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    setBusyId(target.id);
    try {
      await adminApi.deleteUser(target.id);
      toast.success(`${target.fullName} deleted`);
      fetchUsers();
    } catch (err) {
      // The server refuses to orphan order history — surface that reason verbatim.
      toast.error(apiErrorMessage(err, "Could not delete that user"));
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleEnabled = async (target) => {
    setBusyId(target.id);
    try {
      const saved = await adminApi.setUserEnabled(target.id, !target.enabled);
      toast.success(`${saved.fullName} ${saved.enabled ? "reinstated" : "suspended"}`);
      fetchUsers();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not change that account"));
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsSaving(true);
    try {
      await adminApi.updateUser(selectedUser.id, {
        fullName: selectedUser.fullName,
        email: selectedUser.email,
        role: selectedUser.role,
        mobile: selectedUser.mobile,
        address: selectedUser.address,
        avatarUrl: selectedUser.avatarUrl,
        enabled: selectedUser.enabled,
        // Blank means "leave the password alone".
        password: selectedUser.password || undefined,
      });
      toast.success("User updated");
      setIsModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not update that user"));
    } finally {
      setIsSaving(false);
    }
  };

  const users = page?.content || [];

  return (
    <div>
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            className="input-field pl-10 w-full"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPageNumber(0); }}
          className="input-field sm:w-56"
        >
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{ROLE_BADGES[r].label}</option>
          ))}
        </select>
      </div>

      {error && <div className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</div>}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-header">Name</th>
              <th className="table-header">Email</th>
              <th className="table-header">Role</th>
              <th className="table-header">Status</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="5" className="text-center py-6"><Loader2 className="animate-spin h-6 w-6 mx-auto text-gray-400" /></td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="5" className="text-center py-6 text-gray-500">No users match that search.</td></tr>
            ) : (
              users.map((user) => {
                const badge = ROLE_BADGES[user.role] || { label: user.role, classes: "bg-gray-100 text-gray-800" };
                const isSelf = currentUser?.id === user.id;
                return (
                  <tr key={user.id} className="border-b">
                    <td className="table-cell">
                      {user.fullName}
                      {isSelf && <span className="ml-2 text-xs text-gray-400">(you)</span>}
                    </td>
                    <td className="table-cell">{user.email}</td>
                    <td className="table-cell">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${badge.classes}`}>{badge.label}</span>
                    </td>
                    <td className="table-cell">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.enabled ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {user.enabled ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="table-cell whitespace-nowrap">
                      <button onClick={() => handleEdit(user)} title="Edit" className="text-blue-500 hover:text-blue-700 p-2"><Edit size={18} /></button>
                      <button
                        onClick={() => handleToggleEnabled(user)}
                        disabled={busyId === user.id || isSelf}
                        title={isSelf ? "You cannot suspend your own account" : (user.enabled ? "Suspend" : "Reinstate")}
                        className="text-amber-600 hover:text-amber-800 p-2 disabled:opacity-30"
                      >
                        {user.enabled ? <ShieldOff size={18} /> : <ShieldCheck size={18} />}
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        disabled={busyId === user.id || isSelf}
                        title={isSelf ? "You cannot delete your own account" : "Delete"}
                        className="text-red-500 hover:text-red-700 p-2 disabled:opacity-30"
                      >
                        {busyId === user.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {page && page.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <p className="text-gray-600">
            Page {page.page + 1} of {page.totalPages} · {page.totalElements} users
          </p>
          <div className="flex gap-2">
            <button onClick={() => setPageNumber((n) => Math.max(0, n - 1))} disabled={page.first} className="btn-secondary disabled:opacity-40">Previous</button>
            <button onClick={() => setPageNumber((n) => n + 1)} disabled={page.last} className="btn-secondary disabled:opacity-40">Next</button>
          </div>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Edit User">
        {selectedUser && (
          <form onSubmit={handleSaveChanges}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input type="text" value={selectedUser.fullName || ''} onChange={e => setSelectedUser({...selectedUser, fullName: e.target.value})} className="input-field w-full" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" value={selectedUser.email || ''} onChange={e => setSelectedUser({...selectedUser, email: e.target.value})} className="input-field w-full" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Mobile</label>
                <input type="tel" value={selectedUser.mobile || ''} onChange={e => setSelectedUser({...selectedUser, mobile: e.target.value})} className="input-field w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select value={selectedUser.role || 'ROLE_CUSTOMER'} onChange={e => setSelectedUser({...selectedUser, role: e.target.value})} className="input-field w-full">
                  {ROLES.map((r) => <option key={r} value={r}>{ROLE_BADGES[r].label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">New password (optional)</label>
                <input type="password" value={selectedUser.password} onChange={e => setSelectedUser({...selectedUser, password: e.target.value})} className="input-field w-full" placeholder="Leave blank to keep the current one" />
              </div>
              <div className="flex items-center gap-2">
                <input id="enabled" type="checkbox" checked={selectedUser.enabled !== false} onChange={e => setSelectedUser({...selectedUser, enabled: e.target.checked})} className="h-4 w-4" />
                <label htmlFor="enabled" className="text-sm text-gray-700">Account active</label>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={isSaving} className="btn-primary flex items-center gap-2 disabled:opacity-60">
                  {isSaving && <Loader2 className="animate-spin h-4 w-4" />}Save Changes
                </button>
              </div>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
