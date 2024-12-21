import { apiClient } from "@/shared/config/apiClient";

export const deleteReport = async (id: string) => {
  const response = await apiClient.delete(`/reports/${id}`);
  return response.data;
};
