"use client"

import { useCallback, useEffect, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { toast } from "sonner"
import { useAuth } from "../contexts/AuthContext"
import { apiErrorMessage, menuApi, restaurantApi, orderApi } from "../services/api"
import { getStatusClasses, getStatusLabel, RESTAURANT_NEXT_ACTIONS } from "../constants/orderStatus"
import { formatCurrency } from "../utils/currency"
import Modal from "../components/Modal"
import { useConfirm } from "../components/ConfirmDialog"
import {
  Store, Package, DollarSign, Menu, LogOut, Edit, Trash2, PlusCircle, Loader2,
  ChevronDown, ChevronUp, ToggleLeft, ToggleRight, Menu as MenuIcon, X
} from "lucide-react"

// --- Form Component for Menu Item ---
const MenuItemForm = ({ item, onSave, onCancel, formError, isSaving }) => {
    const [formData, setFormData] = useState(item);
    useEffect(() => { setFormData(item) }, [item]);

    const handleChange = (e) => {
      const { name, value, type, checked } = e.target;
      setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      onSave({
        ...formData,
        // The API expects a number; a text input hands back a string.
        price: Number.parseFloat(formData.price),
      });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {formError && <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">{formError}</div>}
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label><input type="text" name="name" value={formData.name || ''} onChange={handleChange} className="w-full p-2 border rounded-lg" required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Category</label><input type="text" name="category" value={formData.category || ''} onChange={handleChange} className="w-full p-2 border rounded-lg" placeholder="e.g., Starters, Main Course" required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><input type="text" name="description" value={formData.description || ''} onChange={handleChange} className="w-full p-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label><input type="number" name="price" step="0.01" min="0.01" value={formData.price ?? ''} onChange={handleChange} className="w-full p-2 border rounded-lg" required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label><input type="text" name="image" value={formData.image || ''} onChange={handleChange} className="w-full p-2 border rounded-lg" placeholder="/images/food/…" /></div>
            <div className="flex items-center"><input type="checkbox" name="vegetarian" checked={!!formData.vegetarian} onChange={handleChange} className="h-4 w-4 text-green-600 border-gray-300 rounded" /><label className="ml-2 block text-sm text-gray-900">Vegetarian</label></div>
            <div className="flex items-center"><input type="checkbox" name="available" checked={!!formData.available} onChange={handleChange} className="h-4 w-4 text-green-600 border-gray-300 rounded" /><label className="ml-2 block text-sm text-gray-900">Available for ordering</label></div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
                <button type="submit" disabled={isSaving} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center justify-center w-28 disabled:opacity-60">{isSaving ? <Loader2 className="animate-spin" /> : 'Save Item'}</button>
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
                        <span className="font-medium">{formatCurrency((item.price ?? item.menuItem?.price ?? 0) * item.quantity)}</span>
                    </li>
                ))}
            </ul>
            {order.deliveryAddress && (
                <p className="mt-3 text-xs text-gray-500">Deliver to: {order.deliveryAddress}</p>
            )}
        </div>
    );
};

const TABS = ["orders", "menu", "profile"];

const EMPTY_ITEM = { name: '', description: '', price: '', category: '', available: true, vegetarian: false, image: '' };

export default function RestaurantDashboard() {
    const { user, logout } = useAuth();
    const confirm = useConfirm();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    // Tab state lives in the URL so the back button and deep links work.
    const navigate = useNavigate();
    const location = useLocation();
    const activeTab = TABS.find((t) => location.pathname.endsWith("/" + t)) || "orders";
    const setActiveTab = (tab) => navigate("/restaurant-dashboard/" + tab);

    const [restaurant, setRestaurant] = useState(null);
    const [profileForm, setProfileForm] = useState(null);
    const [orders, setOrders] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
    const [editingMenuItem, setEditingMenuItem] = useState(null);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [formError, setFormError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [togglingItemId, setTogglingItemId] = useState(null);
    const [expandedOrderId, setExpandedOrderId] = useState(null);

    const loadDashboard = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Resolve the caller's OWN restaurant. This used to fall back to
            // `user.restaurantId || 1`, so every owner was shown restaurant #1.
            const restaurantData = await restaurantApi.mine();
            setRestaurant(restaurantData);
            setProfileForm(restaurantData);
            setMenuItems(restaurantData?.menu || []);

            const page = await restaurantApi.orders(restaurantData.id, { size: 50 });
            setOrders(page?.content || []);
        } catch (err) {
            setError(apiErrorMessage(err, "Could not load your restaurant"));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!user) { setLoading(false); return; }
        loadDashboard();
    }, [user, loadDashboard]);

    const handleOrderClick = (orderId) => {
        setExpandedOrderId(prevId => (prevId === orderId ? null : orderId));
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            const updatedOrder = await orderApi.updateStatus(orderId, newStatus);
            setOrders(prevOrders =>
                prevOrders.map(order => order.id === orderId ? updatedOrder : order)
            );
            toast.success(`Order #${orderId} → ${getStatusLabel(newStatus)}`);
        } catch (err) {
            toast.error(apiErrorMessage(err, "Failed to update order status"));
        }
    };

    const handleSaveMenuItem = async (itemData) => {
        setFormError(null);
        setIsSaving(true);
        const payload = {
            name: itemData.name,
            description: itemData.description,
            price: itemData.price,
            category: itemData.category,
            vegetarian: Boolean(itemData.vegetarian),
            available: itemData.available !== false,
            image: itemData.image,
        };

        try {
            if (itemData.id) {
                const saved = await menuApi.update(restaurant.id, itemData.id, payload);
                setMenuItems(items => items.map(i => (i.id === saved.id ? saved : i)));
                toast.success(`${saved.name} updated`);
            } else {
                const created = await menuApi.create(restaurant.id, payload);
                setMenuItems(items => [...items, created]);
                toast.success(`${created.name} added to the menu`);
            }
            setIsMenuModalOpen(false);
        } catch (err) {
            setFormError(apiErrorMessage(err, "Could not save that item"));
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleAvailability = async (item) => {
        setTogglingItemId(item.id);
        try {
            const saved = await menuApi.setAvailability(restaurant.id, item.id, !item.available);
            setMenuItems(items => items.map(i => (i.id === saved.id ? saved : i)));
        } catch (err) {
            toast.error(apiErrorMessage(err, "Could not change availability"));
        } finally {
            setTogglingItemId(null);
        }
    };

    const handleDeleteMenuItem = async (item) => {
        const ok = await confirm({
            title: "Delete this dish?",
            message: `"${item.name}" will be removed from your menu.`,
            confirmLabel: "Delete",
            danger: true,
        });
        if (!ok) return;
        try {
            await menuApi.remove(restaurant.id, item.id);
            setMenuItems(items => items.filter(i => i.id !== item.id));
            toast.success(`${item.name} deleted`);
        } catch (err) {
            toast.error(apiErrorMessage(err, "Could not delete that item"));
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            // `address` is a plain string on both sides now; the form used to bind
            // `restaurant.address.line1`, an object shape the API never returned.
            const saved = await restaurantApi.update(restaurant.id, {
                name: profileForm.name,
                description: profileForm.description,
                address: profileForm.address,
                image: profileForm.image,
                category: profileForm.category,
                deliveryTime: profileForm.deliveryTime ? Number(profileForm.deliveryTime) : null,
                deliveryFee: profileForm.deliveryFee,
                discount: profileForm.discount,
            });
            setRestaurant(saved);
            setProfileForm(saved);
            setIsEditingProfile(false);
            toast.success("Restaurant profile updated");
        } catch (err) {
            toast.error(apiErrorMessage(err, "Could not save your profile"));
        } finally {
            setIsSaving(false);
        }
    };

    const openAddMenuItemModal = () => {
        setFormError(null);
        setEditingMenuItem(EMPTY_ITEM);
        setIsMenuModalOpen(true);
    };

    const openEditMenuItemModal = (item) => {
        setFormError(null);
        setEditingMenuItem(item);
        setIsMenuModalOpen(true);
    };

    // --- Stats from the real order feed ---
    const revenue = orders
        .filter(o => o.status !== 'CANCELLED')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const openOrders = orders.filter(o => !['DELIVERED', 'CANCELLED'].includes(o.status)).length;

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8 text-green-500" /></div>;
    if (error) return (
        <div className="flex flex-col p-4 justify-center items-center h-screen text-center">
            <p className="text-red-600 font-bold">An Error Occurred</p>
            <p className="text-sm text-gray-600 mt-2 break-all">{error}</p>
            <button onClick={loadDashboard} className="mt-4 bg-green-500 text-white px-4 py-2 rounded-lg">Try again</button>
        </div>
    );
    if (!user) return <div className="flex justify-center items-center h-screen">Please log in to view the dashboard.</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="flex justify-between items-center h-16"><div className="flex items-center space-x-4"><button onClick={() => setIsSidebarOpen(true)} aria-label="Open menu" className="lg:hidden p-2 -ml-2"><MenuIcon className="h-5 w-5" aria-hidden="true" /></button><Store className="h-8 w-8 text-green-500" /><div><h1 className="text-xl font-bold">{restaurant?.name || "Restaurant Dashboard"}</h1><p className="text-sm text-gray-600">Restaurant Dashboard</p></div></div><div className="flex items-center space-x-4"><div className="hidden md:block text-right"><p className="text-sm font-medium">{user?.name}</p><p className="text-xs text-gray-500">Restaurant Owner</p></div><button onClick={logout} aria-label="Log out" className="p-2 text-gray-600 hover:text-red-600"><LogOut className="h-5 w-5" aria-hidden="true" /></button></div></div></div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-4 rounded-lg shadow"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">Orders ({openOrders} open)</p><p className="text-2xl font-bold">{orders.length}</p></div><div className="bg-blue-100 p-3 rounded-lg"><Package className="h-6 w-6 text-blue-500" /></div></div></div>
                    <div className="bg-white p-4 rounded-lg shadow"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">Revenue</p><p className="text-2xl font-bold">{formatCurrency(revenue)}</p></div><div className="bg-green-100 p-3 rounded-lg"><DollarSign className="h-6 w-6 text-green-500" /></div></div></div>
                    <div className="bg-white p-4 rounded-lg shadow"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">Active Items</p><p className="text-2xl font-bold">{menuItems.filter(item => item.available).length}<span className="text-base font-normal text-gray-500"> / {menuItems.length}</span></p></div><div className="bg-purple-100 p-3 rounded-lg"><Menu className="h-6 w-6 text-purple-500" /></div></div></div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {isSidebarOpen && (
                        <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-40 lg:hidden" aria-hidden="true" />
                    )}
                    <aside className={`fixed lg:static top-0 left-0 h-full lg:h-auto w-64 bg-white lg:bg-transparent z-50 lg:z-auto p-4 lg:p-0 transform transition-transform lg:transform-none lg:w-64 flex-shrink-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
                        <div className="flex justify-end lg:hidden mb-2">
                            <button onClick={() => setIsSidebarOpen(false)} aria-label="Close menu" className="p-2"><X className="h-5 w-5" aria-hidden="true" /></button>
                        </div>
                        <nav className="bg-white p-4 rounded-lg shadow"><ul className="space-y-2">{[{ id: "orders", name: "Orders", icon: Package },{ id: "menu", name: "Menu Management", icon: Menu },{ id: "profile", name: "Restaurant Profile", icon: Store },].map((item) => <li key={item.id}><button onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors duration-200 ${activeTab === item.id ? "bg-green-100 text-green-700" : "text-gray-700 hover:bg-gray-100"}`}><item.icon className="h-5 w-5" aria-hidden="true" /><span className="font-medium">{item.name}</span></button></li>)}</ul></nav>
                    </aside>

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
                                                    <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
                                                    {order.customerName && <p className="text-xs text-gray-500">{order.customerName}</p>}
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold">{formatCurrency(order.totalAmount)}</p>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClasses(order.status)}`}>{getStatusLabel(order.status)}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex space-x-2">
                                                    {/* Actions come from the shared transition table, so the UI can only
                                                        offer moves the backend will actually accept. */}
                                                    {(RESTAURANT_NEXT_ACTIONS[order.status] || []).map((action) => (
                                                        <button
                                                            key={action.next}
                                                            onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.id, action.next); }}
                                                            className={`text-white text-sm px-3 py-1 rounded ${action.variant === "danger" ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"}`}
                                                        >
                                                            {action.label}
                                                        </button>
                                                    ))}
                                                </div>
                                                {expandedOrderId === order.id ? <ChevronUp className="text-gray-500"/> : <ChevronDown className="text-gray-500"/>}
                                            </div>
                                        </div>
                                        {expandedOrderId === order.id && <OrderDetails order={order} />}
                                    </div>
                                )) : <p className="text-gray-600 text-center py-8">No orders yet.</p>}
                                </div>
                            </div>
                        )}

                        {activeTab === "menu" && (
                            <div className="bg-white p-6 rounded-lg shadow">
                                <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold">Menu Management</h2><button onClick={openAddMenuItemModal} className="flex items-center bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"><PlusCircle size={20} className="mr-2"/>Add Item</button></div>
                                {menuItems.length === 0 ? (
                                    <p className="text-gray-600 text-center py-8">No dishes yet. Add your first one.</p>
                                ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {menuItems.map((item) => (
                                    <div key={item.id} className="border border-gray-200 rounded-lg p-4 flex flex-col justify-between">
                                        <div>
                                            <img src={item.image || "/placeholder.svg"} alt={item.name} className="w-full h-32 object-cover rounded-lg mb-3" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/placeholder.svg"; }}/>
                                            <div className="flex justify-between items-start mb-2">
                                                <div><h3 className="font-semibold">{item.name}</h3><p className="text-gray-600 text-sm">{item.description}</p></div>
                                                <p className="text-green-600 font-bold whitespace-nowrap">{formatCurrency(item.price)}</p>
                                            </div>
                                            <button
                                                onClick={() => handleToggleAvailability(item)}
                                                disabled={togglingItemId === item.id}
                                                className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors ${item.available ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-red-100 text-red-800 hover:bg-red-200"}`}
                                            >
                                                {togglingItemId === item.id
                                                    ? <Loader2 className="h-3 w-3 animate-spin" />
                                                    : (item.available ? <ToggleRight className="h-3 w-3" /> : <ToggleLeft className="h-3 w-3" />)}
                                                {item.available ? "Available" : "Out of Stock"}
                                            </button>
                                        </div>
                                        <div className="flex space-x-2 mt-4">
                                            <button onClick={() => openEditMenuItemModal(item)} className="flex-1 flex items-center justify-center bg-gray-200 text-gray-800 text-sm py-2 rounded-lg hover:bg-gray-300"><Edit className="h-4 w-4 mr-1"/>Edit</button>
                                            <button onClick={() => handleDeleteMenuItem(item)} aria-label={`Delete ${item.name}`} className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-2 rounded-lg"><Trash2 className="h-4 w-4" aria-hidden="true"/></button>
                                        </div>
                                    </div>
                                ))}
                                </div>
                                )}
                            </div>
                        )}

                        {activeTab === "profile" && profileForm && (
                           <div className="bg-white p-6 rounded-lg shadow">
                                <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold">Restaurant Profile</h2>{!isEditingProfile && (<button onClick={() => setIsEditingProfile(true)} className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"><Edit size={18} className="mr-2"/>Edit Profile</button>)}</div>
                                <form onSubmit={handleProfileUpdate}>
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div><label className="block text-sm font-medium text-gray-700 mb-2">Restaurant Name</label><input type="text" value={profileForm.name || ''} onChange={(e) => setProfileForm({...profileForm, name: e.target.value})} className="w-full p-2 border rounded-lg disabled:bg-gray-100" disabled={!isEditingProfile} required /></div>
                                            <div><label className="block text-sm font-medium text-gray-700 mb-2">Owner Name</label><input type="text" value={user?.name || ''} className="w-full p-2 border rounded-lg bg-gray-100" readOnly/></div>
                                            <div><label className="block text-sm font-medium text-gray-700 mb-2">Email</label><input type="email" value={user?.email || ''} className="w-full p-2 border rounded-lg bg-gray-100" readOnly/></div>
                                            <div><label className="block text-sm font-medium text-gray-700 mb-2">Address</label><input type="text" value={profileForm.address || ''} onChange={(e) => setProfileForm({...profileForm, address: e.target.value})} className="w-full p-2 border rounded-lg disabled:bg-gray-100" disabled={!isEditingProfile} /></div>
                                            <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-2">Description</label><textarea rows={2} value={profileForm.description || ''} onChange={(e) => setProfileForm({...profileForm, description: e.target.value})} className="w-full p-2 border rounded-lg disabled:bg-gray-100" disabled={!isEditingProfile} /></div>
                                            <div><label className="block text-sm font-medium text-gray-700 mb-2">Categories</label><input type="text" value={profileForm.category || ''} onChange={(e) => setProfileForm({...profileForm, category: e.target.value})} className="w-full p-2 border rounded-lg disabled:bg-gray-100" disabled={!isEditingProfile} placeholder="Biryani, Indian" /></div>
                                            <div><label className="block text-sm font-medium text-gray-700 mb-2">Delivery Time (mins)</label><input type="number" min="5" max="180" value={profileForm.deliveryTime ?? ''} onChange={(e) => setProfileForm({...profileForm, deliveryTime: e.target.value})} className="w-full p-2 border rounded-lg disabled:bg-gray-100" disabled={!isEditingProfile} /></div>
                                            <div><label className="block text-sm font-medium text-gray-700 mb-2">Delivery Fee</label><input type="text" value={profileForm.deliveryFee || ''} onChange={(e) => setProfileForm({...profileForm, deliveryFee: e.target.value})} className="w-full p-2 border rounded-lg disabled:bg-gray-100" disabled={!isEditingProfile} placeholder="FREE or ₹29" /></div>
                                            <div><label className="block text-sm font-medium text-gray-700 mb-2">Discount</label><input type="text" value={profileForm.discount || ''} onChange={(e) => setProfileForm({...profileForm, discount: e.target.value})} className="w-full p-2 border rounded-lg disabled:bg-gray-100" disabled={!isEditingProfile} placeholder="20% OFF" /></div>
                                            <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label><input type="text" value={profileForm.image || ''} onChange={(e) => setProfileForm({...profileForm, image: e.target.value})} className="w-full p-2 border rounded-lg disabled:bg-gray-100" disabled={!isEditingProfile} /></div>
                                        </div>
                                        {isEditingProfile && (<div className="flex justify-end space-x-4"><button type="button" onClick={() => { setProfileForm(restaurant); setIsEditingProfile(false); }} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">Cancel</button><button type="submit" disabled={isSaving} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center justify-center w-36 disabled:opacity-60">{isSaving ? <Loader2 className="animate-spin" /> : 'Save Changes'}</button></div>)}
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
