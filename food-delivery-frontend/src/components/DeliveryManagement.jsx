"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Search, Edit, Trash2 } from "lucide-react";
import Modal from "./Modal";
import { mockApi } from "../services/mockApi";

export default function DeliveryManagement() {
  const { user } = useAuth();

  const [partners, setPartners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);

  const fetchPartners = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const allUsers = await mockApi.getAllUsers();
      // Filter for delivery partners locally for now, assuming role field
      const deliveryPartners = allUsers.filter(u => u.role === 'DELIVERY_PARTNER');
      setPartners(deliveryPartners);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const handleEdit = (partner) => {
    setSelectedPartner({ ...partner }); // Create a copy for editing
    setIsModalOpen(true);
  };

  const handleDelete = async (partnerToDelete) => {
    if (window.confirm(`Are you sure you want to delete the partner: ${partnerToDelete.name}?`)) {
      try {
        setPartners(prev => prev.filter(p => p.id !== partnerToDelete.id));
      } catch (err) {
        alert(`Error deleting partner: ${err.message}`);
      }
    }
  };
  
  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!selectedPartner) return;

    try {
      // Mock update
      setPartners(prev => prev.map(p => (p.id === selectedPartner.id ? selectedPartner : p)));
      setIsModalOpen(false);
      setSelectedPartner(null);
    } catch (err) {
      alert(`Error updating partner: ${err.message}`);
    }
  };

    const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setSelectedPartner(prev => ({
        ...prev,
        deliveryPartnerProfile: {
            ...prev.deliveryPartnerProfile,
            [name]: value
        }
    }));
  };

 return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Delivery Partners</h2>

      {error && <div className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</div>}
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle Type</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle Registration Number</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">License Number</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan="6" className="text-center py-4 px-6">Loading...</td></tr>
            ) : (
              partners.map(partner => (
                <tr key={partner.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{partner.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{partner.deliveryPartnerProfile?.vehicleType || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{partner.deliveryPartnerProfile?.vehicleRegistrationNumber || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{partner.deliveryPartnerProfile?.licenseNumber || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{partner.deliveryPartnerProfile?.zone || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                     <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${partner.available ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {partner.available ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEdit(partner)} className="text-indigo-600 hover:text-indigo-900 mr-2"><Edit size={18} /></button>
                    <button onClick={() => handleDelete(partner)} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Edit Delivery Partner">
        {selectedPartner && (
          // The form now has a max height and will scroll if it's too long
          <form onSubmit={handleSaveChanges} className="max-h-[70vh] overflow-y-auto p-1">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">User Details</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input type="text" value={selectedPartner.name} onChange={e => setSelectedPartner({...selectedPartner, name: e.target.value})} className="input-field w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" value={selectedPartner.email} onChange={e => setSelectedPartner({...selectedPartner, email: e.target.value})} className="input-field w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input type="tel" value={selectedPartner.phone || ''} onChange={e => setSelectedPartner({...selectedPartner, phone: e.target.value})} className="input-field w-full" />
              </div>

              <h3 className="text-lg font-semibold border-b pb-2 pt-4">Profile Details</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700">License Number</label>
                <input type="text" name="licenseNumber" value={selectedPartner.deliveryPartnerProfile?.licenseNumber || ''} onChange={handleProfileChange} className="input-field w-full" />
              </div>
               <div>
                <label className="block text-sm font-medium text-gray-700">Vehicle Type</label>
                {/* ★★★ FIX 4: CORRECTLY HANDLE ENUM VALUES ★★★ */}
                <select name="vehicleType" value={selectedPartner.deliveryPartnerProfile?.vehicleType || 'MOTORCYCLE'} onChange={handleProfileChange} className="input-field w-full">
                  <option value="MOTORCYCLE">Motorcycle</option>
                  <option value="SCOOTER">Scooter</option>
                  <option value="CAR">Car</option>
                  <option value="BICYCLE">Bicycle</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Vehicle Model</label>
                <input type="text" name="vehicleModel" value={selectedPartner.deliveryPartnerProfile?.vehicleModel || ''} onChange={handleProfileChange} className="input-field w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Vehicle Registration Number</label>
                <input type="text" name="vehicleRegistrationNumber" value={selectedPartner.deliveryPartnerProfile?.vehicleRegistrationNumber || ''} onChange={handleProfileChange} className="input-field w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Zone</label>
                <input type="text" name="zone" value={selectedPartner.deliveryPartnerProfile?.zone || ''} onChange={handleProfileChange} className="input-field w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Approval Status</label>
                <select value={selectedPartner.available} onChange={e => setSelectedPartner({...selectedPartner, available: e.target.value === 'true'})} className="input-field w-full">
                  <option value={true}>Approved</option>
                  <option value={false}>Pending</option>
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
