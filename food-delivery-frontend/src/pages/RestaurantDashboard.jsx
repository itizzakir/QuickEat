"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "../contexts/AuthContext"
import { mockApi } from "../services/mockApi"
import { api } from "../services/api"
import { 
  Store, Package, DollarSign, Menu, LogOut, Edit, Trash2, XCircle, PlusCircle, Loader2, ChevronDown, ChevronUp 
} from "lucide-react"

// --- Reusable Modal Component ---
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md animate-fade-in-up">
        <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold">{title}</h3><button onClick={onClose} className="text-gray-500 hover:text-gray-800"><XCircle size={24} /></button></div>
        <div>{children}</div>
      </div>
    </div>
  )
}

// --- Form Component for Menu Item ---
const MenuItemForm = ({ item, onSave, onCancel, formError, isSaving }) => {
    const [formData, setFormData] = useState(item);
    useEffect(() => { setFormData(item) }, [item]);
    const handleChange = (e) => {
      const { name, value, type, checked } = e.target;
      setFormData(prev => ({...prev, [name]: type === 'checkbox' ? checked : value}));
    };
    const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {formError && <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">{formError}</div>}
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label><input type="text" name="name" value={formData.name || ''} onChange={handleChange} className="w-full p-2 border rounded-lg" required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Category</label><input type="text" name="category" value={formData.category || ''} onChange={handleChange} className="w-full p-2 border rounded-lg" placeholder="e.g., Appetizer, Main Course" required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><input type="text" name="description" value={formData.description || ''} onChange={handleChange} className="w-full p-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Price</label><input type="number" name="price" step="0.01" value={formData.price || ''} onChange={handleChange} className="w-full p-2 border rounded-lg" required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label><input type="text" name="image" value={formData.image || ''} onChange={handleChange} className="w-full p-2 border rounded-lg" /></div>
            <div className="flex items-center"><input type="checkbox" name="available" checked={!!formData.available} onChange={handleChange} className="h-4 w-4 text-green-600 border-gray-300 rounded" /><label className="ml-2 block text-sm text-gray-900">Available for ordering</label></div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
                <button type="submit" disabled={isSaving} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center justify-center w-28">{isSaving ? <Loader2 className="animate-spin" /> : 'Save Item'}</button>
            </div>
        </form>
    );
};

// --- Component to display details of an expanded order ---
const OrderDetails = ({ order }) => {
    if (!order.items || order.items.length === 0) {
        return <div className="p-4 text-sm text-gray-500 border-t">No item details available for this order.</div>;
    }
    return (
        <div className="bg-gray-50 p-4 mt-3 border-t">
            <h4 className="font-semibold mb-2">Order Items:</h4>
            <ul className="space-y-2">
                {order.items.map(item => (
                    <li key={item.id} className="flex justify-between items-center text-sm">
                        <span>{item.quantity} x {item.menuItem?.name || 'Unknown Item'}</span>
                        <span className="font-medium">₹{(item.lineTotal || (item.menuItem.price * item.quantity) || 0).toFixed(2)}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default function RestaurantDashboard() {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState("orders");
    const [restaurant, setRestaurant] = useState(null);
    const [orders, setOrders] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
    const [editingMenuItem, setEditingMenuItem] = useState(null);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [formError, setFormError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [expandedOrderId, setExpandedOrderId] = useState(null);

    useEffect(() => {
        if (!user) { setLoading(false); return; }
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Mock API calls
                // Assuming user has restaurantId
                const restaurantId = user.restaurantId || 1; 
                const restaurantData = await api.getRestaurantById(restaurantId);
                const ordersData = await mockApi.getOrders('RESTAURANT', restaurantId);
                
                setRestaurant(restaurantData);
                setOrders(ordersData);
                setMenuItems(restaurantData?.menu || []);
            } catch (err) {
                console.error("Error fetching data:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    const handleOrderClick = (orderId) => {
        setExpandedOrderId(prevId => (prevId === orderId ? null : orderId));
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            const updatedOrder = await mockApi.updateOrderStatus(orderId, newStatus);
            setOrders(prevOrders => 
                prevOrders.map(order => order.id === orderId ? updatedOrder : order)
            );
        } catch (err) {
            setError(`Failed to update order status: ${err.message}`);
        }
    };

    const handleSaveMenuItem = async (itemData) => {
        setFormError(null);
        setIsSaving(true);
        const isEditing = !!itemData.id;
        
        try {
            // Since we don't have explicit menu API in mockApi yet, we'll simulating saving to local state
            // In a real app, this would be an API call
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
            
            let updatedItems;
            if (isEditing) {
                updatedItems = menuItems.map(item => item.id === itemData.id ? { ...item, ...itemData } : item);
            } else {
                updatedItems = [...menuItems, { ...itemData, id: Date.now() }];
            }
            
            setMenuItems(updatedItems);
            
            // Optionally update the persistent storage via a 'updateRestaurant' method if we had one
            // For now, local state is enough for the demo session
            
            setIsMenuModalOpen(false);
        } catch(err) {
            setFormError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteMenuItem = async (itemId) => {
        if (!window.confirm("Are you sure you want to delete this item?")) return;
        try {
            await new Promise(resolve => setTimeout(resolve, 300));
            setMenuItems(menuItems.filter(item => item.id !== itemId));
        } catch(err) {
            setError(err.message);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
             await new Promise(resolve => setTimeout(resolve, 500));
            // Just update local state for now
            setIsEditingProfile(false);
        } catch(err) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const openAddMenuItemModal = () => {
        setFormError(null);
        setEditingMenuItem({ name: '', description: '', price: '', category: '', available: true, image: '' });
        setIsMenuModalOpen(true);
    };

    const openEditMenuItemModal = (item) => {
        setFormError(null);
        setEditingMenuItem(item);
        setIsMenuModalOpen(true);
    };
  
    const getStatusColor = (status) => {
        const statusLower = status?.toLowerCase();
        switch (statusLower) {
            case "pending": return "bg-yellow-100 text-yellow-800";
            case "preparing": return "bg-blue-100 text-blue-800";
            case "ready_for_pickup": return "bg-green-100 text-green-800";
            case "delivered": return "bg-gray-100 text-gray-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8 text-green-500" /></div>;
    if (error) return <div className="flex flex-col p-4 justify-center items-center h-screen text-center"><p className="text-red-600 font-bold">An Error Occurred</p><p className="text-sm text-gray-600 mt-2 break-all">{error}</p></div>;
    if (!user) return <div className="flex justify-center items-center h-screen">Please log in to view the dashboard.</div>;
  
    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="flex justify-between items-center h-16"><div className="flex items-center space-x-4"><Store className="h-8 w-8 text-green-500" /><div><h1 className="text-xl font-bold">{restaurant?.name || "Restaurant Dashboard"}</h1><p className="text-sm text-gray-600">Restaurant Dashboard</p></div></div><div className="flex items-center space-x-4"><div className="hidden md:block text-right"><p className="text-sm font-medium">{user?.name}</p><p className="text-xs text-gray-500">Restaurant Owner</p></div><button onClick={logout} className="p-2 text-gray-600 hover:text-red-600"><LogOut className="h-5 w-5" /></button></div></div></div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-4 rounded-lg shadow"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">Today's Orders</p><p className="text-2xl font-bold">{orders.length}</p></div><div className="bg-blue-100 p-3 rounded-lg"><Package className="h-6 w-6 text-blue-500" /></div></div></div>
                    <div className="bg-white p-4 rounded-lg shadow"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">Revenue</p><p className="text-2xl font-bold">₹{orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0).toFixed(2)}</p></div><div className="bg-green-100 p-3 rounded-lg"><DollarSign className="h-6 w-6 text-green-500" /></div></div></div>
                    <div className="bg-white p-4 rounded-lg shadow"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">Active Items</p><p className="text-2xl font-bold">{menuItems.filter(item => item.available).length}</p></div><div className="bg-purple-100 p-3 rounded-lg"><Menu className="h-6 w-6 text-purple-500" /></div></div></div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    <aside className="lg:w-64 flex-shrink-0"><nav className="bg-white p-4 rounded-lg shadow"><ul className="space-y-2">{[{ id: "orders", name: "Orders", icon: Package },{ id: "menu", name: "Menu Management", icon: Menu },{ id: "profile", name: "Restaurant Profile", icon: Store },].map((item) => <li key={item.id}><button onClick={() => setActiveTab(item.id)} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors duration-200 ${activeTab === item.id ? "bg-green-100 text-green-700" : "text-gray-700 hover:bg-gray-100"}`}><item.icon className="h-5 w-5" /><span className="font-medium">{item.name}</span></button></li>)}</ul></nav></aside>

                    <div className="flex-1">
                        {activeTab === "orders" && (
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h2 className="text-2xl font-bold mb-6">Orders</h2>
                                <div className="space-y-4">
                                {orders.length > 0 ? orders.map((order) => (
                                    <div key={order.id} className="border border-gray-200 rounded-lg">
                                        <div className="p-4 cursor-pointer" onClick={() => handleOrderClick(order.id)}>
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h3 className="font-semibold">Order #{order.id}</h3>
                                                    <p className="text-sm text-gray-500">{new Date(order.orderDate || order.createdAt).toLocaleString()}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold">₹{(order.totalPrice || 0).toFixed(2)}</p>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status || order.orderStatus)}`}>{order.status?.replace("_", " ") || order.orderStatus?.replace("_", " ") || 'UNKNOWN'}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex space-x-2">
                                                    {(order.status === "PENDING" || order.orderStatus === "PENDING") && <button onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.id, "PREPARING"); }} className="bg-blue-500 text-white text-sm px-3 py-1 rounded hover:bg-blue-600">Accept</button>}
                                                    {(order.status === "PREPARING" || order.orderStatus === "PREPARING") && <button onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.id, "READY_FOR_PICKUP"); }} className="bg-green-500 text-white text-sm px-3 py-1 rounded hover:bg-green-600">Mark Ready</button>}
                                                </div>
                                                {expandedOrderId === order.id ? <ChevronUp className="text-gray-500"/> : <ChevronDown className="text-gray-500"/>}
                                            </div>
                                        </div>
                                        {expandedOrderId === order.id && <OrderDetails order={order} />}
                                    </div>
                                )) : <p>No orders yet today.</p>}
                                </div>
                            </div>
                        )}

                        {activeTab === "menu" && (
                            <div className="bg-white p-6 rounded-lg shadow">
                                <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold">Menu Management</h2><button onClick={openAddMenuItemModal} className="flex items-center bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"><PlusCircle size={20} className="mr-2"/>Add Item</button></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {menuItems.map((item) => (
                                    <div key={item.id} className="border border-gray-200 rounded-lg p-4 flex flex-col justify-between">
                                        <div>
                                            <img src={item.image || "https://via.placeholder.com/150"} alt={item.name} className="w-full h-32 object-cover rounded-lg mb-3"/>
                                            <div className="flex justify-between items-start mb-2">
                                                <div><h3 className="font-semibold">{item.name}</h3><p className="text-gray-600 text-sm">{item.description}</p></div>
                                                <p className="text-green-600 font-bold">₹{(item.price || 0).toFixed(2)}</p>
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded-full ${item.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{item.available ? "Available" : "Out of Stock"}</span>
                                        </div>
                                        <div className="flex space-x-2 mt-4">
                                            <button onClick={() => openEditMenuItemModal(item)} className="flex-1 flex items-center justify-center bg-gray-200 text-gray-800 text-sm py-2 rounded-lg hover:bg-gray-300"><Edit className="h-4 w-4 mr-1"/>Edit</button>
                                            <button onClick={() => handleDeleteMenuItem(item.id)} className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-2 rounded-lg"><Trash2 className="h-4 w-4"/></button>
                                        </div>
                                    </div>
                                ))}
                                </div>
                            </div>
                        )}

                        {activeTab === "profile" && restaurant && (
                           <div className="bg-white p-6 rounded-lg shadow">
                                <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold">Restaurant Profile</h2>{!isEditingProfile && (<button onClick={() => setIsEditingProfile(true)} className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"><Edit size={18} className="mr-2"/>Edit Profile</button>)}</div>
                                <form onSubmit={handleProfileUpdate}>
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div><label className="block text-sm font-medium text-gray-700 mb-2">Restaurant Name</label><input type="text" value={restaurant.name || ''} onChange={(e) => setRestaurant({...restaurant, name: e.target.value})} className="w-full p-2 border rounded-lg disabled:bg-gray-100" disabled={!isEditingProfile} /></div>
                                            <div><label className="block text-sm font-medium text-gray-700 mb-2">Owner Name</label><input type="text" value={user?.name} className="w-full p-2 border rounded-lg bg-gray-100" readOnly/></div>
                                            <div><label className="block text-sm font-medium text-gray-700 mb-2">Email</label><input type="email" value={user?.email} className="w-full p-2 border rounded-lg bg-gray-100" readOnly/></div>
                                            <div><label className="block text-sm font-medium text-gray-700 mb-2">Address</label><input type="text" value={restaurant.address?.line1 || ''} onChange={(e) => setRestaurant({...restaurant, address: {...restaurant.address, line1: e.target.value}})} className="w-full p-2 border rounded-lg disabled:bg-gray-100" disabled={!isEditingProfile} /></div>
                                        </div>
                                        {isEditingProfile && (<div className="flex justify-end space-x-4"><button type="button" onClick={() => setIsEditingProfile(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">Cancel</button><button type="submit" disabled={isSaving} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center justify-center w-36">{isSaving ? <Loader2 className="animate-spin" /> : 'Save Changes'}</button></div>)}
                                    </div>
                                </form>
                           </div>
                        )}
                    </div>
                </div>
            </main>

            <Modal isOpen={isMenuModalOpen} onClose={() => setIsMenuModalOpen(false)} title={editingMenuItem?.id ? "Edit Menu Item" : "Add New Item"}>
                <MenuItemForm item={editingMenuItem} onSave={handleSaveMenuItem} onCancel={() => setIsMenuModalOpen(false)} formError={formError} isSaving={isSaving}/>
            </Modal>
        </div>
    )
}