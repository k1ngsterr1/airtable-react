import { apiClient } from "@/shared/config/apiClient";
import { GetDatabasesRDO } from "./rdo/get-databases.rdo";

export const getDatabases = async (): Promise<GetDatabasesRDO[]> => {
  try {
    const { data } = await apiClient.get<GetDatabasesRDO[]>("/databases");

    return data;
  } catch (error) {
    console.log("There was an error with fetching databases", error);
    throw new Error("Failed to fetch databases data");
  }
};
