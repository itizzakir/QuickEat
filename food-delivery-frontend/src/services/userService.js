import { axiosInstance } from './api';

/**
 * Profile calls now ride the shared axios instance, so the token is attached by the request
 * interceptor and a 401 is handled by the response interceptor. This module used to re-read
 * localStorage and hand-attach the header itself, which meant expired-token responses here
 * were silently swallowed.
 */

const getProfile = async (id) => {
  const response = await axiosInstance.get(`/users/profile/${id}`);
  return response.data;
};

const updateProfile = async (id, { fullName, mobile, address, avatarUrl }) => {
  const response = await axiosInstance.put(`/users/profile/${id}`, {
    fullName,
    mobile,
    address,
    avatarUrl,
  });
  return response.data;
};

export const userService = {
  getProfile,
  updateProfile,
};
