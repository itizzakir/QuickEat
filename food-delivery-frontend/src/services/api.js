import axios from 'axios';
import { getToken } from './session';

const API_URL = '/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
});

/**
 * Called when the server rejects our credentials mid-session. AuthContext registers the real
 * handler on mount; until then we do nothing, because there is no session to tear down.
 *
 * This indirection exists because interceptors live outside React and cannot use hooks.
 */
let onSessionExpired = () => {};

export function setSessionExpiredHandler(handler) {
  onSessionExpired = typeof handler === 'function' ? handler : () => {};
}

axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const hadToken = Boolean(getToken());

    // A 401 always means the token is gone or expired. A 403 while holding a token can be a
    // legitimate "you may not do that" — but if we never had a token, both mean "log in".
    // Without this, an expired token left every dashboard spinning on "Loading..." forever.
    if (hadToken && status === 401) {
      onSessionExpired('Your session has expired. Please sign in again.');
    } else if (!hadToken && (status === 401 || status === 403)) {
      onSessionExpired('Please sign in to continue.');
    }

    return Promise.reject(error);
  }
);

/** Pulls the useful message out of an axios error, whatever shape the failure took. */
export function apiErrorMessage(error, fallback = 'Something went wrong') {
  const data = error?.response?.data;
  if (data?.fieldErrors) {
    const first = Object.values(data.fieldErrors)[0];
    if (first) return first;
  }
  return data?.message || data?.error || error?.message || fallback;
}

export { axiosInstance };

const unwrap = (promise) => promise.then((response) => response.data);

// ---------------------------------------------------------------- auth

export const authApi = {
  me: () => unwrap(axiosInstance.get('/auth/me')),
  changePassword: ({ currentPassword, newPassword }) =>
    unwrap(axiosInstance.post('/auth/change-password', { currentPassword, newPassword })),
};

// ---------------------------------------------------------------- addresses

export const addressApi = {
  list: () => unwrap(axiosInstance.get('/users/me/addresses')),
  create: (payload) => unwrap(axiosInstance.post('/users/me/addresses', payload)),
  update: (id, payload) => unwrap(axiosInstance.put(`/users/me/addresses/${id}`, payload)),
  makeDefault: (id) => unwrap(axiosInstance.patch(`/users/me/addresses/${id}/default`)),
  remove: (id) => unwrap(axiosInstance.delete(`/users/me/addresses/${id}`)),
};

// ---------------------------------------------------------------- catalogue

export const restaurantApi = {
  list: (category) =>
    unwrap(
      axiosInstance.get('/restaurants', {
        params: category && category !== 'All' ? { category } : {},
      })
    ),
  byId: (id) => unwrap(axiosInstance.get(`/restaurants/${id}`)),
  /** The authenticated owner's own restaurant — never guess an id. */
  mine: () => unwrap(axiosInstance.get('/restaurants/my')),
  update: (id, payload) => unwrap(axiosInstance.put(`/restaurants/${id}`, payload)),
  orders: (id, { page = 0, size = 20 } = {}) =>
    unwrap(axiosInstance.get(`/restaurants/${id}/orders`, { params: { page, size } })),
};

// ---------------------------------------------------------------- menu

export const menuApi = {
  list: (restaurantId) => unwrap(axiosInstance.get(`/restaurants/${restaurantId}/menu`)),
  create: (restaurantId, payload) =>
    unwrap(axiosInstance.post(`/restaurants/${restaurantId}/menu`, payload)),
  update: (restaurantId, itemId, payload) =>
    unwrap(axiosInstance.put(`/restaurants/${restaurantId}/menu/${itemId}`, payload)),
  setAvailability: (restaurantId, itemId, available) =>
    unwrap(
      axiosInstance.patch(`/restaurants/${restaurantId}/menu/${itemId}/availability`, {
        available,
      })
    ),
  remove: (restaurantId, itemId) =>
    unwrap(axiosInstance.delete(`/restaurants/${restaurantId}/menu/${itemId}`)),
};

// ---------------------------------------------------------------- orders

export const orderApi = {
  create: ({ items, deliveryAddress, paymentMethod }) =>
    unwrap(axiosInstance.post('/orders', { items, deliveryAddress, paymentMethod })),
  forUser: (userId) => unwrap(axiosInstance.get(`/orders/user/${userId}`)),
  /** Kitchen-side transition. Couriers use deliveryApi.updateStatus instead. */
  updateStatus: (orderId, status) =>
    unwrap(axiosInstance.put(`/orders/${orderId}/status`, { status })),
};

// ---------------------------------------------------------------- cart

export const cartApi = {
  get: (userId) => unwrap(axiosInstance.get(`/cart/${userId}`)),
  // The cart owner comes from the JWT, so no user id is sent.
  add: (menuItem, quantity = 1) =>
    unwrap(axiosInstance.post('/cart/add', { menuItemId: menuItem.id, quantity })),
  remove: (itemId) => unwrap(axiosInstance.delete(`/cart/remove/${itemId}`)),
  clear: (userId) => unwrap(axiosInstance.post(`/cart/clear/${userId}`)),
};

// ---------------------------------------------------------------- delivery

export const deliveryApi = {
  available: () => unwrap(axiosInstance.get('/delivery/available')),
  accept: (orderId) => unwrap(axiosInstance.post(`/delivery/orders/${orderId}/accept`)),
  myDeliveries: () => unwrap(axiosInstance.get('/delivery/my-deliveries')),
  updateStatus: (orderId, status) =>
    unwrap(axiosInstance.patch(`/delivery/orders/${orderId}/status`, { status })),
  earnings: () => unwrap(axiosInstance.get('/delivery/earnings')),
  profile: () => unwrap(axiosInstance.get('/delivery/profile')),
  saveProfile: (payload) => unwrap(axiosInstance.put('/delivery/profile', payload)),
  setAvailability: (available) =>
    unwrap(axiosInstance.patch('/delivery/availability', { available })),
};

// ---------------------------------------------------------------- admin

export const adminApi = {
  users: ({ role, search, page = 0, size = 10 } = {}) =>
    unwrap(
      axiosInstance.get('/admin/users', {
        params: {
          ...(role ? { role } : {}),
          ...(search ? { search } : {}),
          page,
          size,
        },
      })
    ),
  user: (id) => unwrap(axiosInstance.get(`/admin/users/${id}`)),
  createUser: (payload) => unwrap(axiosInstance.post('/admin/users', payload)),
  updateUser: (id, payload) => unwrap(axiosInstance.put(`/admin/users/${id}`, payload)),
  setUserEnabled: (id, enabled) =>
    unwrap(axiosInstance.patch(`/admin/users/${id}/enabled`, { enabled })),
  deleteUser: (id) => unwrap(axiosInstance.delete(`/admin/users/${id}`)),

  restaurants: () => unwrap(axiosInstance.get('/admin/restaurants')),
  setRestaurantApproved: (id, approved) =>
    unwrap(axiosInstance.patch(`/admin/restaurants/${id}/approved`, { approved })),
  deleteRestaurant: (id) => unwrap(axiosInstance.delete(`/admin/restaurants/${id}`)),

  deliveryPartners: () => unwrap(axiosInstance.get('/admin/delivery-partners')),
  stats: () => unwrap(axiosInstance.get('/admin/stats')),
};

/**
 * Flat facade kept for the customer-facing screens that already use it. New code should reach
 * for the typed groups above.
 */
export const api = {
  getMe: authApi.me,
  changePassword: authApi.changePassword,

  getRestaurants: restaurantApi.list,
  getRestaurantById: restaurantApi.byId,
  getMyRestaurant: restaurantApi.mine,
  getRestaurantOrders: restaurantApi.orders,
  updateOrderStatus: orderApi.updateStatus,

  createOrder: orderApi.create,
  getOrders: orderApi.forUser,

  getCart: cartApi.get,
  addToCart: cartApi.add,
  removeFromCart: cartApi.remove,
  clearCart: cartApi.clear,
};
