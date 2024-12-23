import { apiClient } from "@/shared/config/apiClient";

export const deleteDatabase = async (id: number) => {
  const response = await apiClient.delete(`/databases/${id}`);
  return response.data;
};
