"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Search, Edit, Trash2 } from "lucide-react";
import Modal from "./Modal"; 
import { api } from "../services/api";

export default function RestaurantManagement() {
  const { user } = useAuth();

  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

  const fetchRestaurants = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const allRestaurants = await api.getRestaurants();
      setRestaurants(allRestaurants);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  const handleEdit = (restaurant) => {
    setSelectedRestaurant({ ...restaurant, address: restaurant.address || {} });
    setIsModalOpen(true);
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!selectedRestaurant) return;

    try {
      // Mock update
      setRestaurants(prev => prev.map(r => (r.id === selectedRestaurant.id ? selectedRestaurant : r)));
      setIsModalOpen(false);
      setSelectedRestaurant(null);
    } catch (err) {
      alert(`Error updating restaurant: ${err.message}`);
    }
  };
  
  const handleDelete = async (resto) => {
      if(window.confirm(`Are you sure you want to delete ${resto.name}?`)) {
          setRestaurants(prev => prev.filter(r => r.id !== resto.id));
      }
  }
  
  const handleRestaurantChange = (e) => {
    const { name, value } = e.target;
    setSelectedRestaurant(prev => ({ ...prev, [name]: value }));
  };
  
  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setSelectedRestaurant(prev => ({
        ...prev,
        address: {
            ...prev.address,
            [name]: value
        }
    }));
  };

  const getStatus = (restaurant) => {
    return restaurant.active ? "Approved" : "Pending";
  }

  return (
    <div>
      {error && <div className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</div>}
      <div className="overflow-x-auto">
          <table className="min-w-full bg-white text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan="5" className="text-center py-4 px-6">Loading restaurants...</td></tr>
            ) : (
              restaurants.map(resto => (
                <tr key={resto.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{resto.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{resto.owner?.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{resto.address?.city || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                     <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        getStatus(resto) === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {getStatus(resto)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEdit(resto)} className="text-indigo-600 hover:text-indigo-900 mr-2"><Edit size={18} /></button>
                    <button onClick={() => handleDelete(resto)} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Edit Restaurant">
        {selectedRestaurant && (
          <form onSubmit={handleSaveChanges} className="max-h-[70vh] overflow-y-auto p-1">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Restaurant Details</h3>
              <div><label className="block text-sm font-medium">Name</label><input type="text" name="name" value={selectedRestaurant.name || ''} onChange={handleRestaurantChange} className="input-field w-full" /></div>
              <div><label className="block text-sm font-medium">Email</label><input type="email" name="email" value={selectedRestaurant.email || ''} onChange={handleRestaurantChange} className="input-field w-full" /></div>
              <div><label className="block text-sm font-medium">Phone</label><input type="tel" name="phone" value={selectedRestaurant.phone || ''} onChange={handleRestaurantChange} className="input-field w-full" /></div>
              <div><label className="block text-sm font-medium">Categories</label><input type="text" name="categories" value={selectedRestaurant.categories || ''} onChange={handleRestaurantChange} className="input-field w-full" /></div>
              <div><label className="block text-sm font-medium">Estimated Delivery Time (mins)</label><input type="number" name="estimatedDeliveryTime" value={selectedRestaurant.estimatedDeliveryTime || ''} onChange={handleRestaurantChange} className="input-field w-full" /></div>
              
              <h3 className="text-lg font-semibold border-b pb-2 pt-4">Address Details</h3>
              <div><label className="block text-sm font-medium">Line 1</label><input type="text" name="line1" value={selectedRestaurant.address?.line1 || ''} onChange={handleAddressChange} className="input-field w-full" /></div>
              <div><label className="block text-sm font-medium">City</label><input type="text" name="city" value={selectedRestaurant.address?.city || ''} onChange={handleAddressChange} className="input-field w-full" /></div>
              <div><label className="block text-sm font-medium">State</label><input type="text" name="state" value={selectedRestaurant.address?.state || ''} onChange={handleAddressChange} className="input-field w-full" /></div>
              <div><label className="block text-sm font-medium">Postal Code</label><input type="text" name="postalCode" value={selectedRestaurant.address?.postalCode || ''} onChange={handleAddressChange} className="input-field w-full" /></div>
              <div><label className="block text-sm font-medium">Country</label><input type="text" name="country" value={selectedRestaurant.address?.country || ''} onChange={handleAddressChange} className="input-field w-full" /></div>
              
              <h3 className="text-lg font-semibold border-b pb-2 pt-4">Status</h3>
              <div>
                <label className="block text-sm font-medium">Approval Status</label>
                <select value={selectedRestaurant.active} onChange={e => setSelectedRestaurant({...selectedRestaurant, active: e.target.value === 'true'})} className="input-field w-full">
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