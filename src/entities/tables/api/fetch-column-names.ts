import Airtable from "airtable";

const base = new Airtable({
  apiKey:
    "patsjQuI8V5XwmwoD.0803e1f55e76714c05c4e10fee04bdee8f6f423f4f964654195884d9ca45e07f",
}).base("appqzR1trQZxfKZ0H");

export const fetchColumnNames = async (tableName: string) => {
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
