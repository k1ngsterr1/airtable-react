import Airtable from "airtable";
import { Filter } from "./types";

// Initialize Airtable
const base = new Airtable({
  apiKey: import.meta.env.VITE_API_KEY,
}).base("appqzR1trQZxfKZ0H");

// Helper function to escape single quotes in values
const escapeSingleQuotes = (value: string) => value.replace(/'/g, "\\'");

export const handleCreateReport = async (
  filters: Filter[],
  selectedTableName: string | null
): Promise<{ id: string; fields: any }[]> => {
  // Validate input
  if (!selectedTableName || filters.length === 0) {
    console.error("Table name or filters are missing");
    return []; // Return an empty array if the input is invalid
  }

  // Construct filterByFormula for Airtable
  const filterByFormula = filters
    .map((filter) => {
      return filter.values
        .map(
          (value) =>
            // Use SEARCH() for multi-select or partial match fields
            `SEARCH('${escapeSingleQuotes(value)}', {${filter.column}})`
        )
        .join(" OR ");
    })
    .join(" AND ");

  console.log("Generated filter by formula:", filterByFormula);

  try {
    // Fetch records from Airtable using the generated formula
    const records = await base(selectedTableName)
      .select({
        filterByFormula,
      })
      .all();

    console.log("Records fetched successfully:", records);

    // Map and return the records with id and fields
    return records.map((record) => ({
      id: record.id,
      fields: record.fields,
    }));
  } catch (error) {
    console.error("Error fetching filtered records:", error);
    return []; // Return an empty array on error
  }
};
