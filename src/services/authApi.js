import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/auth/api/v1/Auth';

export const registerUser = async (userData) => {
  const response = await axios.post(`${API_BASE_URL}/register`, userData);
  return response.data;
};

export const sendVerificationEmail = async (email) => {
  const response = await axios.get(`${API_BASE_URL}/verifyEmail?email=${email}`);
  return response.data;
};

export const verifyCode = async (email, otp) => {
  const response = await axios.post(`${API_BASE_URL}/verifyEmail`, { email, otp });
  return response.data;
};

export const loginUser = async (email, password) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/login`, { email, password });
    if (response.status !== 200) {
      throw new Error(response.data.message || 'Đăng nhập thất bại!');
    }
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Lỗi kết nối đến server!');
  }
};

export const requestResetPassword = async (email) => {
  const response = await axios.get(`${API_BASE_URL}/resetPassword?email=${email}`);
  return response.data;
};

export const resetPassword = async (email, newPassword, otp) => {
  const response = await axios.patch(`${API_BASE_URL}/resetPassword`, { email, newPassword, otp });
  if (response.status !== 200) {
    throw new Error(response.data.message || 'Đổi mật khẩu thất bại!');
  }
  return response.data;
};