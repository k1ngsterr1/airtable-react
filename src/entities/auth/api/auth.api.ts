import axios from "axios";
import { LoginDto } from "./auth.dto";
import { apiClient } from "@/shared/config/apiClient";

axios.defaults.withCredentials = true;

export const login = async (data: LoginDto) => {
  try {
    if (typeof window === "undefined") return;
    const response = await apiClient.post("/auth/login", data);
    console.log("Login successful:", response.data);

    localStorage.setItem("id", JSON.stringify(response.data.uid));

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error("Login failed with status:", error.response.status);
    } else {
      console.error("Login error:", error);
    }
    throw error;
  }
};

export const logout = async () => {
  try {
    const response = await apiClient.get("/admin/auth/logout");

    return response.data;
  } catch (error) {
    throw error;
  }
};
