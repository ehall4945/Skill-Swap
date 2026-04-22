import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000/api",
});

// send rating
export const submitRating = (data) =>
  API.post("/ratings/", data);

// get user ratings
export const getUserRatings = (userId) =>
  API.get(`/ratings/user/${userId}/`);