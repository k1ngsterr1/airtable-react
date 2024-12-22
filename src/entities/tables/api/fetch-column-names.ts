import Airtable from "airtable";

export const fetchColumnNames = async (tableName: string, baseID: string) => {
  const base = new Airtable({
    apiKey: import.meta.env.VITE_API_KEY,
  }).base(baseID);

  try {
    const records = await base(tableName).select({ maxRecords: 1 }).firstPage();

    if (records.length > 0) {
      const allColumns = Object.keys(records[0].fields); // Extract all column names
      return allColumns.filter((columnName) => columnName !== "Name"); // Exclude "Name"
    }
  } catch (error) {
    console.error("Error fetching column names:", error);
    return [];
  }
};
