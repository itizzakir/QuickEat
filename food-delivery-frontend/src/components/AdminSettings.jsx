"use client";

import { useState } from "react";
import { KeyRound, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "../contexts/AuthContext";
import { authApi, apiErrorMessage } from "../services/api";

/**
 * Account security for the signed-in admin.
 *
 * The notification and appearance panels that used to sit here were removed rather than
 * rewired: nothing on the server stores those preferences, so the switches wrote to component
 * state and reset on every navigation. Shipping controls that quietly do nothing is worse than
 * not shipping them — they can come back alongside a real settings endpoint.
 */
export default function SystemSettings() {
  const { user } = useAuth();

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (form.newPassword !== form.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (form.newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      await authApi.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      toast.success("Password updated");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setError(apiErrorMessage(err, "Could not update your password"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 p-4 md:p-0">
      <div className="max-w-2xl">
        <h3 className="text-lg font-semibold flex items-center mb-2">
          <KeyRound className="mr-2" /> Account Security
        </h3>

        {error && <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-md animate-fade-in">{error}</div>}

        <form onSubmit={handlePasswordChange} className="bg-white p-4 rounded-lg border space-y-4">
          <div>
            <label className="block text-sm font-medium">Admin Email (Read-only)</label>
            <input type="email" value={user?.email || ""} className="input-field w-full mt-1 bg-gray-100" readOnly />
          </div>
          <div>
            <label className="block text-sm font-medium">Current Password</label>
            <input type="password" name="currentPassword" value={form.currentPassword} onChange={handleChange} placeholder="Enter current password" className="input-field w-full mt-1" required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">New Password</label>
              <input type="password" name="newPassword" value={form.newPassword} onChange={handleChange} placeholder="At least 6 characters" className="input-field w-full mt-1" required minLength={6} />
            </div>
            <div>
              <label className="block text-sm font-medium">Confirm New Password</label>
              <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Confirm new password" className="input-field w-full mt-1" required />
            </div>
          </div>
          <button type="submit" disabled={isSaving} className="btn-primary flex items-center justify-center w-full md:w-auto disabled:opacity-60">
            {isSaving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save size={16} className="mr-2" />}
            {isSaving ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
