import { useState, useEffect, useCallback } from "react";
import { Edit, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import Modal from "./Modal";
import { adminApi, apiErrorMessage } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useConfirm } from "./ConfirmDialog";

const EMPTY_FORM = { fullName: "", email: "", password: "", mobile: "" };

export default function AdminCreationPanel() {
  const { user: currentUser } = useAuth();
  const confirm = useConfirm();

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [admins, setAdmins] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editAdmin, setEditAdmin] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const fetchAdmins = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      // Filtered server-side on the real enum value. This used to fetch everyone and compare
      // against 'ADMIN', which never matched because the backend sends 'ROLE_ADMIN'.
      const page = await adminApi.users({ role: "ROLE_ADMIN", size: 100 });
      setAdmins(page.content || []);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not load administrators"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    try {
      const created = await adminApi.createUser({ ...formData, role: "ROLE_ADMIN" });
      toast.success(`Admin account for ${created.email} created`);
      setFormData(EMPTY_FORM);
      fetchAdmins();
    } catch (err) {
      setError(apiErrorMessage(err, "Could not create that administrator"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (admin) => {
    setEditAdmin(admin);
    setFormData({
      fullName: admin.fullName,
      email: admin.email,
      password: "",
      mobile: admin.mobile || "",
    });
    setIsModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editAdmin) return;
    setIsSaving(true);
    setError("");
    try {
      await adminApi.updateUser(editAdmin.id, {
        fullName: formData.fullName,
        email: formData.email,
        mobile: formData.mobile,
        role: "ROLE_ADMIN",
        // Blank leaves the existing password untouched.
        password: formData.password || undefined,
      });
      toast.success(`Admin account for ${formData.email} updated`);
      setIsModalOpen(false);
      setEditAdmin(null);
      setFormData(EMPTY_FORM);
      fetchAdmins();
    } catch (err) {
      setError(apiErrorMessage(err, "Could not update that administrator"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (admin) => {
    const ok = await confirm({
      title: "Delete this administrator?",
      message: `${admin.fullName} (${admin.email}) will lose access immediately.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    setBusyId(admin.id);
    try {
      await adminApi.deleteUser(admin.id);
      toast.success("Administrator deleted");
      fetchAdmins();
    } catch (err) {
      // The server refuses to remove the last remaining admin, or your own account.
      toast.error(apiErrorMessage(err, "Could not delete that administrator"));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Admin Management Panel</h3>
      <p className="mb-6 text-sm text-gray-600">Create, edit, or delete administrator accounts.</p>

      <section className="mb-8">
        <h4 className="text-lg font-medium text-gray-700 mb-4">Create New Administrator</h4>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-600 bg-red-100 p-3 rounded-md text-sm">{error}</p>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="input-field" placeholder="Enter full name" required minLength={3} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className="input-field" placeholder="Enter email address" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
            <input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} className="input-field" placeholder="Optional" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} className="input-field" placeholder="At least 6 characters" required minLength={6} />
          </div>

          <button type="submit" disabled={isSaving} className="w-full btn-primary py-2.5 disabled:opacity-50 flex items-center justify-center gap-2">
            {isSaving && <Loader2 className="animate-spin h-4 w-4" />}
            {isSaving ? "Creating..." : "Create Admin Account"}
          </button>
        </form>
      </section>

      <section>
        <h4 className="text-lg font-medium text-gray-700 mb-4">Existing Administrators</h4>
        {isLoading ? (
          <div className="py-6 text-center"><Loader2 className="animate-spin h-6 w-6 mx-auto text-gray-400" /></div>
        ) : admins.length === 0 ? (
          <p className="text-gray-600">No administrators found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => {
                  const isSelf = currentUser?.id === admin.id;
                  return (
                    <tr key={admin.id} className="border-t border-gray-200">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {admin.fullName}
                        {isSelf && <span className="ml-2 text-xs text-gray-400">(you)</span>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{admin.email}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${admin.enabled ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                          {admin.enabled ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap">
                        <button onClick={() => handleEdit(admin)} className="text-blue-600 hover:text-blue-800 mr-4">
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(admin)}
                          disabled={busyId === admin.id || isSelf}
                          title={isSelf ? "You cannot delete your own account" : "Delete"}
                          className="text-red-600 hover:text-red-800 disabled:opacity-30"
                        >
                          {busyId === admin.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Edit Administrator</h3>
        <form onSubmit={handleUpdate} className="space-y-4">
          {error && <p className="text-red-600 bg-red-100 p-3 rounded-md text-sm">{error}</p>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="input-field" required minLength={3} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
            <input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password (Optional)</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} className="input-field" placeholder="Leave blank to keep the current one" />
          </div>

          <button type="submit" disabled={isSaving} className="w-full btn-primary py-2.5 disabled:opacity-50 flex items-center justify-center gap-2">
            {isSaving && <Loader2 className="animate-spin h-4 w-4" />}
            {isSaving ? "Updating..." : "Update Admin Account"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
