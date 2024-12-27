import Airtable from "airtable";
import { Filter } from "./types";

const escapeSingleQuotes = (value: string) => value.replace(/'/g, "\\'");

const splitRangeValues = (value: string): string[] => {
  return value.split(",").map((range) => range.trim());
};

const generateFilterFormula = (filters: Filter[]): string => {
  return (
    "AND(" +
    filters
      .map((filter) => {
        return (
          "OR(" +
          filter.values
            .flatMap((value) => {
              // Split range values and create individual SEARCH conditions
              const ranges = splitRangeValues(value);
              return ranges.map(
                (range) =>
                  `({${filter.column}} = '${escapeSingleQuotes(range)}')`
              );
            })
            .join(", ") +
          ")"
        ); // Combine values with OR
      })
      .join(", ") +
    ")"
  ); // Combine filters with AND
};

// Fetch filtered records from Airtable
export const handleCreateReport = async (
  filters: Filter[],
  selectedTableName: string | null,
  baseID: string
): Promise<{ id: string; fields: any }[]> => {
  const base = new Airtable({
    apiKey: import.meta.env.VITE_API_KEY,
  }).base(baseID);

  // Validate input
  if (!selectedTableName || filters.length === 0) {
    console.error("Table name or filters are missing");
    return []; // Return an empty array if the input is invalid
  }

  // Generate the filterByFormula
  const filterByFormula = generateFilterFormula(filters);

  if (!filterByFormula) {
    console.error("Generated filterByFormula is empty. Skipping query.");
    return []; // Return an empty array if formula generation failed
  }

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
