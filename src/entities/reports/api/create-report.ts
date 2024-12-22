import { apiClient } from "@/shared/config/apiClient";
import { CreateReportDto } from "./dto/create-report.dto";

export const createReport = async (reportData: CreateReportDto) => {
  const response = await apiClient.post("/reports", reportData);
  console.log("response data is here:", response.data);
  return response.data;
};
