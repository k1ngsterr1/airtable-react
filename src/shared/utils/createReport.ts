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
  tableFilters: { tableName: string; filters: Filter[] }[], // Filters grouped by table
  baseID: string
): Promise<{ id: string; fields: any; tableName: string }[]> => {
  const base = new Airtable({
    apiKey: import.meta.env.VITE_API_KEY,
  }).base(baseID);

  if (!tableFilters || tableFilters.length === 0) {
    console.error("No filters or table names provided.");
    return [];
  }

  try {
    const allRecords: { id: string; fields: any; tableName: string }[] = [];

    for (const { tableName, filters } of tableFilters) {
      const filterByFormula = generateFilterFormula(filters);

      if (!filterByFormula) {
        console.error(
          `Generated filterByFormula is empty for table ${tableName}`
        );
        continue;
      }

      try {
        const records = await base(tableName)
          .select({
            filterByFormula,
          })
          .all();

        const mappedRecords = records.map((record) => ({
          id: record.id,
          fields: record.fields,
          tableName,
        }));

        allRecords.push(...mappedRecords);
      } catch (tableError) {
        console.error(
          `Error fetching records from table ${tableName}:`,
          tableError
        );
      }
    }

    return allRecords;
  } catch (error) {
    console.error("Error fetching filtered records:", error);
    return [];
  }
};
