"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { userService } from "../services/userService";
import { User, Mail, Phone, Lock, Save, Camera, Loader2, MapPin } from "lucide-react";

export default function Profile() {
  const { user: authUser, updateUser } = useAuth(); // Get authenticated user basic info
  
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    mobile: "",
    avatarUrl: "",
    address: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Fetch real profile data
  useEffect(() => {
    if (authUser?.id) {
      userService.getProfile(authUser.id)
        .then((data) => {
          setProfile({
            fullName: data.fullName || "",
            email: data.email || "",
            mobile: data.mobile || "",
            avatarUrl: data.avatarUrl || "",
            address: data.address || "",
          });
        })
        .catch((err) => {
          console.error(err);
          setMessage({ type: "error", text: "Failed to load profile data." });
        })
        .finally(() => setIsLoading(false));
    }
  }, [authUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const updatedUser = await userService.updateProfile(authUser.id, profile);
      setProfile({
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        mobile: updatedUser.mobile,
        avatarUrl: updatedUser.avatarUrl,
        address: updatedUser.address,
      });
      
      // Update global auth context so header/sidebar reflect changes immediately
      updateUser({
        fullName: updatedUser.fullName,
        mobile: updatedUser.mobile,
        avatarUrl: updatedUser.avatarUrl,
        address: updatedUser.address,
        name: updatedUser.fullName // Some components might use 'name' instead of 'fullName'
      });

      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to update profile." });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin h-8 w-8 text-primary-500" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary-400 to-primary-600"></div>
        <div className="px-8 pb-8 relative">
          <div className="relative -mt-16 mb-6 inline-block">
            <div className="h-32 w-32 rounded-full border-4 border-white bg-white overflow-hidden shadow-md">
              <img
                src={profile.avatarUrl || `https://ui-avatars.com/api/?name=${profile.fullName}&background=random`}
                alt={profile.fullName}
                className="h-full w-full object-cover"
              />
            </div>
            <button className="absolute bottom-2 right-2 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors text-gray-600">
              <Camera className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{profile.fullName}</h1>
              <p className="text-gray-500 flex items-center gap-2 mt-1">
                <Mail className="h-4 w-4" /> {profile.email}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Settings */}
        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <User className="h-5 w-5 text-primary-500" />
            Personal Information
          </h2>

          {message.text && (
            <div className={`p-4 mb-4 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={profile.fullName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    name="mobile"
                    value={profile.mobile}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    name="address"
                    value={profile.address}
                    onChange={handleChange}
                    placeholder="Enter your delivery address"
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={profile.email}
                    disabled
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>
               <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Avatar URL</label>
                <div className="relative">
                  <Camera className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    name="avatarUrl"
                    value={profile.avatarUrl}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
                Save Changes
              </button>
            </div>
          </form>
        </div>

        {/* Security Settings - Placeholder for now */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary-500" />
            Security
          </h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input type="password" disabled placeholder="••••••••" className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input type="password" disabled placeholder="••••••••" className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50" />
            </div>
            <button type="button" disabled className="w-full py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed font-medium">
              Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
