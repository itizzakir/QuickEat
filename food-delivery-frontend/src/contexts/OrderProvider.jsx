import React, { createContext, useState, useContext } from 'react';

// 1. Create the context
const OrderContext = createContext();

// 2. Create a custom hook for easy access to the context
export const useOrders = () => {
  return useContext(OrderContext);
};

// 3. Create the Provider component
export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);

  // Function to add a new order from the cart
  const addOrder = (cartItems, totalPrice) => {
    const newOrder = {
      id: `ORDER-${Date.now()}`, // Simple unique ID
      date: new Date(),
      items: cartItems,
      total: totalPrice,
      status: 'Processing', // You can add status tracking
    };
    
    // Add the new order to the beginning of the list
    setOrders(prevOrders => [newOrder, ...prevOrders]);
  };

  const value = {
    orders,
    addOrder,
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};