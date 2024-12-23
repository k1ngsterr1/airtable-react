import Airtable from "airtable";

export const fetchTableData = async (tableName: string, baseID: string) => {
  const base = new Airtable({
    apiKey: import.meta.env.VITE_API_KEY,
  }).base(baseID);

  try {
    const records = await base(tableName).select({}).all();

    const columnValues = records.map((record) => record.fields);

    return columnValues;
  } catch (error) {
    console.error("Error fetching table data:", error);
    return [];
  }
};
