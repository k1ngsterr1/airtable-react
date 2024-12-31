import { apiClient } from "@/shared/config/apiClient";

export const deleteAllReports = async () => {
  const response = await apiClient.delete(`/reports`);
  return response.data;
};
