"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { api, apiErrorMessage } from "../services/api";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

/**
 * One cart, shared by the header badge and the cart page.
 *
 * Previously App.jsx passed cart props into <Cart>, which ignored them and refetched its own
 * copy — so adding an item updated one and not the other and the badge count drifted.
 */
export const CartProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  const [cart, setCart] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mutatingItemId, setMutatingItemId] = useState(null);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setCart(null);
      return null;
    }
    setIsLoading(true);
    try {
      const data = await api.getCart(user.id);
      setCart(data);
      return data;
    } catch (error) {
      // A 401 is already handled globally by the response interceptor.
      if (error?.response?.status !== 401) {
        toast.error(apiErrorMessage(error, "Could not load your cart"));
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Only customers have carts; other roles never trigger the fetch.
  useEffect(() => {
    if (isAuthenticated && user?.role === "CUSTOMER") {
      refresh();
    } else {
      setCart(null);
    }
  }, [isAuthenticated, user?.role, refresh]);

  const addToCart = useCallback(async (menuItem, quantity = 1) => {
    setMutatingItemId(menuItem.id);
    try {
      const updated = await api.addToCart(menuItem, quantity);
      setCart(updated);
      toast.success(`${menuItem.name} added to cart`);
      return updated;
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not add that item"));
      return null;
    } finally {
      setMutatingItemId(null);
    }
  }, []);

  const removeFromCart = useCallback(async (cartItemId) => {
    setMutatingItemId(cartItemId);
    try {
      const updated = await api.removeFromCart(cartItemId);
      setCart(updated);
      return updated;
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not update your cart"));
      return null;
    } finally {
      setMutatingItemId(null);
    }
  }, []);

  const clearCart = useCallback(async () => {
    if (!user?.id) return null;
    try {
      const updated = await api.clearCart(user.id);
      setCart(updated);
      return updated;
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not clear your cart"));
      return null;
    }
  }, [user?.id]);

  const value = useMemo(() => {
    const items = cart?.items || [];
    return {
      cart,
      items,
      isLoading,
      mutatingItemId,
      refresh,
      addToCart,
      removeFromCart,
      clearCart,
      totalItems: items.reduce((sum, item) => sum + (item.quantity || 0), 0),
      totalPrice: items.reduce(
        (sum, item) => sum + (item.menuItem?.price || 0) * (item.quantity || 0),
        0
      ),
    };
  }, [cart, isLoading, mutatingItemId, refresh, addToCart, removeFromCart, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// The provider and its hook live together by design; this only costs HMR granularity.
// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
