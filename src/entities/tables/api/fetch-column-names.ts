import Airtable from "airtable";

export const fetchColumnNames = async (tableName: string, baseID: string) => {
  const base = new Airtable({
    apiKey: import.meta.env.VITE_API_KEY,
  }).base(baseID);

  try {
    const records = await base(tableName).select({}).firstPage();

    console.log(
      "records:",
      records.map((record) => record.fields)
    );

    if (records.length > 0) {
      const allColumns = new Set();
      records.forEach((record) => {
        Object.keys(record.fields).forEach((field) => allColumns.add(field));
      });
      console.log("All detected columns:", Array.from(allColumns));
      return Array.from(allColumns).filter(
        (columnName) => columnName !== "Name"
      );
    }
  } catch (error) {
    console.error("Error fetching column names:", error);
    return [];
  }
};
