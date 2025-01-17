export interface FilterRdo {
  column: string; // Name of the column being filtered
  values: string[]; // Array of selected values
  booleanValue?: boolean; // Optional boolean filter
  filters: any;
  range?: { min: number; max: number }; // Optional range filter for numeric values
}
export interface ResultRdo {
  fields: {
    Name?: string;
    [key: string]: any;
  };
  requirement: string; // Optional field if extracted from "fields"
  filter: string; // Applied filter description
}

export interface GetReportRdo {
  id: string; // Unique identifier for the report
  name: string;
  tableName: string; // Name of the table the report is based on
  tableNames: string[];
  filters: FilterRdo[]; // Array of applied filters
  results: ResultRdo[]; // Array of results from the report
  author: string; // Author or user who created the report
  createdAt: Date; // Timestamp of when the report was created
}
