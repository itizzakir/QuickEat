"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { KeyRound, Bell, Palette, Save, Loader2 } from "lucide-react";
import { mockApi } from "../services/mockApi";

export default function SystemSettings() {
  const { user } = useAuth();

  const [settings, setSettings] = useState({
    adminEmail: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    emailOnNewUser: true,
    emailOnNewRestaurant: true,
    theme: 'Light',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      // Mock loading default settings
      await new Promise(resolve => setTimeout(resolve, 500));
      // In a real app, this would come from an API
      // Since it's a frontend-only mock, we can just use default state or localStorage if we implemented it
    } catch (err) {
      setError(`Failed to load settings: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setSuccess("");
    setError("");
  };

  const handlePasswordChange = async (e) => {
      e.preventDefault();
      if (settings.newPassword !== settings.confirmPassword) {
          setError("New passwords do not match.");
          return;
      }
      if (!settings.currentPassword || !settings.newPassword) {
          setError("All password fields are required.");
          return;
      }
      
      setIsSaving(true);
      setSuccess("");
      setError("");
      try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          setSuccess("Password updated successfully!");
          setSettings(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: ''}));
      } catch (err) {
          setError(`Failed to update password: ${err.message}`);
      } finally {
          setIsSaving(false);
      }
  };

  const handleSettingsSave = async (section) => {
    setIsSaving(true);
    setSuccess("");
    setError("");
    try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSuccess(`${section.charAt(0).toUpperCase() + section.slice(1)} settings saved!`);
    } catch (err) {
        setError(`Failed to save settings: ${err.message}`);
    } finally {
        setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return <div className="p-4">Loading settings...</div>;
  }

  return (
    <div className="space-y-8 p-4 md:p-0">
      {/* Universal feedback messages at the top */}
      {error && <div className="p-3 bg-red-100 text-red-700 rounded-md animate-fade-in">{error}</div>}
      {success && <div className="p-3 bg-green-100 text-green-700 rounded-md animate-fade-in">{success}</div>}
      
      {/* Using a grid for responsive layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Account Security (takes up more space) */}
        <div className="lg:col-span-2">
            <h3 className="text-lg font-semibold flex items-center mb-2"><KeyRound className="mr-2" /> Account Security</h3>
            <form onSubmit={handlePasswordChange} className="bg-white p-4 rounded-lg border space-y-4">
              <div>
                <label className="block text-sm font-medium">Admin Email (Read-only)</label>
                <input type="email" value={settings.adminEmail} className="input-field w-full mt-1 bg-gray-100" readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium">Current Password</label>
                <input type="password" name="currentPassword" value={settings.currentPassword} onChange={handleChange} placeholder="Enter current password" className="input-field w-full mt-1" required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">New Password</label>
                  <input type="password" name="newPassword" value={settings.newPassword} onChange={handleChange} placeholder="Enter new password" className="input-field w-full mt-1" required />
                </div>
                <div>
                  <label className="block text-sm font-medium">Confirm New Password</label>
                  <input type="password" name="confirmPassword" value={settings.confirmPassword} onChange={handleChange} placeholder="Confirm new password" className="input-field w-full mt-1" required />
                </div>
              </div>
              <button type="submit" disabled={isSaving} className="btn-primary flex items-center justify-center w-full md:w-auto">
                  {isSaving ? <Loader2 className="animate-spin mr-2"/> : <Save size={16} className="mr-2"/>}
                  {isSaving ? 'Updating...' : 'Update Password'}
              </button>
            </form>
        </div>
        
        {/* Side column for smaller settings */}
        <div className="space-y-8">
            {/* Notification Settings */}
            <div>
              <h3 className="text-lg font-semibold flex items-center mb-2"><Bell className="mr-2" /> Notifications</h3>
              <div className="bg-white p-4 rounded-lg border space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm">Email on new user registration</p>
                  <label className="switch"><input type="checkbox" name="emailOnNewUser" checked={settings.emailOnNewUser} onChange={handleChange} /><span className="slider round"></span></label>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm">Email on new restaurant application</p>
                  <label className="switch"><input type="checkbox" name="emailOnNewRestaurant" checked={settings.emailOnNewRestaurant} onChange={handleChange} /><span className="slider round"></span></label>
                </div>
                <button onClick={() => handleSettingsSave('notifications')} disabled={isSaving} className="btn-primary w-full flex items-center justify-center">
                    {isSaving ? <Loader2 className="animate-spin mr-2"/> : <Save size={16} className="mr-2"/>}
                    {isSaving ? 'Saving...' : 'Save Notifications'}
                </button>
              </div>
            </div>

            {/* Appearance Settings */}
            <div>
              <h3 className="text-lg font-semibold flex items-center mb-2"><Palette className="mr-2" /> Appearance</h3>
              <div className="bg-white p-4 rounded-lg border space-y-4">
                <div>
                  <label className="block text-sm font-medium">Theme</label>
                  <select name="theme" value={settings.theme} onChange={handleChange} className="input-field w-full mt-1">
                    <option>Light</option>
                    <option>Dark</option>
                  </select>
                </div>
                <button onClick={() => handleSettingsSave('appearance')} disabled={isSaving} className="btn-primary w-full flex items-center justify-center">
                    {isSaving ? <Loader2 className="animate-spin mr-2"/> : <Save size={16} className="mr-2"/>}
                    {isSaving ? 'Saving...' : 'Save Appearance'}
                </button>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}