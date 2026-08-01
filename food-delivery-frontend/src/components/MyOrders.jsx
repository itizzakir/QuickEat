"use client"

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Package, Clock, CheckCircle, Soup, Bike, Loader2 } from 'lucide-react';
import { api } from '../services/api';

// --- Child Component: Visual Status Tracker ---
const StatusTracker = ({ orderStatus, deliveryStatus }) => {
    const statuses = [
        { name: 'CONFIRMED', icon: CheckCircle, statuses: ['PENDING', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED'] },
        { name: 'PREPARING', icon: Soup, statuses: ['PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED'] },
        { name: 'OUT FOR DELIVERY', icon: Bike, statuses: ['OUT_FOR_DELIVERY', 'DELIVERED'], deliveryStatuses: ['PICKED_UP', 'DELIVERED'] },
        { name: 'DELIVERED', icon: CheckCircle, statuses: ['DELIVERED'], deliveryStatuses: ['DELIVERED'] }
    ];

    return (
        <div className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto py-2">
            {statuses.map((step, index) => {
                const isActive = step.statuses?.includes(orderStatus) || step.deliveryStatuses?.includes(deliveryStatus);
                return (
                    <React.Fragment key={step.name}>
                        <div className="flex flex-col items-center text-center flex-shrink-0">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors duration-300 ${isActive ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                <step.icon size={16} />
                            </div>
                            <p className={`text-xs mt-1 w-20 transition-colors duration-300 ${isActive ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>{step.name}</p>
                        </div>
                        {index < statuses.length - 1 && (
                            <div className={`flex-grow h-1 transition-colors duration-300 ${isActive ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

// --- Child Component: A Single Order Card ---
const OrderItem = ({ order }) => {
  return (
    <div className="border border-gray-200 rounded-lg p-4 animate-fade-in bg-white shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-3 mb-3">
        <div>
          <p className="font-bold text-gray-800">Order #{order.id}</p>
          <p className="text-sm text-gray-500">
            Placed on: {new Date(order.createdAt || order.orderDate).toLocaleString()}
          </p>
        </div>
        <div className="text-right mt-2 sm:mt-0">
          <p className="text-lg font-bold">₹{(order.totalPrice || order.total || 0).toFixed(2)}</p>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Clock className="h-3 w-3 mr-1" />
            {order.delivery?.status?.replace("_", " ") || order.status?.replace("_", " ") || 'UNKNOWN'}
          </span>
        </div>
      </div>
      
      <div className="my-4">
        <StatusTracker orderStatus={order.status} deliveryStatus={order.delivery?.status} />
      </div>

      <div className="space-y-2 border-t pt-3">
        <h4 className="text-sm font-semibold">Items:</h4>
        {order.items?.map(item => (
          <div key={item.id} className="flex items-center space-x-3">
            <img src={item.menuItem?.image || "https://via.placeholder.com/150"} alt={item.menuItem?.name} className="h-12 w-12 rounded-md object-cover" />
            <div className="flex-grow">
              <p className="text-sm font-medium">{item.menuItem?.name}</p>
              <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
            </div>
            <p className="text-sm font-semibold">₹{(item.lineTotal || (item.menuItem.price * item.quantity) || 0).toFixed(2)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};


// --- The Main Page Component ---
export default function MyOrders() {
  const { user, authToken } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Use real API
        const data = await api.getOrders(user.id);
        setOrders(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  if (loading) {
    return (
      <div className="card text-center py-12 flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 text-green-500 animate-spin mb-4" />
        <p className="text-lg font-semibold text-gray-700">Loading Your Orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card text-center py-12">
        <h3 className="text-lg font-semibold text-red-600 mb-2">Something went wrong</h3>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-6">My Orders</h2>
      {orders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
          <p className="text-gray-600">Your past orders will appear here once you check out.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <OrderItem key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}