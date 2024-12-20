import axios from "axios";

export const fetchTableNames = async (baseID: string): Promise<string[]> => {
  try {
    const response = await axios.get(
      `https://api.airtable.com/v0/meta/bases/${baseID}/tables`,
      {
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_API_KEY}`, // Use your env variable
        },
      }
    );

    // Extract and return only the table names
    return response.data.tables.map((table: { name: string }) => table.name);
  } catch (error) {
    console.error("Error fetching Airtable table names:", error);
    throw new Error("Failed to fetch table names");
  }
};
