import Airtable from "airtable";
import { Filter } from "./types";

const base = new Airtable({
  apiKey:
    "patsjQuI8V5XwmwoD.0803e1f55e76714c05c4e10fee04bdee8f6f423f4f964654195884d9ca45e07f",
}).base("appqzR1trQZxfKZ0H");

export const handleCreateReport = async (
  filters: Filter[],
  selectedTableName: string | null
): Promise<{ id: string; fields: any }[]> => {
  if (!selectedTableName || filters.length === 0) {
    console.error("Table name or filters are missing");
    return []; // Return an empty array if the input is invalid
  }

  const filterByFormula = filters
    .map((filter) => {
      return filter.values
        .map((value) => `{${filter.column}} = '${value}'`)
        .join(" OR ");
    })
    .join(" AND ");

  try {
    const records = await base(selectedTableName)
      .select({
        filterByFormula,
      })
      .all();

    return records.map((record) => ({
      id: record.id,
      fields: record.fields,
    })); // Return the filtered records
  } catch (error) {
    console.error("Error fetching filtered records:", error);
    return []; // Return an empty array on error
  }
};
