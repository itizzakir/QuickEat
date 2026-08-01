import { allRestaurants } from '../components/mockData';

const USERS_KEY = 'quickbite_users_v3';
const RESTAURANTS_KEY = 'quickbite_restaurants_v3';
const ORDERS_KEY = 'quickbite_orders_v3';
const CART_KEY = 'quickbite_cart_v3';

// Initial Demo Users
const initialUsers = [
  {
    id: 1,
    fullName: 'Demo Customer',
    email: 'customer@quickbite.com',
    password: 'password',
    role: 'CUSTOMER',
    phone: '1234567890',
    address: '123 Main St, City'
  },
  {
    id: 2,
    fullName: 'Demo Restaurant',
    email: 'restaurant@quickbite.com',
    password: 'password',
    role: 'RESTAURANT',
    phone: '0987654321',
    restaurantId: 1 // Links to first restaurant
  },
  {
    id: 3,
    fullName: 'Demo Delivery',
    email: 'delivery@quickbite.com',
    password: 'password',
    role: 'DELIVERY_PARTNER',
    phone: '1122334455',
    vehicleType: 'BIKE',
    city: 'Hyderabad'
  },
  {
    id: 4,
    fullName: 'Demo Admin',
    email: 'admin@quickbite.com',
    password: 'password',
    role: 'ADMIN',
  }
];

// Initialize Data
export const initializeMockData = () => {
  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify(initialUsers));
  }
  if (!localStorage.getItem(RESTAURANTS_KEY)) {
    localStorage.setItem(RESTAURANTS_KEY, JSON.stringify(allRestaurants));
  }
  if (!localStorage.getItem(ORDERS_KEY)) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify([]));
  }
};

// Helper to simulate network delay
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi = {
  // --- AUTH ---
  login: async (email, password) => {
    await delay();
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      const { password, ...userWithoutPassword } = user;
      // Ensure token is present
      return { ...userWithoutPassword, token: 'mock-jwt-token-' + Date.now() };
    }
    throw new Error('Invalid credentials');
  },

  register: async (userData) => {
    await delay();
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    if (users.find(u => u.email === userData.email)) {
      throw new Error('User already exists');
    }
    
    // Normalize role to uppercase for consistency
    const role = (userData.role || 'CUSTOMER').toUpperCase();
    
    const newUser = { 
        ...userData, 
        id: Date.now(), 
        role: role 
    };
    
    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    const { password, ...userWithoutPassword } = newUser;
    return { ...userWithoutPassword, token: 'mock-jwt-token-' + Date.now() };
  },

  // --- RESTAURANTS ---
  getRestaurants: async () => {
    await delay();
    return JSON.parse(localStorage.getItem(RESTAURANTS_KEY) || '[]');
  },

  getRestaurantById: async (id) => {
    await delay();
    const restaurants = JSON.parse(localStorage.getItem(RESTAURANTS_KEY) || '[]');
    return restaurants.find(r => r.id === parseInt(id));
  },

  // --- ORDERS ---
  createOrder: async (orderData) => {
    await delay();
    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    const newOrder = {
      ...orderData,
      id: Date.now(),
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };
    orders.push(newOrder);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    return newOrder;
  },

  getOrders: async (role, userId) => {
    await delay();
    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    if (role === 'CUSTOMER') {
        return orders.filter(o => o.customerId === userId);
    } else if (role === 'RESTAURANT') {
        return orders.filter(o => o.restaurantId === userId);
    } else if (role === 'DELIVERY_PARTNER') {
        return orders.filter(o => o.status === 'READY_FOR_DELIVERY' || o.deliveryPartnerId === userId);
    } else if (role === 'ADMIN') {
        return orders;
    }
    return [];
  },
  
  updateOrderStatus: async (orderId, status) => {
      await delay();
      const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
      const index = orders.findIndex(o => o.id === orderId);
      if (index !== -1) {
          orders[index].status = status;
          localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
          return orders[index];
      }
      throw new Error('Order not found');
  },

  // --- USERS (ADMIN) ---
  getAllUsers: async () => {
      await delay();
      return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  },

  // --- CART ---
  getCart: async () => {
    await delay();
    return JSON.parse(localStorage.getItem(CART_KEY) || '{"items": []}');
  },

  addToCart: async (menuItem, quantity = 1) => {
    await delay();
    const cart = JSON.parse(localStorage.getItem(CART_KEY) || '{"items": []}');
    const existingItemIndex = cart.items.findIndex(item => item.menuItem.id === menuItem.id);

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({
        id: Date.now(),
        menuItem,
        quantity
      });
    }
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    return cart;
  },

  removeFromCart: async (cartItemId) => {
    await delay();
    const cart = JSON.parse(localStorage.getItem(CART_KEY) || '{"items": []}');
    cart.items = cart.items.filter(item => item.id !== cartItemId);
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    return cart;
  },

  clearCart: async () => {
    await delay();
    localStorage.setItem(CART_KEY, JSON.stringify({ items: [] }));
    return { items: [] };
  }
};