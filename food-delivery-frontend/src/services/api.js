import axios from 'axios';

const API_URL = '/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const storedUser = localStorage.getItem('quickbite_user_session_v2');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user?.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      } catch (error) {
        console.error("Error parsing user session:", error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const api = {
  // --- RESTAURANTS ---
  getRestaurants: async (category) => {
    try {
      const params = category && category !== 'All' ? { category } : {};
      const response = await axiosInstance.get(`/restaurants`, { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      throw error;
    }
  },

  getRestaurantById: async (id) => {
    try {
      const response = await axiosInstance.get(`/restaurants/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching restaurant with id ${id}:`, error);
      throw error;
    }
  },
  
  // --- ORDERS ---
  createOrder: async (orderData) => {
    try {
      const response = await axiosInstance.post(`/orders`, orderData);
      return response.data;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  },

  getOrders: async (userId) => {
    try {
      const response = await axiosInstance.get(`/orders/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching orders:", error);
      throw error;
    }
  },

  // --- CART ---
  getCart: async (userId) => {
    try {
      const response = await axiosInstance.get(`/cart/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching cart:", error);
      throw error;
    }
  },

  addToCart: async (userId, menuItem, quantity = 1) => {
    try {
      const response = await axiosInstance.post(`/cart/add`, {
        userId,
        menuItemId: menuItem.id,
        quantity
      });
      return response.data;
    } catch (error) {
      console.error("Error adding to cart:", error);
      throw error;
    }
  },

  removeFromCart: async (itemId) => {
    try {
      const response = await axiosInstance.delete(`/cart/remove/${itemId}`);
      return response.data;
    } catch (error) {
      console.error("Error removing from cart:", error);
      throw error;
    }
  },

  clearCart: async (userId) => {
    try {
      const response = await axiosInstance.post(`/cart/clear/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Error clearing cart:", error);
      throw error;
    }
  },
  
  // Keep other mock methods if needed, or we can slowly migrate them.
  // For now, we mix real API for restaurants with mock for others if needed, 
  // but the goal is to render restaurant/food from backend.
};
