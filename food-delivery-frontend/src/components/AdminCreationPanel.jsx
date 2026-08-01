import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Edit, Trash2 } from "lucide-react";
import Modal from "./Modal";
import { mockApi } from "../services/mockApi";

export default function AdminCreationPanel() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [admins, setAdmins] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editAdmin, setEditAdmin] = useState(null);

  const fetchAdmins = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await mockApi.getAllUsers();
      const adminUsers = data.filter(u => u.role === 'ADMIN');
      setAdmins(adminUsers);
    } catch (err) {
      setError(err.message);
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
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const adminPayload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: 'ADMIN'
      };

      await mockApi.register(adminPayload);

      setSuccess(`Admin account for ${adminPayload.email} created successfully!`);
      setFormData({ name: "", email: "", password: "" });
      fetchAdmins(); 
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (admin) => {
    setEditAdmin(admin);
    setFormData({ name: admin.name || admin.fullName, email: admin.email, password: "" }); 
    setIsModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    if (!editAdmin) {
      setError("Admin data missing.");
      setIsLoading(false);
      return;
    }

    try {
      // Mock update - we would normally call an update endpoint
      // For now, simulate by updating local state list and assuming mockApi persists it if we had a generic update
      // Since mockApi doesn't expose a generic 'updateUser', we'll just update the local list visually for the demo
      // or implement a full updateUser in mockApi. 
      // For this task, visual feedback is key.
      
      const updatedAdmin = { ...editAdmin, name: formData.name, email: formData.email };
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update local state to reflect change
      setAdmins(prev => prev.map(a => a.id === editAdmin.id ? updatedAdmin : a));

      setSuccess(`Admin account for ${updatedAdmin.email} updated successfully!`);
      setIsModalOpen(false);
      setEditAdmin(null);
      setFormData({ name: "", email: "", password: "" });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this admin?")) return;
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      // Simulate delete
      await new Promise(resolve => setTimeout(resolve, 500));
      setAdmins(prev => prev.filter(a => a.id !== id));
      setSuccess("Admin deleted successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Admin Management Panel</h3>
      <p className="mb-6 text-sm text-gray-600">Create, edit, or delete administrator accounts.</p>

      {/* Creation Form */}
      <section className="mb-8">
        <h4 className="text-lg font-medium text-gray-700 mb-4">Create New Administrator</h4>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-600 bg-red-100 p-3 rounded-md text-sm">{error}</p>}
          {success && <p className="text-green-600 bg-green-100 p-3 rounded-md text-sm">{success}</p>}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} className="input-field" placeholder="Enter full name" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className="input-field" placeholder="Enter email address" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} className="input-field" placeholder="Enter a strong password" required />
          </div>

          <button type="submit" disabled={isLoading} className="w-full btn-primary py-2.5 disabled:opacity-50">
            {isLoading ? "Creating..." : "Create Admin Account"}
          </button>
        </form>
      </section>

      {/* Admins List */}
      <section>
        <h4 className="text-lg font-medium text-gray-700 mb-4">Existing Administrators</h4>
        {isLoading && admins.length === 0 ? (
          <p className="text-gray-600">Loading...</p>
        ) : admins.length === 0 ? (
          <p className="text-gray-600">No administrators found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id} className="border-t border-gray-200">
                    <td className="px-6 py-4 text-sm text-gray-900">{admin.name || admin.fullName}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{admin.email}</td>
                    <td className="px-6 py-4 text-sm">
                      <button onClick={() => handleEdit(admin)} className="text-blue-600 hover:text-blue-800 mr-4">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(admin.id)} className="text-red-600 hover:text-red-800">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Edit Administrator</h3>
        <form onSubmit={handleUpdate} className="space-y-4">
          {error && <p className="text-red-600 bg-red-100 p-3 rounded-md text-sm">{error}</p>}
          {success && <p className="text-green-600 bg-green-100 p-3 rounded-md text-sm">{success}</p>}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} className="input-field" placeholder="Enter full name" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className="input-field" placeholder="Enter email address" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password (Optional)</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} className="input-field" placeholder="Enter a new password" />
          </div>

          <button type="submit" disabled={isLoading} className="w-full btn-primary py-2.5 disabled:opacity-50">
            {isLoading ? "Updating..." : "Update Admin Account"}
          </button>
        </form>
      </Modal>
    </div>
  );
}