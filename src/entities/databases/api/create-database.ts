import { apiClient } from "@/shared/config/apiClient";

interface Database {
  databaseID: string;
  name: string;
}

export const createDatabase = async (database: Database) => {
  const response = await apiClient.post("/databases", database);
  return response.data;
};
