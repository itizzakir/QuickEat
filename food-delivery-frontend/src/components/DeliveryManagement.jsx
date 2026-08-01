"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, ShieldCheck, ShieldOff, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { adminApi, apiErrorMessage } from "../services/api";

export default function DeliveryManagement() {
  const [partners, setPartners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const fetchPartners = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      // Joins User with the DeliveryInfo row that signup writes and nothing ever displayed.
      setPartners(await adminApi.deliveryPartners());
    } catch (err) {
      setError(apiErrorMessage(err, "Could not load delivery partners"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const handleToggleEnabled = async (partner) => {
    setBusyId(partner.userId);
    try {
      const saved = await adminApi.setUserEnabled(partner.userId, !partner.active);
      toast.success(`${saved.fullName} ${saved.enabled ? "reinstated" : "suspended"}`);
      fetchPartners();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not change that account"));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Delivery Partners</h2>

      {error && <div className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</div>}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Registration</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Licence</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">ID proof</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan="9" className="text-center py-6"><Loader2 className="animate-spin h-6 w-6 mx-auto text-gray-400" /></td></tr>
            ) : partners.length === 0 ? (
              <tr><td colSpan="9" className="text-center py-6 text-gray-500">No delivery partners registered yet.</td></tr>
            ) : (
              partners.map((partner) => (
                <tr key={partner.userId}>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <p className="font-medium">{partner.fullName}</p>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${partner.available ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                      {partner.available ? "Online" : "Offline"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <p>{partner.email}</p>
                    <p className="text-gray-500">{partner.mobile || "—"}</p>
                  </td>
                  <td className="px-4 py-4 text-sm whitespace-nowrap">
                    <p>{partner.vehicleType || "—"}</p>
                    <p className="text-gray-500">{partner.vehicleModel || ""}</p>
                  </td>
                  <td className="px-4 py-4 text-sm">{partner.vehicleRegistrationNumber || "—"}</td>
                  <td className="px-4 py-4 text-sm">{partner.licenseNumber || "—"}</td>
                  <td className="px-4 py-4 text-sm">{partner.deliveryZone || "—"}</td>
                  <td className="px-4 py-4 text-sm">
                    {partner.idProofUrl ? (
                      <a href={partner.idProofUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1">
                        View <ExternalLink size={14} />
                      </a>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${partner.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {partner.active ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleToggleEnabled(partner)}
                      disabled={busyId === partner.userId}
                      title={partner.active ? "Suspend account" : "Reinstate account"}
                      className="text-amber-600 hover:text-amber-800 disabled:opacity-30"
                    >
                      {busyId === partner.userId
                        ? <Loader2 size={18} className="animate-spin" />
                        : (partner.active ? <ShieldOff size={18} /> : <ShieldCheck size={18} />)}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
