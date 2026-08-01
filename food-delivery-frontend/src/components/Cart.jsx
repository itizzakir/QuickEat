"use client";

import { useEffect, useState } from 'react';
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { addressApi, api, apiErrorMessage } from "../services/api";
import { AddressForm } from "./AddressBook";
import { useAddresses } from "../hooks/useAddresses";
import { formatCurrency } from "../utils/currency";

// Icon Imports
import {
    ShoppingCart, Plus, Minus, CheckCircle, Loader2
} from 'lucide-react';

// --- MAIN CART COMPONENT ---
export default function Cart({ onBrowse, onOrderSuccess }) {
  const { user } = useAuth();
  // Single shared cart: the header badge and this page read the same state.
  const { cart, items, isLoading, mutatingItemId, addToCart, removeFromCart, totalPrice } = useCart();

  const [checkoutStep, setCheckoutStep] = useState('cart');

  const handleProceedToCheckout = () => { if (items.length > 0) setCheckoutStep('payment'); };
  const handleBackToCart = () => setCheckoutStep('cart');
  const formattedTotal = totalPrice;

  if (!user) return <div className="card text-center p-12 text-red-600">Please log in to view your cart.</div>;
  if (isLoading && !cart) return <div className="card flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-primary-500" /></div>;

  switch (checkoutStep) {
    case 'payment':
      return (
        <CheckoutPage
          items={items}
          totalPrice={formattedTotal}
          onBack={handleBackToCart}
          onOrderSuccess={onOrderSuccess}
        />
      );
    case 'success': return <OrderSuccess onBrowse={onBrowse} />;
    default:
      if (items.length === 0) return <EmptyCart onBrowse={onBrowse} />;
      return (
        <CartView
          cartItems={items}
          onAddToCart={addToCart}
          onRemoveFromCart={removeFromCart}
          onCheckout={handleProceedToCheckout}
          totalPrice={formattedTotal}
          mutatingItemId={mutatingItemId}
        />
      );
  }
}

// --- CART VIEW COMPONENT ---
function CartView({ cartItems, onAddToCart, onRemoveFromCart, onCheckout, totalPrice, mutatingItemId }) {
  return (
    <div className="card">
      <h2 className="text-xl sm:text-2xl font-bold mb-6">Shopping Cart</h2>
      <div className="space-y-4">
        {cartItems.map((cartItem) => {
          const isMutating = mutatingItemId === cartItem.id || mutatingItemId === cartItem.menuItem.id;
          return (
            <div key={cartItem.id} className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 p-4 bg-gray-50 rounded-lg">
              <img
                src={cartItem.menuItem.image || "/placeholder.svg"}
                alt={cartItem.menuItem.name}
                className="w-full sm:w-16 h-24 sm:h-16 object-cover rounded-lg"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/placeholder.svg";
                }}
              />
              <div className="flex-1"><h3 className="font-semibold">{cartItem.menuItem.name}</h3></div>
              <div className="flex items-center justify-between w-full sm:w-auto">
                <div className="flex items-center space-x-2">
                  <button onClick={() => onRemoveFromCart(cartItem.id)} disabled={isMutating} aria-label={`Remove one ${cartItem.menuItem.name}`} className="p-1 disabled:opacity-50"><Minus className="h-4 w-4" aria-hidden="true" /></button>
                  <span className="font-semibold w-8 text-center">{isMutating ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : cartItem.quantity}</span>
                  <button onClick={() => onAddToCart(cartItem.menuItem)} disabled={isMutating} aria-label={`Add one more ${cartItem.menuItem.name}`} className="p-1 disabled:opacity-50"><Plus className="h-4 w-4" aria-hidden="true" /></button>
                </div>
                <p className="font-bold text-right ml-4">{formatCurrency(cartItem.menuItem.price * cartItem.quantity)}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t pt-4 mt-6">
        <div className="flex justify-between items-center mb-4"><span className="text-xl font-bold">Total:</span><span className="text-xl font-bold">{formatCurrency(totalPrice)}</span></div>
        <button onClick={onCheckout} className="w-full btn-primary py-3">Proceed to Checkout</button>
      </div>
    </div>
  );
}

// --- CHECKOUT PAGE ---
function CheckoutPage({ items, totalPrice, onBack, onOrderSuccess }) {
    const { clearCart } = useCart();
    const { addresses, isLoading: addressesLoading, refresh: refreshAddresses } = useAddresses();

    const [isProcessing, setIsProcessing] = useState(false);
    const [success, setSuccess] = useState(false);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [isAddingAddress, setIsAddingAddress] = useState(false);
    const [isSavingAddress, setIsSavingAddress] = useState(false);
    const [draftAddress, setDraftAddress] = useState({
        label: "Home", line1: "", line2: "", city: "", state: "", postalCode: "", country: "India",
    });
    const [addressError, setAddressError] = useState("");

    // Preselect the default address once the book loads.
    useEffect(() => {
        if (selectedAddressId || addresses.length === 0) return;
        setSelectedAddressId((addresses.find((a) => a.isDefault) || addresses[0]).id);
    }, [addresses, selectedAddressId]);

    const handleSaveAddress = async (e) => {
        e.preventDefault();
        setIsSavingAddress(true);
        try {
            const created = await addressApi.create(draftAddress);
            await refreshAddresses();
            setSelectedAddressId(created.id);
            setIsAddingAddress(false);
            setAddressError("");
            toast.success("Address saved");
        } catch (err) {
            setAddressError(apiErrorMessage(err, "Could not save that address"));
        } finally {
            setIsSavingAddress(false);
        }
    };

    const handlePayment = async () => {
        const chosen = addresses.find((a) => a.id === selectedAddressId);
        if (!chosen) {
            setAddressError("Choose a delivery address, or add a new one.");
            return;
        }
        setAddressError("");
        setIsProcessing(true);

        try {
            // Only the lines and the address are sent. The customer, the restaurant and the
            // order total are all derived server-side.
            await api.createOrder({
                items: items.map((item) => ({
                    menuItemId: item.menuItem.id,
                    quantity: item.quantity,
                })),
                // The formatted snapshot travels with the order, so editing or deleting the
                // saved address later never rewrites delivery history.
                deliveryAddress: chosen.formatted,
                paymentMethod: "MOCK",
            });

            await clearCart();
            setSuccess(true);
            toast.success("Order placed successfully");

            setTimeout(() => {
                if (onOrderSuccess) onOrderSuccess();
            }, 1500);
        } catch (error) {
            toast.error(apiErrorMessage(error, "Payment failed"));
        } finally {
            setIsProcessing(false);
        }
    };

    if (success) {
        return <OrderSuccess onBrowse={() => window.location.assign('/customer-dashboard')} />;
    }

    return (
        <div className="card max-w-lg mx-auto">
             <button onClick={onBack} className="text-primary-600 hover:underline mb-6 text-sm font-medium flex items-center">← Back to Cart</button>
            <h2 className="text-2xl font-bold mb-6">Checkout</h2>

            <fieldset className="mb-6">
                <legend className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery address <span className="text-red-500">*</span>
                </legend>

                {addressesLoading ? (
                    <div className="py-4 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-gray-400" /></div>
                ) : (
                    <div className="space-y-2">
                        {addresses.map((address) => (
                            <label
                                key={address.id}
                                className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer ${selectedAddressId === address.id ? "border-primary-500 bg-primary-50" : "border-gray-200 hover:border-gray-300"}`}
                            >
                                <input
                                    type="radio"
                                    name="deliveryAddress"
                                    value={address.id}
                                    checked={selectedAddressId === address.id}
                                    onChange={() => setSelectedAddressId(address.id)}
                                    className="mt-1"
                                />
                                <span className="min-w-0">
                                    <span className="block font-medium text-sm">
                                        {address.label || "Address"}
                                        {address.isDefault && <span className="ml-2 text-xs text-primary-600">Default</span>}
                                    </span>
                                    <span className="block text-sm text-gray-600 break-words">{address.formatted}</span>
                                </span>
                            </label>
                        ))}

                        {!isAddingAddress && (
                            <button type="button" onClick={() => setIsAddingAddress(true)} className="text-sm font-medium text-primary-600 hover:text-primary-700">
                                + Add a new address
                            </button>
                        )}
                    </div>
                )}

                {isAddingAddress && (
                    <div className="mt-4 p-4 border rounded-lg bg-gray-50 space-y-4">
                        <AddressForm value={draftAddress} onChange={setDraftAddress} />
                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={() => setIsAddingAddress(false)} className="btn-secondary">Cancel</button>
                            <button type="button" onClick={handleSaveAddress} disabled={isSavingAddress} className="btn-primary flex items-center gap-2 disabled:opacity-60">
                                {isSavingAddress && <Loader2 className="h-4 w-4 animate-spin" />}Save &amp; use
                            </button>
                        </div>
                    </div>
                )}

                {addressError && <p className="mt-2 text-sm text-red-600">{addressError}</p>}
            </fieldset>

            <div className="bg-gray-50 p-4 rounded-lg mb-6 border">
                <div className="flex justify-between items-center text-lg">
                    <span className="font-medium">Total Amount:</span>
                    <span className="font-bold text-xl">{formatCurrency(totalPrice)}</span>
                </div>
            </div>

            <div className="space-y-4">
                <p className="text-sm text-gray-500">This is a mock payment. No real money will be deducted.</p>
                <button
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className="w-full btn-primary py-3 flex items-center justify-center disabled:opacity-60"
                >
                    {isProcessing ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : "Pay & Place Order"}
                </button>
            </div>
        </div>
    );
}

// --- ORDER SUCCESS COMPONENT ---
function OrderSuccess({ onBrowse }) {
    return (
      <div className="card text-center py-12">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Order Placed Successfully!</h2>
        <p className="text-gray-600 my-4">Your order has been placed successfully. You can track it in the &quot;My Orders&quot; section.</p>
        <button onClick={onBrowse} className="btn-primary">Browse More Restaurants</button>
      </div>
    );
}

// --- EMPTY CART COMPONENT ---
function EmptyCart({ onBrowse }) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Your cart is empty</h3>
          <p className="text-gray-600 mb-4">Add some delicious items to get started!</p>
          <button onClick={onBrowse} className="btn-primary">Browse Restaurants</button>
        </div>
      </div>
    );
}
