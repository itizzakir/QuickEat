"use client";

import { useState, useEffect, useCallback } from "react";
import { Edit, Trash2, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

import Modal from "./Modal";
import { adminApi, apiErrorMessage, restaurantApi } from "../services/api";
import { useConfirm } from "./ConfirmDialog";

export default function RestaurantManagement() {
  const confirm = useConfirm();
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const fetchRestaurants = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      // The admin listing includes unapproved restaurants; the public one does not.
      setRestaurants(await adminApi.restaurants());
    } catch (err) {
      setError(apiErrorMessage(err, "Could not load restaurants"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  const handleEdit = (restaurant) => {
    // `address` is a plain string on the API. This used to coerce it into an object and then
    // bind address.line1 / address.city, which were always undefined.
    setSelectedRestaurant({ ...restaurant });
    setIsModalOpen(true);
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!selectedRestaurant) return;
    setIsSaving(true);
    try {
      await restaurantApi.update(selectedRestaurant.id, {
        name: selectedRestaurant.name,
        description: selectedRestaurant.description,
        address: selectedRestaurant.address,
        image: selectedRestaurant.image,
        category: selectedRestaurant.category,
        deliveryTime: selectedRestaurant.deliveryTime ? Number(selectedRestaurant.deliveryTime) : null,
        deliveryFee: selectedRestaurant.deliveryFee,
        discount: selectedRestaurant.discount,
      });
      toast.success(`${selectedRestaurant.name} updated`);
      setIsModalOpen(false);
      setSelectedRestaurant(null);
      fetchRestaurants();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not update that restaurant"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetApproved = async (restaurant, approved) => {
    setBusyId(restaurant.id);
    try {
      await adminApi.setRestaurantApproved(restaurant.id, approved);
      toast.success(`${restaurant.name} ${approved ? "approved" : "unapproved"}`);
      fetchRestaurants();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not change approval"));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (restaurant) => {
    const ok = await confirm({
      title: "Delete this restaurant?",
      message: `${restaurant.name} and its entire menu will be removed.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    setBusyId(restaurant.id);
    try {
      await adminApi.deleteRestaurant(restaurant.id);
      toast.success(`${restaurant.name} deleted`);
      fetchRestaurants();
    } catch (err) {
      // Refused when orders reference it — the message says to unapprove instead.
      toast.error(apiErrorMessage(err, "Could not delete that restaurant"));
    } finally {
      setBusyId(null);
    }
  };

  const handleRestaurantChange = (e) => {
    const { name, value } = e.target;
    setSelectedRestaurant((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div>
      {error && <div className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</div>}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Categories</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan="6" className="text-center py-6"><Loader2 className="animate-spin h-6 w-6 mx-auto text-gray-400" /></td></tr>
            ) : restaurants.length === 0 ? (
              <tr><td colSpan="6" className="text-center py-6 text-gray-500">No restaurants yet.</td></tr>
            ) : (
              restaurants.map((resto) => (
                <tr key={resto.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{resto.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{resto.category || "—"}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={resto.address}>{resto.address || "—"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{resto.rating?.toFixed(1) ?? "—"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${resto.approved ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                      {resto.approved ? "Approved" : "Pending"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {resto.approved ? (
                      <button onClick={() => handleSetApproved(resto, false)} disabled={busyId === resto.id} title="Unapprove" className="text-yellow-600 hover:text-yellow-800 mr-2 disabled:opacity-30"><X size={18} /></button>
                    ) : (
                      <button onClick={() => handleSetApproved(resto, true)} disabled={busyId === resto.id} title="Approve" className="text-green-600 hover:text-green-800 mr-2 disabled:opacity-30"><Check size={18} /></button>
                    )}
                    <button onClick={() => handleEdit(resto)} title="Edit" className="text-indigo-600 hover:text-indigo-900 mr-2"><Edit size={18} /></button>
                    <button onClick={() => handleDelete(resto)} disabled={busyId === resto.id} title="Delete" className="text-red-600 hover:text-red-900 disabled:opacity-30">
                      {busyId === resto.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                    </button>
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
              <div><label className="block text-sm font-medium">Name</label><input type="text" name="name" value={selectedRestaurant.name || ''} onChange={handleRestaurantChange} className="input-field w-full" required /></div>
              <div><label className="block text-sm font-medium">Description</label><textarea rows={2} name="description" value={selectedRestaurant.description || ''} onChange={handleRestaurantChange} className="input-field w-full" /></div>
              <div><label className="block text-sm font-medium">Address</label><input type="text" name="address" value={selectedRestaurant.address || ''} onChange={handleRestaurantChange} className="input-field w-full" /></div>
              <div><label className="block text-sm font-medium">Categories</label><input type="text" name="category" value={selectedRestaurant.category || ''} onChange={handleRestaurantChange} className="input-field w-full" placeholder="Biryani, Indian" /></div>
              <div><label className="block text-sm font-medium">Delivery Time (mins)</label><input type="number" min="5" max="180" name="deliveryTime" value={selectedRestaurant.deliveryTime ?? ''} onChange={handleRestaurantChange} className="input-field w-full" /></div>
              <div><label className="block text-sm font-medium">Delivery Fee</label><input type="text" name="deliveryFee" value={selectedRestaurant.deliveryFee || ''} onChange={handleRestaurantChange} className="input-field w-full" placeholder="FREE or 29" /></div>
              <div><label className="block text-sm font-medium">Discount</label><input type="text" name="discount" value={selectedRestaurant.discount || ''} onChange={handleRestaurantChange} className="input-field w-full" /></div>
              <div><label className="block text-sm font-medium">Image URL</label><input type="text" name="image" value={selectedRestaurant.image || ''} onChange={handleRestaurantChange} className="input-field w-full" /></div>

              <p className="text-xs text-gray-500">
                Approval is changed from the table, not here — it is an admin decision rather
                than part of the restaurant record.
              </p>

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
