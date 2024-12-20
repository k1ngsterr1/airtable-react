import axios from "axios";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // Use the variable defined in .env
  withCredentials: true,
});
