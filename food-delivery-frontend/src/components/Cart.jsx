"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from "../contexts/AuthContext";
import { mockApi } from "../services/mockApi";

// Icon Imports
import { 
    ShoppingCart, Plus, Minus, CheckCircle, Loader2
} from 'lucide-react';

// --- MAIN CART COMPONENT ---
export default function Cart({ onBrowse, onOrderSuccess }) {
  const { user } = useAuth();
  
  const [cart, setCart] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkoutStep, setCheckoutStep] = useState('cart');
  const [mutatingItemId, setMutatingItemId] = useState(null);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      setError("Please log in to view your cart.");
      return;
    }
    
    const fetchCart = async () => {
      setIsLoading(true);
      try {
        const data = await api.getCart(user.id);
        setCart(data);
      } catch (err) {
        setError(err.message || "Failed to fetch cart.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCart();
  }, [user]);

  const handleAddToCart = async (menuItem) => {
    setMutatingItemId(menuItem.id);
    try {
      const updatedCart = await api.addToCart(user.id, menuItem, 1);
      setCart(updatedCart);
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setMutatingItemId(null);
    }
  };

  const handleRemoveFromCart = async (cartItemId) => {
    setMutatingItemId(cartItemId);
    try {
      const updatedCart = await api.removeFromCart(cartItemId);
      setCart(updatedCart);
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setMutatingItemId(null);
    }
  };

  const handleProceedToCheckout = () => { if (cart?.items?.length > 0) setCheckoutStep('payment'); };
  const handleBackToCart = () => setCheckoutStep('cart');
  const totalPrice = useMemo(() => cart?.items?.reduce((total, item) => total + (item.menuItem.price * item.quantity), 0).toFixed(2) || '0.00', [cart]);

  if (isLoading) return <div className="card flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-primary-500" /></div>;
  if (error) return <div className="card text-center p-12 text-red-600">Error: {error}</div>;

  switch (checkoutStep) {
    case 'payment': return <MockPaymentPage cart={cart} totalPrice={totalPrice} onBack={handleBackToCart} onOrderSuccess={onOrderSuccess} user={user} />;
    case 'success': return <OrderSuccess onBrowse={onBrowse} />;
    default:
      if (!cart || !cart.items || cart.items.length === 0) return <EmptyCart onBrowse={onBrowse} />;
      return <CartView cartItems={cart.items} onAddToCart={handleAddToCart} onRemoveFromCart={handleRemoveFromCart} onCheckout={handleProceedToCheckout} totalPrice={totalPrice} mutatingItemId={mutatingItemId} />;
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
              <img src={cartItem.menuItem.image || "/placeholder.svg"} alt={cartItem.menuItem.name} className="w-full sm:w-16 h-24 sm:h-16 object-cover rounded-lg" />
              <div className="flex-1"><h3 className="font-semibold">{cartItem.menuItem.name}</h3></div>
              <div className="flex items-center justify-between w-full sm:w-auto">
                <div className="flex items-center space-x-2">
                  <button onClick={() => onRemoveFromCart(cartItem.id)} disabled={isMutating} className="p-1 disabled:opacity-50"><Minus className="h-4 w-4" /></button>
                  <span className="font-semibold w-8 text-center">{isMutating ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : cartItem.quantity}</span>
                  <button onClick={() => onAddToCart(cartItem.menuItem)} disabled={isMutating} className="p-1 disabled:opacity-50"><Plus className="h-4 w-4" /></button>
                </div>
                <p className="font-bold text-right ml-4">₹{(cartItem.menuItem.price * cartItem.quantity).toFixed(2)}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t pt-4 mt-6">
        <div className="flex justify-between items-center mb-4"><span className="text-xl font-bold">Total:</span><span className="text-xl font-bold">₹{totalPrice}</span></div>
        <button onClick={onCheckout} className="w-full btn-primary py-3">Proceed to Checkout</button>
      </div>
    </div>
  );
}

import { api } from "../services/api"; // Import real API

// --- MOCK PAYMENT PAGE COMPONENT ---
function MockPaymentPage({ totalPrice, onBack, onOrderSuccess, cart, user }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [success, setSuccess] = useState(false);

    const handlePayment = async () => {
        setIsProcessing(true);
        try {
            // Transform cart items for backend
            const orderItems = cart.items.map(item => ({
                menuItemId: item.menuItem.id,
                quantity: item.quantity
            }));

            // Create order via real API
            await api.createOrder({
                customerId: user.id,
                items: orderItems,
                totalPrice: parseFloat(totalPrice),
                deliveryAddress: user.address || 'Default Address',
                restaurantId: cart.items[0]?.menuItem?.restaurantId || 1 
            });
            
            // Clear cart from backend
            await api.clearCart(user.id);
            
            setSuccess(true);
            setTimeout(() => {
                if(onOrderSuccess) onOrderSuccess();
            }, 2000);
            
        } catch (error) {
            alert("Payment failed: " + (error.response?.data || error.message));
        } finally {
            setIsProcessing(false);
        }
    };

    if (success) {
        return <OrderSuccess onBrowse={() => window.location.href = '/'} />;
    }

    return (
        <div className="card max-w-lg mx-auto">
             <button onClick={onBack} className="text-primary-600 hover:underline mb-6 text-sm font-medium flex items-center">← Back to Cart</button>
            <h2 className="text-2xl font-bold mb-6">Checkout</h2>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-6 border">
                <div className="flex justify-between items-center text-lg">
                    <span className="font-medium">Total Amount:</span>
                    <span className="font-bold text-xl">₹{totalPrice}</span>
                </div>
            </div>

            <div className="space-y-4">
                <p className="text-sm text-gray-500">This is a mock payment. No real money will be deducted.</p>
                <button 
                    onClick={handlePayment} 
                    disabled={isProcessing}
                    className="w-full btn-primary py-3 flex items-center justify-center"
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
        <p className="text-gray-600 my-4">Your order has been placed successfully. You can track it in the "My Orders" section.</p>
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