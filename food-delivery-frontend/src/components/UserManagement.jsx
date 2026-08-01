"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Search, Edit, Trash2 } from "lucide-react";
import Modal from "../components/Modal";
import { mockApi } from "../services/mockApi";

export default function UserManagement() {
  const { user } = useAuth();

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const allUsers = await mockApi.getAllUsers();
      setUsers(allUsers);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleEdit = (user) => {
    setSelectedUser({ ...user }); 
    setIsModalOpen(true);
  };

  const handleDelete = async (userToDelete) => {
    if (window.confirm(`Are you sure you want to delete ${userToDelete.fullName || userToDelete.name}?`)) {
      try {
        // mockApi doesn't have delete user yet, let's simulate or add it.
        // For now, update local state to simulate deletion
        setUsers(users.filter(u => u.id !== userToDelete.id));
      } catch (err) {
        alert(`Error deleting user: ${err.message}`);
      }
    }
  };
  
  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
        // Mock update
        setUsers(users.map(u => (u.id === selectedUser.id ? selectedUser : u)));
        setIsModalOpen(false);
        setSelectedUser(null);
    } catch (err) {
        alert(`Error updating user: ${err.message}`);
    }
  };

  const filteredUsers = users.filter(user =>
    (user.fullName?.toLowerCase() || user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="mb-4 relative">
        <input
          type="text"
          placeholder="Search by name or email..."
          className="input-field pl-10 w-full"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
      </div>

      {error && <div className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</div>}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-header">Name</th>
              <th className="table-header">Email</th>
              <th className="table-header">Role</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="4" className="text-center py-4">Loading users...</td></tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user.id} className="border-b">
                  <td className="table-cell">{user.fullName || user.name}</td>
                  <td className="table-cell">{user.email}</td>
                  <td className="table-cell">{user.role}</td>
                  <td className="table-cell">
                    <button onClick={() => handleEdit(user)} className="text-blue-500 hover:text-blue-700 p-2"><Edit size={18} /></button>
                    <button onClick={() => handleDelete(user)} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Edit User">
        {selectedUser && (
          <form onSubmit={handleSaveChanges}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input type="text" value={selectedUser.fullName || selectedUser.name || ''} onChange={e => setSelectedUser({...selectedUser, fullName: e.target.value, name: e.target.value})} className="input-field w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" value={selectedUser.email || ''} onChange={e => setSelectedUser({...selectedUser, email: e.target.value})} className="input-field w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select value={selectedUser.role || 'CUSTOMER'} onChange={e => setSelectedUser({...selectedUser, role: e.target.value})} className="input-field w-full">
                  <option value="CUSTOMER">Customer</option>
                  <option value="RESTAURANT">Restaurant Owner</option>
                  <option value="DELIVERY_PARTNER">Delivery Partner</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}