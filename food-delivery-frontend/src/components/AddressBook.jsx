"use client";

import { useState } from "react";
import { Home, MapPin, Plus, Star, Trash2, Edit, Loader2 } from "lucide-react";
import { toast } from "sonner";

import Modal from "./Modal";
import { useConfirm } from "./ConfirmDialog";
import { addressApi, apiErrorMessage } from "../services/api";
import { useAddresses } from "../hooks/useAddresses";

const EMPTY = {
  label: "Home",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
  isDefault: false,
};

export function AddressForm({ value, onChange }) {
  const set = (field) => (e) => onChange({ ...value, [field]: e.target.value });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="addr-label">Label</label>
        <input id="addr-label" type="text" value={value.label || ""} onChange={set("label")} className="input-field w-full" placeholder="Home, Office…" />
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="addr-line1">Address line 1 <span className="text-red-500">*</span></label>
        <input id="addr-line1" type="text" value={value.line1 || ""} onChange={set("line1")} className="input-field w-full" required />
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="addr-line2">Address line 2</label>
        <input id="addr-line2" type="text" value={value.line2 || ""} onChange={set("line2")} className="input-field w-full" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="addr-city">City <span className="text-red-500">*</span></label>
        <input id="addr-city" type="text" value={value.city || ""} onChange={set("city")} className="input-field w-full" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="addr-state">State</label>
        <input id="addr-state" type="text" value={value.state || ""} onChange={set("state")} className="input-field w-full" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="addr-pin">Postal code</label>
        <input id="addr-pin" type="text" value={value.postalCode || ""} onChange={set("postalCode")} className="input-field w-full" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="addr-country">Country</label>
        <input id="addr-country" type="text" value={value.country || ""} onChange={set("country")} className="input-field w-full" />
      </div>
    </div>
  );
}

/** Full manage view: add, edit, set default, delete. Used on the profile page. */
export default function AddressBook() {
  const confirm = useConfirm();
  const { addresses, isLoading, error, refresh } = useAddresses();

  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const openAdd = () => {
    setDraft(EMPTY);
    setEditingId(null);
    setIsOpen(true);
  };

  const openEdit = (address) => {
    setDraft(address);
    setEditingId(address.id);
    setIsOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingId) {
        await addressApi.update(editingId, draft);
        toast.success("Address updated");
      } else {
        await addressApi.create(draft);
        toast.success("Address saved");
      }
      setIsOpen(false);
      refresh();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not save that address"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDefault = async (address) => {
    setBusyId(address.id);
    try {
      await addressApi.makeDefault(address.id);
      refresh();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not set the default address"));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (address) => {
    const ok = await confirm({
      title: "Delete this address?",
      message: address.formatted,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;

    setBusyId(address.id);
    try {
      await addressApi.remove(address.id);
      toast.success("Address deleted");
      refresh();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not delete that address"));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary-500" aria-hidden="true" />
          Saved addresses
        </h2>
        <button onClick={openAdd} className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700">
          <Plus className="h-4 w-4" aria-hidden="true" /> Add
        </button>
      </div>

      {error && <div className="p-3 mb-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      {isLoading ? (
        <div className="py-6 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" /></div>
      ) : addresses.length === 0 ? (
        <p className="text-sm text-gray-500 py-4">
          No saved addresses yet. Add one so checkout can prefill it.
        </p>
      ) : (
        <ul className="space-y-3">
          {addresses.map((address) => (
            <li key={address.id} className="border rounded-lg p-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium flex items-center gap-2">
                  <Home className="h-4 w-4 text-gray-400" aria-hidden="true" />
                  {address.label || "Address"}
                  {address.isDefault && (
                    <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">Default</span>
                  )}
                </p>
                <p className="text-sm text-gray-600 mt-1 break-words">{address.formatted}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {!address.isDefault && (
                  <button onClick={() => handleDefault(address)} disabled={busyId === address.id} aria-label={`Make ${address.label || "this address"} the default`} title="Make default" className="p-2 text-gray-400 hover:text-amber-500 disabled:opacity-40">
                    <Star className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
                <button onClick={() => openEdit(address)} aria-label={`Edit ${address.label || "address"}`} title="Edit" className="p-2 text-gray-400 hover:text-blue-600">
                  <Edit className="h-4 w-4" aria-hidden="true" />
                </button>
                <button onClick={() => handleDelete(address)} disabled={busyId === address.id} aria-label={`Delete ${address.label || "address"}`} title="Delete" className="p-2 text-gray-400 hover:text-red-600 disabled:opacity-40">
                  {busyId === address.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editingId ? "Edit address" : "Add address"}>
        <form onSubmit={handleSave} className="space-y-4">
          <AddressForm value={draft} onChange={setDraft} />
          <div className="flex items-center gap-2">
            <input id="addr-default" type="checkbox" checked={Boolean(draft.isDefault)} onChange={(e) => setDraft({ ...draft, isDefault: e.target.checked })} className="h-4 w-4" />
            <label htmlFor="addr-default" className="text-sm text-gray-700">Use as my default address</label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isSaving} className="btn-primary flex items-center gap-2 disabled:opacity-60">
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}Save address
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
