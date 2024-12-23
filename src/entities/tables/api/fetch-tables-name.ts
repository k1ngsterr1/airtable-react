import { apiClient } from "@/shared/config/apiClient";

export const fetchTableNames = async (
  baseID: string | undefined
): Promise<string[]> => {
  console.log("table ID is here:", baseID);

  if (!baseID) {
    throw new Error("Base ID is required to fetch table names.");
  }

  try {
    const response = await apiClient.get(`/airtable/tables`, {
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_API_KEY}`,
      },
      params: {
        baseID,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching Airtable table names:", error);
    throw new Error("Failed to fetch table names");
  }
};
