import axios from 'axios';

const API_URL = '/api/users';

const getProfile = async (id) => {
  const user = JSON.parse(localStorage.getItem('quickbite_user_session_v2'));
  const token = user?.token;

  const response = await axios.get(`${API_URL}/profile/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

const updateProfile = async (id, userData) => {
  const user = JSON.parse(localStorage.getItem('quickbite_user_session_v2'));
  const token = user?.token;
  
  const response = await axios.put(`${API_URL}/profile/${id}`, userData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const userService = {
  getProfile,
  updateProfile
};
