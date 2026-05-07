import api from "../services/api";

// Submit ratings
export const submitRating = async (data) => {
  const response = await api.post("ratings/", data);
  return response.data;
};

// Get ratings
export const getUserRatings = async (userId) => {
  const response = await api.get(`ratings/user/${userId}/`);
  return response.data;
};