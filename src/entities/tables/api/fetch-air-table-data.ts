import Airtable from "airtable";

const base = new Airtable({
  apiKey:
    "patsjQuI8V5XwmwoD.0803e1f55e76714c05c4e10fee04bdee8f6f423f4f964654195884d9ca45e07f",
}).base("appqzR1trQZxfKZ0H");

export const fetchTableData = async (tableName: string) => {
  try {
    const records = await base(tableName).select({}).all();

    const columnValues = records.map((record) => record.fields);

    return columnValues;
  } catch (error) {
    console.error("Error fetching table data:", error);
    return [];
  }
};
